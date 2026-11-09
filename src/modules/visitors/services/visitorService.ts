import { supabase } from '../../../lib/supabase';
import { 
  VisitorRecord, 
  VisitorStatus, 
  VisitorCategory, 
  VisitorEvent, 
  VisitorGate, 
  FlatWithResident,
  VisitorInvitation 
} from '../types/visitor';
import { visitorNotificationService } from './visitorNotificationService';
import { toast } from 'sonner';

export const VISITORS_TABLE = 'visitors';

// In-memory cache for residents map (60s TTL)
let cachedResidentsMap: Map<string, { name: string; flat: string; tower: string; phone: string }> | null = null;
let residentsCacheTime = 0;
const RESIDENTS_TTL_MS = 60000;

async function getCachedResidentsMap() {
  const now = Date.now();
  if (cachedResidentsMap && now - residentsCacheTime < RESIDENTS_TTL_MS) {
    return cachedResidentsMap;
  }
  const { data: resData } = await supabase.from('resident').select('resident_id, name, flat, tower, phone');
  const map = new Map<string, { name: string; flat: string; tower: string; phone: string }>();
  if (resData && Array.isArray(resData)) {
    resData.forEach((r: any) => {
      map.set(r.resident_id, {
        name: r.name,
        flat: r.flat,
        tower: r.tower,
        phone: r.phone
      });
    });
  }
  cachedResidentsMap = map;
  residentsCacheTime = now;
  return map;
}

// In-memory cache for gates (session)
let cachedGates: VisitorGate[] | null = null;

// In-flight promise cache for getVisitors deduplication
let visitorsInFlightPromise: Promise<VisitorRecord[]> | null = null;

// Map database row from public.visitors to full VisitorRecord
function mapRowToVisitorRecord(
  row: any, 
  residentsMap?: Map<string, { name: string; flat: string; tower: string; phone: string }>
): VisitorRecord {
  const resInfo = row.resident_id && residentsMap ? residentsMap.get(row.resident_id) : null;
  const rawStatus = String(row.status || 'pending').toLowerCase() as VisitorStatus;
  const rawApproval = String(row.approval_status || 'pending').toLowerCase() as 'pending' | 'approved' | 'rejected';
  
  const rawCat = String(row.category || row.visitor_type || 'guest').toLowerCase().replace(/\s+/g, '_');
  let category: VisitorCategory = 'guest';
  if (['guest', 'delivery', 'cab', 'maintenance', 'vendor', 'domestic_help', 'other'].includes(rawCat)) {
    category = rawCat as VisitorCategory;
  } else if (rawCat === 'relative') {
    category = 'guest';
  } else if (rawCat === 'service') {
    category = 'maintenance';
  }

  let cleanPurpose = row.purpose || 'Visit';
  let gateName = row.gate || 'Main Gate';
  let visitorCount = row.visitor_count || 1;
  let duration = row.expected_duration || '2 hours';
  let rejectionReason = row.rejection_reason || undefined;

  if (row.purpose && row.purpose.includes('|')) {
    const parts = row.purpose.split('|').map((p: string) => p.trim());
    cleanPurpose = parts[0] || 'Visit';
    for (const part of parts.slice(1)) {
      if (part.toLowerCase().startsWith('gate:')) {
        gateName = part.substring(5).trim();
      } else if (part.toLowerCase().startsWith('guests:')) {
        visitorCount = parseInt(part.substring(7).trim(), 10) || 1;
      } else if (part.toLowerCase().startsWith('duration:')) {
        duration = part.substring(9).trim();
      } else if (part.toLowerCase().startsWith('reason:')) {
        rejectionReason = part.substring(7).trim();
      }
    }
  }

  return {
    id: row.visitor_id || row.id,
    visitor_id: row.visitor_id || row.id,
    visitor_name: row.visitor_name || 'Guest Visitor',
    visitor_mobile: row.visitor_mobile || '',
    category,
    visitor_type: row.visitor_type || category.charAt(0).toUpperCase() + category.slice(1),
    vehicle_number: row.vehicle_number || undefined,
    profile_photo: row.profile_photo || undefined,
    resident_id: row.resident_id || '',
    resident_name: row.resident_name || resInfo?.name || '',
    flat_number: row.flat || resInfo?.flat || '',
    tower: row.tower || resInfo?.tower || '',
    gate_name: gateName,
    purpose: cleanPurpose,
    visitor_count: visitorCount,
    expected_duration: duration,
    status: rawStatus,
    approval_status: rawApproval,
    rejection_reason: rejectionReason,
    security_id: row.security_id || undefined,
    security_user_name: row.security_user_name || undefined,
    security_user_mobile: row.security_user_mobile || undefined,
    security_user_shift: row.security_user_shift || undefined,
    created_at: row.created_at || new Date().toISOString(),
    approval_time: row.approval_time || undefined,
    approved_by: row.approved_by || undefined,
    rejected_time: row.rejected_time || undefined,
    rejected_by: row.rejected_by || undefined,
    entry_time: row.entry_time || undefined,
    checked_in_by: row.checked_in_by || (rawStatus === 'inside' || rawStatus === 'exited' ? row.security_user_name : undefined),
    exit_time: row.exit_time || undefined,
    checked_out_by: row.checked_out_by || (rawStatus === 'exited' ? row.security_user_name : undefined),
    is_invitation: row.is_invitation || false,
    invitation_code: row.invitation_code || undefined,
    valid_until: row.valid_until || undefined
  };
}

async function recordVisitorEvent(event: Omit<VisitorEvent, 'id' | 'event_time'>): Promise<void> {
  try {
    const payload = {
      visitor_id: Number(event.visitor_id),
      visitor_name: event.visitor_name,
      event_type: event.event_type,
      performed_by: event.performed_by,
      performer_role: event.performer_role || null,
      reason: event.reason || null,
      metadata: event.metadata || null,
      event_time: new Date().toISOString()
    };
    await supabase.from('visitor_events').insert([payload]);
  } catch (err) {
    console.warn('[recordVisitorEvent Warning]:', err);
  }
}

export const visitorService = {
  async getFlatsWithResidents(): Promise<FlatWithResident[]> {
    const { data, error } = await supabase
      .from('resident')
      .select('resident_id, name, tower, floor, flat, phone, role, occupancy_type')
      .order('tower', { ascending: true })
      .order('flat', { ascending: true });

    if (error) {
      console.error('[visitorService] Error fetching residents:', error.message);
      return [];
    }

    return (data || []).map((r: any) => ({
      flat_id: `${r.tower}-${r.flat}`,
      flat_number: r.flat || '',
      tower: r.tower || '',
      floor: r.floor || 1,
      resident_id: r.resident_id,
      resident_name: r.name,
      phone: r.phone || '',
      role: r.role || 'Owner',
      occupancy_type: r.occupancy_type || r.role || 'Owner'
    }));
  },

  async getGates(): Promise<VisitorGate[]> {
    if (cachedGates) return cachedGates;
    const { data, error } = await supabase
      .from('visitor_gates')
      .select('*')
      .eq('is_active', true)
      .order('gate_code', { ascending: true });

    if (error) {
      console.error('[visitorService] Error fetching visitor gates:', error.message);
      return [];
    }
    cachedGates = (data || []) as VisitorGate[];
    return cachedGates;
  },

  async getVisitors(filters?: {
    status?: string;
    resident_id?: string;
    category?: string;
    query?: string;
  }): Promise<VisitorRecord[]> {
    if (visitorsInFlightPromise && !filters?.resident_id) {
      return visitorsInFlightPromise;
    }

    const fetchTask = (async () => {
      try {
        const residentsMap = await getCachedResidentsMap();
        let query = supabase.from(VISITORS_TABLE).select('*').order('created_at', { ascending: false }).limit(200);

        if (filters?.resident_id) {
          query = query.eq('resident_id', filters.resident_id);
        }

        const { data: vRows, error } = await query;
        if (error) {
          throw error;
        }

        let records = (vRows || []).map(row => mapRowToVisitorRecord(row, residentsMap));

        if (filters?.status && filters.status !== 'all') {
          const targetStatus = filters.status.toLowerCase();
          records = records.filter(v => v.status === targetStatus);
        }

        if (filters?.category && filters.category !== 'all') {
          records = records.filter(v => v.category === filters.category);
        }

        if (filters?.query) {
          const q = filters.query.toLowerCase().trim();
          records = records.filter(v => 
            v.visitor_name.toLowerCase().includes(q) ||
            v.visitor_mobile.includes(q) ||
            (v.vehicle_number && v.vehicle_number.toLowerCase().includes(q)) ||
            (v.resident_name && v.resident_name.toLowerCase().includes(q)) ||
            (v.flat_number && v.flat_number.toLowerCase().includes(q)) ||
            v.purpose.toLowerCase().includes(q)
          );
        }

        return records;
      } catch (err: any) {
        console.warn('[visitorService] Fetch warning:', err?.message || err);
        return [];
      } finally {
        visitorsInFlightPromise = null;
      }
    })();

    if (!filters?.resident_id) {
      visitorsInFlightPromise = fetchTask;
    }
    return fetchTask;
  },

  async getVisitorById(visitorId: number | string): Promise<VisitorRecord | null> {
    const numId = Number(visitorId);
    let query = supabase.from(VISITORS_TABLE).select('*');
    if (!isNaN(numId) && numId > 0) {
      query = query.eq('visitor_id', numId);
    } else {
      query = query.eq('id', visitorId);
    }

    const { data, error } = await query.maybeSingle();
    if (error || !data) {
      return null;
    }
    const residentsMap = await getCachedResidentsMap();
    return mapRowToVisitorRecord(data, residentsMap);
  },

  async createVisitorRequest(params: {
    visitor_name: string;
    visitor_mobile: string;
    category: VisitorCategory;
    resident_id: string;
    resident_name: string;
    flat_number: string;
    tower: string;
    purpose: string;
    visitor_count: number;
    vehicle_number?: string;
    profile_photo?: string;
    gate_name?: string;
    expected_duration?: string;
    security_user_name?: string;
    security_user_mobile?: string;
    security_user_shift?: string;
  }): Promise<{ success: boolean; data?: VisitorRecord; error?: string }> {
    try {
      const payload = {
        visitor_name: params.visitor_name.trim(),
        visitor_mobile: params.visitor_mobile.trim(),
        visitor_type: params.category.charAt(0).toUpperCase() + params.category.slice(1).replace('_', ' '),
        category: params.category,
        vehicle_number: params.vehicle_number?.trim() || null,
        profile_photo: params.profile_photo || null,
        resident_id: params.resident_id,
        resident_name: params.resident_name,
        flat: params.flat_number,
        tower: params.tower,
        purpose: params.purpose.trim(),
        gate: params.gate_name || 'Main Gate',
        visitor_count: params.visitor_count || 1,
        expected_duration: params.expected_duration || '2 hours',
        status: 'pending',
        approval_status: 'pending',
        security_user_name: params.security_user_name || null,
        security_user_mobile: params.security_user_mobile || null,
        security_user_shift: params.security_user_shift || null,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(VISITORS_TABLE)
        .insert([payload])
        .select()
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Database insert failed');
      }

      const createdRecord = mapRowToVisitorRecord(data);

      await recordVisitorEvent({
        visitor_id: createdRecord.visitor_id,
        visitor_name: createdRecord.visitor_name,
        event_type: 'request_created',
        performed_by: params.security_user_name || 'Security Guard',
        performer_role: 'security',
        metadata: {
          gate: createdRecord.gate_name,
          flat: `${createdRecord.tower}-${createdRecord.flat_number}`,
          count: createdRecord.visitor_count
        }
      });

      visitorNotificationService.addNotification({
        recipient_user_id: params.resident_id,
        visitor_id: createdRecord.visitor_id,
        title: 'New Visitor Waiting at Gate',
        message: `Visitor ${createdRecord.visitor_name} is waiting at ${createdRecord.gate_name} for Flat ${createdRecord.tower}-${createdRecord.flat_number}.`,
        showToast: true,
        toastType: 'info'
      });

      return { success: true, data: createdRecord };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Visitor registration failed' };
    }
  },

  async approveVisitorRequest(
    visitorId: number | string,
    approvedByResidentId: string,
    approverName: string
  ): Promise<{ success: boolean; data?: VisitorRecord; error?: string }> {
    try {
      const now = new Date().toISOString();
      const numId = Number(visitorId);
      let query = supabase.from(VISITORS_TABLE).update({
        status: 'approved',
        approval_status: 'approved',
        approval_time: now,
        approved_by: approverName
      });

      if (!isNaN(numId) && numId > 0) {
        query = query.eq('visitor_id', numId);
      } else {
        query = query.eq('id', visitorId);
      }

      const { data, error } = await query.select().single();
      if (error || !data) {
        throw new Error(error?.message || 'Approval failed');
      }

      const updatedRecord = mapRowToVisitorRecord(data);

      await recordVisitorEvent({
        visitor_id: updatedRecord.visitor_id,
        visitor_name: updatedRecord.visitor_name,
        event_type: 'approved',
        performed_by: approverName,
        performer_role: 'resident',
        metadata: { resident_id: approvedByResidentId }
      });

      visitorNotificationService.addNotification({
        recipient_user_id: 'security',
        visitor_id: updatedRecord.visitor_id,
        title: 'Visitor Entry Approved',
        message: `${approverName} approved visitor ${updatedRecord.visitor_name}.`,
        showToast: true,
        toastType: 'success'
      });

      return { success: true, data: updatedRecord };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Approval failed' };
    }
  },

  async rejectVisitorRequest(
    visitorId: number | string,
    rejectedByResidentId: string,
    rejectorName: string,
    reason?: string
  ): Promise<{ success: boolean; data?: VisitorRecord; error?: string }> {
    try {
      const now = new Date().toISOString();
      const cleanReason = reason || 'Entry declined by resident';
      const numId = Number(visitorId);
      let query = supabase.from(VISITORS_TABLE).update({
        status: 'rejected',
        approval_status: 'rejected',
        rejected_time: now,
        rejected_by: rejectorName,
        rejection_reason: cleanReason
      });

      if (!isNaN(numId) && numId > 0) {
        query = query.eq('visitor_id', numId);
      } else {
        query = query.eq('id', visitorId);
      }

      const { data, error } = await query.select().single();
      if (error || !data) {
        throw new Error(error?.message || 'Rejection failed');
      }

      const updatedRecord = mapRowToVisitorRecord(data);

      await recordVisitorEvent({
        visitor_id: updatedRecord.visitor_id,
        visitor_name: updatedRecord.visitor_name,
        event_type: 'rejected',
        performed_by: rejectorName,
        performer_role: 'resident',
        reason: cleanReason,
        metadata: { resident_id: rejectedByResidentId }
      });

      return { success: true, data: updatedRecord };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Rejection failed' };
    }
  },

  async checkInVisitor(
    visitorId: number | string,
    guardUser: { name: string; phone?: string; shift?: string }
  ): Promise<{ success: boolean; data?: VisitorRecord; error?: string }> {
    try {
      const now = new Date().toISOString();
      const numId = Number(visitorId);
      let query = supabase.from(VISITORS_TABLE).update({
        status: 'inside',
        entry_time: now,
        checked_in_by: guardUser.name,
        security_user_name: guardUser.name,
        security_user_mobile: guardUser.phone || null,
        security_user_shift: guardUser.shift || null
      });

      if (!isNaN(numId) && numId > 0) {
        query = query.eq('visitor_id', numId);
      } else {
        query = query.eq('id', visitorId);
      }

      const { data, error } = await query.select().single();
      if (error || !data) {
        throw new Error(error?.message || 'Check-in failed');
      }

      const updatedRecord = mapRowToVisitorRecord(data);

      await recordVisitorEvent({
        visitor_id: updatedRecord.visitor_id,
        visitor_name: updatedRecord.visitor_name,
        event_type: 'check_in',
        performed_by: guardUser.name,
        performer_role: 'security',
        metadata: { entry_time: now }
      });

      return { success: true, data: updatedRecord };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Check-in failed' };
    }
  },

  async checkOutVisitor(
    visitorId: number | string,
    guardUser: { name: string }
  ): Promise<{ success: boolean; data?: VisitorRecord; error?: string }> {
    try {
      const now = new Date().toISOString();
      const numId = Number(visitorId);
      let query = supabase.from(VISITORS_TABLE).update({
        status: 'exited',
        exit_time: now,
        checked_out_by: guardUser.name
      });

      if (!isNaN(numId) && numId > 0) {
        query = query.eq('visitor_id', numId);
      } else {
        query = query.eq('id', visitorId);
      }

      const { data, error } = await query.select().single();
      if (error || !data) {
        throw new Error(error?.message || 'Check-out failed');
      }

      const updatedRecord = mapRowToVisitorRecord(data);

      await recordVisitorEvent({
        visitor_id: updatedRecord.visitor_id,
        visitor_name: updatedRecord.visitor_name,
        event_type: 'check_out',
        performed_by: guardUser.name,
        performer_role: 'security',
        metadata: { exit_time: now }
      });

      return { success: true, data: updatedRecord };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Check-out failed' };
    }
  },

  async cancelVisitorRequest(
    visitorId: number | string,
    reason?: string
  ): Promise<{ success: boolean; data?: VisitorRecord; error?: string }> {
    try {
      const cleanReason = reason || 'Cancelled';
      const numId = Number(visitorId);
      let query = supabase.from(VISITORS_TABLE).update({
        status: 'cancelled',
        rejection_reason: cleanReason
      });

      if (!isNaN(numId) && numId > 0) {
        query = query.eq('visitor_id', numId);
      } else {
        query = query.eq('id', visitorId);
      }

      const { data, error } = await query.select().single();
      if (error || !data) {
        throw new Error(error?.message || 'Cancellation failed');
      }

      const updatedRecord = mapRowToVisitorRecord(data);

      await recordVisitorEvent({
        visitor_id: updatedRecord.visitor_id,
        visitor_name: updatedRecord.visitor_name,
        event_type: 'cancelled',
        performed_by: 'User',
        reason: cleanReason
      });

      return { success: true, data: updatedRecord };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Cancellation failed' };
    }
  },

  async getVisitorEvents(visitorId?: number | string): Promise<VisitorEvent[]> {
    let query = supabase.from('visitor_events').select('*').order('event_time', { ascending: false }).limit(100);
    if (visitorId) {
      const numId = Number(visitorId);
      if (!isNaN(numId) && numId > 0) {
        query = query.eq('visitor_id', numId);
      }
    }
    const { data, error } = await query;
    if (error) return [];
    return (data || []).map((evt: any) => ({
      id: evt.id,
      visitor_id: evt.visitor_id,
      visitor_name: evt.visitor_name,
      event_type: evt.event_type,
      performed_by: evt.performed_by,
      performer_role: evt.performer_role || undefined,
      event_time: evt.event_time,
      reason: evt.reason || undefined,
      metadata: evt.metadata || undefined
    }));
  },

  async createInvitation(params: {
    visitor_name: string;
    visitor_mobile: string;
    category: VisitorCategory;
    resident_id: string;
    resident_name: string;
    flat_number: string;
    tower: string;
    expected_date: string;
    expected_time: string;
    valid_until: string;
    visitor_count: number;
    purpose: string;
    vehicle_number?: string;
  }): Promise<VisitorInvitation> {
    const code = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    const qrToken = `tt_inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const payload = {
      invitation_code: code,
      visitor_name: params.visitor_name.trim(),
      visitor_mobile: params.visitor_mobile.trim(),
      category: params.category,
      resident_id: params.resident_id,
      resident_name: params.resident_name,
      flat_number: params.flat_number,
      tower: params.tower,
      expected_date: params.expected_date || null,
      expected_time: params.expected_time || null,
      valid_until: params.valid_until || null,
      visitor_count: params.visitor_count || 1,
      purpose: params.purpose || 'Personal Guest',
      vehicle_number: params.vehicle_number?.trim() || null,
      status: 'active',
      created_at: new Date().toISOString(),
      qr_token: qrToken
    };

    const { data, error } = await supabase
      .from('visitor_invitations')
      .insert([payload])
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Invitation creation failed');
    }

    return {
      id: data.id,
      invitation_code: data.invitation_code,
      visitor_name: data.visitor_name,
      visitor_mobile: data.visitor_mobile,
      category: data.category as VisitorCategory,
      resident_id: data.resident_id,
      resident_name: data.resident_name,
      flat_number: data.flat_number,
      tower: data.tower,
      expected_date: data.expected_date || '',
      expected_time: data.expected_time || '',
      valid_until: data.valid_until || '',
      visitor_count: data.visitor_count,
      purpose: data.purpose,
      vehicle_number: data.vehicle_number || undefined,
      status: data.status,
      created_at: data.created_at,
      qr_token: data.qr_token
    };
  },

  async getInvitations(residentId?: string): Promise<VisitorInvitation[]> {
    let query = supabase.from('visitor_invitations').select('*').order('created_at', { ascending: false });
    if (residentId) {
      query = query.eq('resident_id', residentId);
    }
    const { data, error } = await query;
    if (error) return [];
    return (data || []).map((inv: any) => ({
      id: inv.id,
      invitation_code: inv.invitation_code,
      visitor_name: inv.visitor_name,
      visitor_mobile: inv.visitor_mobile,
      category: inv.category as VisitorCategory,
      resident_id: inv.resident_id,
      resident_name: inv.resident_name,
      flat_number: inv.flat_number,
      tower: inv.tower,
      expected_date: inv.expected_date || '',
      expected_time: inv.expected_time || '',
      valid_until: inv.valid_until || '',
      visitor_count: inv.visitor_count,
      purpose: inv.purpose,
      vehicle_number: inv.vehicle_number || undefined,
      status: inv.status,
      created_at: inv.created_at,
      qr_token: inv.qr_token
    }));
  },

  async cancelInvitation(invitationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('visitor_invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitationId);
    return !error;
  }
};
