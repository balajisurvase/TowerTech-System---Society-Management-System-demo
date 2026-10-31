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

const EVENTS_STORAGE_KEY = 'towertech_visitor_events';
const INVITATIONS_STORAGE_KEY = 'towertech_visitor_invitations';

// Helpers to read/write persistent event audit logs
function getStoredEvents(): VisitorEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function recordEvent(event: Omit<VisitorEvent, 'id' | 'event_time'>): VisitorEvent {
  const newEvt: VisitorEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...event,
    event_time: new Date().toISOString()
  };

  if (typeof window !== 'undefined') {
    try {
      const existing = getStoredEvents();
      const updated = [newEvt, ...existing].slice(0, 500);
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save visitor event:', e);
    }
  }

  return newEvt;
}

// Helpers for invitations
function getStoredInvitations(): VisitorInvitation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(INVITATIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveInvitations(invitations: VisitorInvitation[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(INVITATIONS_STORAGE_KEY, JSON.stringify(invitations));
  } catch (e) {
    console.warn('Failed to save invitations:', e);
  }
}

// Map database row from public.visitors to full VisitorRecord
function mapRowToVisitorRecord(
  row: any, 
  residentsMap: Map<string, { name: string; flat: string; tower: string; phone: string }>
): VisitorRecord {
  const resInfo = row.resident_id ? residentsMap.get(row.resident_id) : null;
  const rawStatus = String(row.status || 'Pending').toLowerCase() as VisitorStatus;
  const rawApproval = String(row.approval_status || 'Pending').toLowerCase() as 'pending' | 'approved' | 'rejected';
  
  // Parse category
  const rawType = String(row.visitor_type || 'Guest').toLowerCase().replace(/\s+/g, '_');
  let category: VisitorCategory = 'guest';
  if (['guest', 'delivery', 'cab', 'maintenance', 'vendor', 'domestic_help', 'other'].includes(rawType)) {
    category = rawType as VisitorCategory;
  } else if (rawType === 'relative') {
    category = 'guest';
  } else if (rawType === 'service') {
    category = 'maintenance';
  }

  // Parse structured metadata from purpose string if available
  // e.g. "Personal Visit | Gate: Main Gate | Guests: 2 | Duration: 2 hrs"
  let cleanPurpose = row.purpose || 'Visit';
  let gateName = 'Main Gate';
  let visitorCount = 1;
  let duration = '2 hours';
  let rejectionReason: string | undefined = undefined;

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
    visitor_type: row.visitor_type || 'Guest',
    vehicle_number: row.vehicle_number || undefined,
    profile_photo: row.profile_photo || undefined,
    resident_id: row.resident_id || '',
    resident_name: resInfo?.name || row.resident_name || 'Authorized Resident',
    flat_number: resInfo?.flat || row.flat || '101',
    tower: resInfo?.tower || row.tower || 'A',
    gate_name: gateName,
    purpose: cleanPurpose,
    visitor_count: visitorCount,
    expected_duration: duration,
    status: rawStatus,
    approval_status: rawApproval,
    rejection_reason: rejectionReason,
    security_user_name: row.security_user_name || 'Amit Jadhav',
    security_user_mobile: row.security_user_mobile || undefined,
    security_user_shift: row.security_user_shift || 'Morning',
    created_at: row.created_at || new Date().toISOString(),
    approval_time: row.approval_time || undefined,
    entry_time: row.entry_time || undefined,
    exit_time: row.exit_time || undefined,
    checked_in_by: row.status === 'Inside' || row.status === 'Exited' ? (row.security_user_name || 'Security') : undefined,
    checked_out_by: row.status === 'Exited' ? (row.security_user_name || 'Security') : undefined
  };
}

export const visitorService = {
  // 1. Fetch real resident list from Supabase
  async getFlatsWithResidents(): Promise<FlatWithResident[]> {
    try {
      const { data, error } = await supabase
        .from('resident')
        .select('*')
        .order('tower', { ascending: true })
        .order('flat', { ascending: true });

      if (error || !data) {
        console.warn('Failed to load residents from Supabase:', error);
        return [];
      }

      return data.map((r: any) => ({
        flat_id: `${r.tower}-${r.flat}`,
        flat_number: r.flat || '101',
        tower: r.tower || 'A',
        floor: r.floor || 1,
        resident_id: r.resident_id,
        resident_name: r.name,
        phone: r.phone || '',
        role: r.role || 'Owner',
        occupancy_type: r.occupancy_type || r.role || 'Owner'
      }));
    } catch (e) {
      console.warn('getFlatsWithResidents error:', e);
      return [];
    }
  },

  // 2. Fetch security gates from Supabase
  async getGates(): Promise<VisitorGate[]> {
    try {
      const { data, error } = await supabase
        .from('visitor_gates')
        .select('*')
        .eq('is_active', true);

      if (!error && data && data.length > 0) {
        return data as VisitorGate[];
      }
    } catch (e) {
      console.warn('Failed to query visitor_gates:', e);
    }

    return [
      { id: 'gate-01', society_id: 'GV2026', gate_name: 'Main Gate', gate_code: 'GATE-01', is_active: true },
      { id: 'gate-02', society_id: 'GV2026', gate_name: 'North Gate', gate_code: 'GATE-02', is_active: true }
    ];
  },

  // 3. Fetch all visitor records from Supabase
  async getVisitors(filters?: {
    status?: string;
    resident_id?: string;
    category?: string;
    query?: string;
  }): Promise<VisitorRecord[]> {
    try {
      // Load residents for name/flat resolution
      const { data: resData } = await supabase.from('resident').select('resident_id, name, flat, tower, phone');
      const residentsMap = new Map<string, { name: string; flat: string; tower: string; phone: string }>();
      (resData || []).forEach((r: any) => {
        residentsMap.set(r.resident_id, {
          name: r.name,
          flat: r.flat,
          tower: r.tower,
          phone: r.phone
        });
      });

      // Query Supabase visitors table
      const { data: vRows, error } = await supabase
        .from('visitors')
        .select('*')
        .order('visitor_id', { ascending: false });

      if (error) {
        console.error('Failed to query visitors from Supabase:', error);
        throw error;
      }

      let list = (vRows || []).map(row => mapRowToVisitorRecord(row, residentsMap));

      // Apply in-memory filters
      if (filters?.status && filters.status !== 'all') {
        const targetStatus = filters.status.toLowerCase();
        list = list.filter(v => v.status === targetStatus);
      }

      if (filters?.resident_id) {
        list = list.filter(v => v.resident_id === filters.resident_id);
      }

      if (filters?.category && filters.category !== 'all') {
        list = list.filter(v => v.category === filters.category);
      }

      if (filters?.query) {
        const q = filters.query.toLowerCase().trim();
        list = list.filter(v => 
          v.visitor_name.toLowerCase().includes(q) ||
          v.visitor_mobile.includes(q) ||
          (v.vehicle_number && v.vehicle_number.toLowerCase().includes(q)) ||
          (v.resident_name && v.resident_name.toLowerCase().includes(q)) ||
          (v.flat_number && v.flat_number.toLowerCase().includes(q)) ||
          v.purpose.toLowerCase().includes(q)
        );
      }

      return list;
    } catch (e) {
      console.error('getVisitors exception:', e);
      return [];
    }
  },

  // 4. Get single visitor by ID
  async getVisitorById(visitorId: number | string): Promise<VisitorRecord | null> {
    const numId = typeof visitorId === 'string' ? parseInt(visitorId, 10) : visitorId;
    const all = await this.getVisitors();
    return all.find(v => Number(v.id) === numId || String(v.id) === String(visitorId)) || null;
  },

  // 5. Create new visitor registration from Security Gate
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
      // Encode extra metadata cleanly into purpose string
      const fullPurpose = `${params.purpose || 'Visit'} | Gate: ${params.gate_name || 'Main Gate'} | Guests: ${params.visitor_count || 1} | Duration: ${params.expected_duration || '2 hours'}`;

      const payload = {
        visitor_name: params.visitor_name.trim(),
        visitor_mobile: params.visitor_mobile.trim(),
        visitor_type: params.category.charAt(0).toUpperCase() + params.category.slice(1).replace('_', ' '),
        vehicle_number: params.vehicle_number?.trim() || null,
        profile_photo: params.profile_photo || null,
        resident_id: params.resident_id,
        purpose: fullPurpose,
        status: 'Pending',
        approval_status: 'Pending',
        security_user_name: params.security_user_name || 'Amit Jadhav',
        security_user_mobile: params.security_user_mobile || '9876543210',
        security_user_shift: params.security_user_shift || 'Morning',
        entry_time: null
      };

      const { data, error } = await supabase
        .from('visitors')
        .insert([payload])
        .select();

      if (error || !data || data.length === 0) {
        console.error('Supabase visitor insert error:', error);
        return { success: false, error: error?.message || 'Database insert failed' };
      }

      const insertedRow = data[0];
      const record = mapRowToVisitorRecord(insertedRow, new Map([[
        params.resident_id, 
        { name: params.resident_name, flat: params.flat_number, tower: params.tower, phone: params.visitor_mobile }
      ]]));

      // Record audit event
      recordEvent({
        visitor_id: record.id,
        visitor_name: record.visitor_name,
        event_type: 'request_created',
        performed_by: params.security_user_name || 'Security Guard',
        performer_role: 'security',
        metadata: {
          gate: params.gate_name || 'Main Gate',
          flat: `${params.tower}-${params.flat_number}`,
          count: params.visitor_count
        }
      });

      // Deliver in-app notification to the authorized resident
      visitorNotificationService.addNotification({
        recipient_user_id: params.resident_id,
        visitor_id: record.id,
        title: 'New Visitor Waiting at Gate',
        message: `New visitor ${record.visitor_name} is waiting at ${params.gate_name || 'Main Gate'} for Flat ${params.tower}-${params.flat_number}.`,
        showToast: true,
        toastType: 'info'
      });

      return { success: true, data: record };
    } catch (e: any) {
      console.error('createVisitorRequest error:', e);
      return { success: false, error: e?.message || 'Unexpected error' };
    }
  },

  // 6. Resident approves visitor
  async approveVisitorRequest(
    visitorId: number | string,
    approvedByResidentId: string,
    approverName: string
  ): Promise<{ success: boolean; data?: VisitorRecord; error?: string }> {
    try {
      const numId = typeof visitorId === 'string' ? parseInt(visitorId, 10) : visitorId;
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('visitors')
        .update({
          status: 'Approved',
          approval_status: 'Approved',
          approval_time: now
        })
        .eq('visitor_id', numId)
        .select();

      if (error || !data || data.length === 0) {
        return { success: false, error: error?.message || 'Failed to update approval status in database' };
      }

      const updated = data[0];
      const record = mapRowToVisitorRecord(updated, new Map());

      // Audit event
      recordEvent({
        visitor_id: numId,
        visitor_name: updated.visitor_name,
        event_type: 'approved',
        performed_by: approverName,
        performer_role: 'resident',
        metadata: { resident_id: approvedByResidentId }
      });

      // In-app notification for security
      visitorNotificationService.addNotification({
        recipient_user_id: 'security',
        visitor_id: numId,
        title: 'Visitor Entry Approved',
        message: `${approverName} approved visitor ${updated.visitor_name}. You can now check them in.`,
        showToast: true,
        toastType: 'success'
      });

      return { success: true, data: record };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Approval failed' };
    }
  },

  // 7. Resident rejects visitor
  async rejectVisitorRequest(
    visitorId: number | string,
    rejectedByResidentId: string,
    rejectorName: string,
    reason?: string
  ): Promise<{ success: boolean; data?: VisitorRecord; error?: string }> {
    try {
      const numId = typeof visitorId === 'string' ? parseInt(visitorId, 10) : visitorId;

      // Append reason to purpose for persistence
      const { data: existing } = await supabase.from('visitors').select('purpose').eq('visitor_id', numId).single();
      const updatedPurpose = existing?.purpose 
        ? `${existing.purpose} | Reason: ${reason || 'Entry declined by resident'}`
        : `Reason: ${reason || 'Entry declined by resident'}`;

      const { data, error } = await supabase
        .from('visitors')
        .update({
          status: 'Rejected',
          approval_status: 'Rejected',
          purpose: updatedPurpose
        })
        .eq('visitor_id', numId)
        .select();

      if (error || !data || data.length === 0) {
        return { success: false, error: error?.message || 'Failed to reject visitor in database' };
      }

      const updated = data[0];
      const record = mapRowToVisitorRecord(updated, new Map());

      // Audit event
      recordEvent({
        visitor_id: numId,
        visitor_name: updated.visitor_name,
        event_type: 'rejected',
        performed_by: rejectorName,
        performer_role: 'resident',
        reason: reason || 'Declined by resident',
        metadata: { resident_id: rejectedByResidentId }
      });

      // Notification to security
      visitorNotificationService.addNotification({
        recipient_user_id: 'security',
        visitor_id: numId,
        title: 'Visitor Request Rejected',
        message: `Visitor request for ${updated.visitor_name} was rejected by ${rejectorName}.${reason ? ` Reason: ${reason}` : ''}`,
        showToast: true,
        toastType: 'warning'
      });

      return { success: true, data: record };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Rejection failed' };
    }
  },

  // 8. Security Checks In Visitor
  async checkInVisitor(
    visitorId: number | string,
    guardUser: { name: string; phone?: string; shift?: string }
  ): Promise<{ success: boolean; data?: VisitorRecord; error?: string }> {
    try {
      const numId = typeof visitorId === 'string' ? parseInt(visitorId, 10) : visitorId;

      // Verify current status first
      const { data: current, error: fetchErr } = await supabase
        .from('visitors')
        .select('*')
        .eq('visitor_id', numId)
        .single();

      if (fetchErr || !current) {
        return { success: false, error: 'Visitor record not found in database.' };
      }

      if (current.status === 'Inside') {
        return { success: false, error: 'Visitor is already checked in and inside the society.' };
      }

      if (current.status === 'Exited') {
        return { success: false, error: 'Visitor has already exited. Cannot check in again.' };
      }

      if (current.status === 'Rejected') {
        return { success: false, error: 'Cannot check in a rejected visitor.' };
      }

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('visitors')
        .update({
          status: 'Inside',
          entry_time: now,
          security_user_name: guardUser.name || current.security_user_name || 'Amit Jadhav',
          security_user_shift: guardUser.shift || current.security_user_shift || 'Morning'
        })
        .eq('visitor_id', numId)
        .select();

      if (error || !data || data.length === 0) {
        return { success: false, error: error?.message || 'Failed to update check-in in database.' };
      }

      const updated = data[0];
      const record = mapRowToVisitorRecord(updated, new Map());

      // Audit event
      recordEvent({
        visitor_id: numId,
        visitor_name: updated.visitor_name,
        event_type: 'check_in',
        performed_by: guardUser.name || 'Security Guard',
        performer_role: 'security',
        metadata: { entry_time: now }
      });

      // Notify resident
      if (updated.resident_id) {
        visitorNotificationService.addNotification({
          recipient_user_id: updated.resident_id,
          visitor_id: numId,
          title: 'Visitor Entered Society',
          message: `${updated.visitor_name} has checked in and entered the society.`,
          showToast: true,
          toastType: 'info'
        });
      }

      return { success: true, data: record };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Check-in failed' };
    }
  },

  // 9. Security Checks Out Visitor
  async checkOutVisitor(
    visitorId: number | string,
    guardUser: { name: string }
  ): Promise<{ success: boolean; data?: VisitorRecord; error?: string }> {
    try {
      const numId = typeof visitorId === 'string' ? parseInt(visitorId, 10) : visitorId;

      const { data: current, error: fetchErr } = await supabase
        .from('visitors')
        .select('*')
        .eq('visitor_id', numId)
        .single();

      if (fetchErr || !current) {
        return { success: false, error: 'Visitor record not found.' };
      }

      if (current.status === 'Exited') {
        return { success: false, error: 'Visitor has already exited the society.' };
      }

      if (current.status !== 'Inside') {
        return { success: false, error: 'Cannot check out a visitor who has not checked in.' };
      }

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('visitors')
        .update({
          status: 'Exited',
          exit_time: now
        })
        .eq('visitor_id', numId)
        .select();

      if (error || !data || data.length === 0) {
        return { success: false, error: error?.message || 'Failed to update check-out.' };
      }

      const updated = data[0];
      const record = mapRowToVisitorRecord(updated, new Map());

      // Audit event
      recordEvent({
        visitor_id: numId,
        visitor_name: updated.visitor_name,
        event_type: 'check_out',
        performed_by: guardUser.name || 'Security Guard',
        performer_role: 'security',
        metadata: { exit_time: now }
      });

      // Notify resident
      if (updated.resident_id) {
        visitorNotificationService.addNotification({
          recipient_user_id: updated.resident_id,
          visitor_id: numId,
          title: 'Visitor Exited Society',
          message: `${updated.visitor_name} has checked out and exited the society.`,
          showToast: true,
          toastType: 'info'
        });
      }

      return { success: true, data: record };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Check-out failed' };
    }
  },

  // 10. Cancel visitor request
  async cancelVisitorRequest(
    visitorId: number | string,
    reason?: string
  ): Promise<{ success: boolean; data?: VisitorRecord; error?: string }> {
    try {
      const numId = typeof visitorId === 'string' ? parseInt(visitorId, 10) : visitorId;
      const { data, error } = await supabase
        .from('visitors')
        .update({ status: 'Cancelled' })
        .eq('visitor_id', numId)
        .select();

      if (error || !data || data.length === 0) {
        return { success: false, error: error?.message || 'Failed to cancel visitor request' };
      }

      recordEvent({
        visitor_id: numId,
        visitor_name: data[0].visitor_name,
        event_type: 'cancelled',
        performed_by: 'User',
        reason
      });

      return { success: true, data: mapRowToVisitorRecord(data[0], new Map()) };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Cancellation failed' };
    }
  },

  // 11. Retrieve audit events
  getVisitorEvents(visitorId?: number | string): VisitorEvent[] {
    const all = getStoredEvents();
    if (!visitorId) return all;
    return all.filter(e => String(e.visitor_id) === String(visitorId));
  },

  // 12. Create pre-approved visitor invitation with QR
  createInvitation(params: {
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
  }): VisitorInvitation {
    const code = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    const qrToken = `tt_inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const invitation: VisitorInvitation = {
      id: `inv_${Date.now()}`,
      invitation_code: code,
      visitor_name: params.visitor_name.trim(),
      visitor_mobile: params.visitor_mobile.trim(),
      category: params.category,
      resident_id: params.resident_id,
      resident_name: params.resident_name,
      flat_number: params.flat_number,
      tower: params.tower,
      expected_date: params.expected_date,
      expected_time: params.expected_time,
      valid_until: params.valid_until,
      visitor_count: params.visitor_count || 1,
      purpose: params.purpose || 'Personal Guest',
      vehicle_number: params.vehicle_number,
      status: 'active',
      created_at: new Date().toISOString(),
      qr_token: qrToken
    };

    const existing = getStoredInvitations();
    saveInvitations([invitation, ...existing]);

    return invitation;
  },

  getInvitations(residentId?: string): VisitorInvitation[] {
    const all = getStoredInvitations();
    if (!residentId) return all;
    return all.filter(inv => inv.resident_id === residentId);
  },

  cancelInvitation(invitationId: string) {
    const all = getStoredInvitations();
    const updated = all.map(inv => inv.id === invitationId ? { ...inv, status: 'cancelled' as const } : inv);
    saveInvitations(updated);
  }
};
