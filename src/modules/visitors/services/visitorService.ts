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
import { initialResidents } from '../../../data';

const EVENTS_STORAGE_KEY = 'towertech_visitor_events';
const INVITATIONS_STORAGE_KEY = 'towertech_visitor_invitations';
const VISITORS_STORAGE_KEY = 'towertech_visitors_cache';

// Realistic seed records for Green Park Residency
const SEED_VISITORS: VisitorRecord[] = [
  {
    id: 1,
    visitor_id: 1,
    visitor_name: 'Neha Joshi',
    visitor_mobile: '9876543210',
    category: 'guest',
    visitor_type: 'Guest',
    vehicle_number: 'MH-12-AB-1234',
    resident_id: 'R001',
    resident_name: 'Karan Bodake',
    flat_number: '101',
    tower: 'A',
    gate_name: 'Main Gate',
    purpose: 'Family Visit',
    visitor_count: 2,
    expected_duration: '3 hours',
    status: 'inside',
    approval_status: 'approved',
    security_user_name: 'Amit Jadhav',
    security_user_shift: 'Morning',
    created_at: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    approval_time: new Date(Date.now() - 3600000 * 2.4).toISOString(),
    entry_time: new Date(Date.now() - 3600000 * 2).toISOString(),
    checked_in_by: 'Amit Jadhav'
  },
  {
    id: 2,
    visitor_id: 2,
    visitor_name: 'Kunal Deshmukh',
    visitor_mobile: '9822114455',
    category: 'delivery',
    visitor_type: 'Delivery',
    vehicle_number: 'MH-12-CD-5678',
    resident_id: 'R002',
    resident_name: 'Arya Sonawane',
    flat_number: '102',
    tower: 'A',
    gate_name: 'Main Gate',
    purpose: 'Amazon Package Delivery',
    visitor_count: 1,
    expected_duration: '30 mins',
    status: 'exited',
    approval_status: 'approved',
    security_user_name: 'Amit Jadhav',
    security_user_shift: 'Morning',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    approval_time: new Date(Date.now() - 3600000 * 3.9).toISOString(),
    entry_time: new Date(Date.now() - 3600000 * 3.8).toISOString(),
    exit_time: new Date(Date.now() - 3600000 * 3.4).toISOString(),
    checked_in_by: 'Amit Jadhav',
    checked_out_by: 'Amit Jadhav'
  },
  {
    id: 3,
    visitor_id: 3,
    visitor_name: 'Vikas Jadhav',
    visitor_mobile: '9890123456',
    category: 'maintenance',
    visitor_type: 'Maintenance',
    vehicle_number: 'MH-14-XY-9090',
    resident_id: 'R003',
    resident_name: 'Balaji Survase',
    flat_number: '103',
    tower: 'A',
    gate_name: 'Main Gate',
    purpose: 'AC Servicing & Gas Refill',
    visitor_count: 2,
    expected_duration: '2 hours',
    status: 'pending',
    approval_status: 'pending',
    security_user_name: 'Amit Jadhav',
    security_user_shift: 'Morning',
    created_at: new Date(Date.now() - 900000).toISOString()
  },
  {
    id: 4,
    visitor_id: 4,
    visitor_name: 'Rajesh Patil',
    visitor_mobile: '9871122334',
    category: 'cab',
    visitor_type: 'Cab',
    vehicle_number: 'MH-12-UB-4455',
    resident_id: 'R004',
    resident_name: 'Sneha Joshi',
    flat_number: '104',
    tower: 'A',
    gate_name: 'Main Gate',
    purpose: 'Uber Drop / Airport Transit',
    visitor_count: 1,
    expected_duration: '15 mins',
    status: 'inside',
    approval_status: 'approved',
    security_user_name: 'Amit Jadhav',
    security_user_shift: 'Morning',
    created_at: new Date(Date.now() - 1500000).toISOString(),
    approval_time: new Date(Date.now() - 1400000).toISOString(),
    entry_time: new Date(Date.now() - 1200000).toISOString(),
    checked_in_by: 'Amit Jadhav'
  },
  {
    id: 5,
    visitor_id: 5,
    visitor_name: 'Sunita Gaikwad',
    visitor_mobile: '9890334411',
    category: 'domestic_help',
    visitor_type: 'Domestic Help',
    resident_id: 'R001',
    resident_name: 'Karan Bodake',
    flat_number: '101',
    tower: 'A',
    gate_name: 'North Gate',
    purpose: 'Housekeeping & Cook Routine Entry',
    visitor_count: 1,
    expected_duration: '4 hours',
    status: 'inside',
    approval_status: 'approved',
    security_user_name: 'Amit Jadhav',
    security_user_shift: 'Morning',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    approval_time: new Date(Date.now() - 3600000 * 2.9).toISOString(),
    entry_time: new Date(Date.now() - 3600000 * 2.8).toISOString(),
    checked_in_by: 'Amit Jadhav'
  }
];

// Helper to run promise with strict timeout
async function withTimeout<T>(promise: Promise<T>, ms = 2500, fallback: T): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

// Helpers for cached visitor records in localStorage
function getStoredVisitors(): VisitorRecord[] {
  if (typeof window === 'undefined') return SEED_VISITORS;
  try {
    const raw = localStorage.getItem(VISITORS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(VISITORS_STORAGE_KEY, JSON.stringify(SEED_VISITORS));
      return SEED_VISITORS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_VISITORS;
  } catch {
    return SEED_VISITORS;
  }
}

function saveStoredVisitors(visitors: VisitorRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VISITORS_STORAGE_KEY, JSON.stringify(visitors));
  } catch (e) {
    console.warn('[visitorService] Failed to persist visitors to localStorage:', e);
  }
}

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
      console.warn('[visitorService] Failed to save visitor event:', e);
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
    console.warn('[visitorService] Failed to save invitations:', e);
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
  // 1. Fetch real resident list from Supabase or fallback directory
  async getFlatsWithResidents(): Promise<FlatWithResident[]> {
    const fallbackFlats: FlatWithResident[] = initialResidents.map(r => ({
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

    try {
      const fetchPromise = (async () => {
        const { data, error } = await supabase
          .from('resident')
          .select('*')
          .order('tower', { ascending: true })
          .order('flat', { ascending: true });

        if (!error && data && data.length > 0) {
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
        }
        return fallbackFlats;
      })();

      return await withTimeout(fetchPromise, 2000, fallbackFlats);
    } catch {
      return fallbackFlats;
    }
  },

  // 2. Fetch security gates from Supabase
  async getGates(): Promise<VisitorGate[]> {
    const defaultGates: VisitorGate[] = [
      { id: 'gate-01', society_id: 'GV2026', gate_name: 'Main Gate', gate_code: 'GATE-01', is_active: true },
      { id: 'gate-02', society_id: 'GV2026', gate_name: 'North Gate', gate_code: 'GATE-02', is_active: true }
    ];

    try {
      const fetchPromise = (async () => {
        const { data, error } = await supabase
          .from('visitor_gates')
          .select('*')
          .eq('is_active', true);

        if (!error && data && data.length > 0) {
          return data as VisitorGate[];
        }
        return defaultGates;
      })();

      return await withTimeout(fetchPromise, 2000, defaultGates);
    } catch {
      return defaultGates;
    }
  },

  // 3. Fetch all visitor records with resilient offline/cache fallback
  async getVisitors(filters?: {
    status?: string;
    resident_id?: string;
    category?: string;
    query?: string;
  }): Promise<VisitorRecord[]> {
    let list = getStoredVisitors();

    try {
      const fetchPromise = (async () => {
        // Load residents for name/flat resolution
        const { data: resData } = await supabase.from('resident').select('resident_id, name, flat, tower, phone');
        const residentsMap = new Map<string, { name: string; flat: string; tower: string; phone: string }>();
        if (resData && Array.isArray(resData)) {
          resData.forEach((r: any) => {
            residentsMap.set(r.resident_id, {
              name: r.name,
              flat: r.flat,
              tower: r.tower,
              phone: r.phone
            });
          });
        }

        // Query Supabase visitors table
        const { data: vRows, error } = await supabase
          .from('visitors')
          .select('*')
          .order('visitor_id', { ascending: false });

        if (!error && vRows && vRows.length > 0) {
          const remoteRecords = vRows.map(row => mapRowToVisitorRecord(row, residentsMap));
          // Merge remote records with any local offline additions that haven't synced yet
          const remoteIdSet = new Set(remoteRecords.map(r => String(r.id)));
          const unSyncedLocal = list.filter(local => !remoteIdSet.has(String(local.id)));
          const merged = [...unSyncedLocal, ...remoteRecords];
          saveStoredVisitors(merged);
          return merged;
        }
        return list;
      })();

      list = await withTimeout(fetchPromise, 2200, list);
    } catch {
      // Quiet fail-safe: serve cached list without throwing uncaught errors
    }

    // Apply in-memory filters
    let filteredList = [...list];

    if (filters?.status && filters.status !== 'all') {
      const targetStatus = filters.status.toLowerCase();
      filteredList = filteredList.filter(v => v.status === targetStatus);
    }

    if (filters?.resident_id) {
      filteredList = filteredList.filter(v => String(v.resident_id) === String(filters.resident_id));
    }

    if (filters?.category && filters.category !== 'all') {
      filteredList = filteredList.filter(v => v.category === filters.category);
    }

    if (filters?.query) {
      const q = filters.query.toLowerCase().trim();
      filteredList = filteredList.filter(v => 
        v.visitor_name.toLowerCase().includes(q) ||
        v.visitor_mobile.includes(q) ||
        (v.vehicle_number && v.vehicle_number.toLowerCase().includes(q)) ||
        (v.resident_name && v.resident_name.toLowerCase().includes(q)) ||
        (v.flat_number && v.flat_number.toLowerCase().includes(q)) ||
        v.purpose.toLowerCase().includes(q)
      );
    }

    return filteredList;
  },

  // 4. Get single visitor by ID
  async getVisitorById(visitorId: number | string): Promise<VisitorRecord | null> {
    const all = await this.getVisitors();
    return all.find(v => String(v.id) === String(visitorId) || String(v.visitor_id) === String(visitorId)) || null;
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
      const fullPurpose = `${params.purpose || 'Visit'} | Gate: ${params.gate_name || 'Main Gate'} | Guests: ${params.visitor_count || 1} | Duration: ${params.expected_duration || '2 hours'}`;
      const localId = Date.now();

      const newRecord: VisitorRecord = {
        id: localId,
        visitor_id: localId,
        visitor_name: params.visitor_name.trim(),
        visitor_mobile: params.visitor_mobile.trim(),
        category: params.category,
        visitor_type: params.category.charAt(0).toUpperCase() + params.category.slice(1).replace('_', ' '),
        vehicle_number: params.vehicle_number?.trim() || undefined,
        profile_photo: params.profile_photo || undefined,
        resident_id: params.resident_id,
        resident_name: params.resident_name,
        flat_number: params.flat_number,
        tower: params.tower,
        gate_name: params.gate_name || 'Main Gate',
        purpose: params.purpose || 'Visit',
        visitor_count: params.visitor_count || 1,
        expected_duration: params.expected_duration || '2 hours',
        status: 'pending',
        approval_status: 'pending',
        security_user_name: params.security_user_name || 'Amit Jadhav',
        security_user_mobile: params.security_user_mobile || '9876543210',
        security_user_shift: params.security_user_shift || 'Morning',
        created_at: new Date().toISOString()
      };

      // 1. Immediately store into local cache so UI reacts with zero latency
      const currentList = getStoredVisitors();
      saveStoredVisitors([newRecord, ...currentList]);

      // 2. Record audit event
      recordEvent({
        visitor_id: localId,
        visitor_name: newRecord.visitor_name,
        event_type: 'request_created',
        performed_by: params.security_user_name || 'Security Guard',
        performer_role: 'security',
        metadata: {
          gate: params.gate_name || 'Main Gate',
          flat: `${params.tower}-${params.flat_number}`,
          count: params.visitor_count
        }
      });

      // 3. Deliver in-app notification to the authorized resident
      visitorNotificationService.addNotification({
        recipient_user_id: params.resident_id,
        visitor_id: localId,
        title: 'New Visitor Waiting at Gate',
        message: `New visitor ${newRecord.visitor_name} is waiting at ${params.gate_name || 'Main Gate'} for Flat ${params.tower}-${params.flat_number}.`,
        showToast: true,
        toastType: 'info'
      });

      // 4. Safely attempt Supabase remote insert in background/with timeout
      const payload = {
        visitor_name: params.visitor_name.trim(),
        visitor_mobile: params.visitor_mobile.trim(),
        visitor_type: newRecord.visitor_type,
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

      try {
        const { data, error } = await supabase
          .from('visitors')
          .insert([payload])
          .select();

        if (!error && data && data.length > 0) {
          const remoteId = data[0].visitor_id;
          newRecord.id = remoteId;
          newRecord.visitor_id = remoteId;
          // Update local cache with remote DB ID
          const updatedList = getStoredVisitors().map(v => v.id === localId ? newRecord : v);
          saveStoredVisitors(updatedList);
        }
      } catch {
        // Graceful fallback: local record already saved
      }

      return { success: true, data: newRecord };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Visitor registration failed' };
    }
  },

  // 6. Resident approves visitor
  async approveVisitorRequest(
    visitorId: number | string,
    approvedByResidentId: string,
    approverName: string
  ): Promise<{ success: boolean; data?: VisitorRecord; error?: string }> {
    try {
      const now = new Date().toISOString();
      const currentList = getStoredVisitors();
      let targetRecord: VisitorRecord | null = null;

      const updatedList = currentList.map(v => {
        if (String(v.id) === String(visitorId) || String(v.visitor_id) === String(visitorId)) {
          targetRecord = {
            ...v,
            status: 'approved',
            approval_status: 'approved',
            approval_time: now,
            approved_by: approverName
          };
          return targetRecord;
        }
        return v;
      });

      if (!targetRecord) {
        return { success: false, error: 'Visitor record not found.' };
      }

      saveStoredVisitors(updatedList);

      // Audit event
      recordEvent({
        visitor_id: visitorId,
        visitor_name: targetRecord.visitor_name,
        event_type: 'approved',
        performed_by: approverName,
        performer_role: 'resident',
        metadata: { resident_id: approvedByResidentId }
      });

      // Notification for security
      visitorNotificationService.addNotification({
        recipient_user_id: 'security',
        visitor_id: visitorId,
        title: 'Visitor Entry Approved',
        message: `${approverName} approved visitor ${targetRecord.visitor_name}. You can now check them in.`,
        showToast: true,
        toastType: 'success'
      });

      // Background remote sync
      try {
        const numId = typeof visitorId === 'string' ? parseInt(visitorId, 10) : visitorId;
        if (!isNaN(numId)) {
          await supabase
            .from('visitors')
            .update({
              status: 'Approved',
              approval_status: 'Approved',
              approval_time: now
            })
            .eq('visitor_id', numId);
        }
      } catch {}

      return { success: true, data: targetRecord };
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
      const currentList = getStoredVisitors();
      let targetRecord: VisitorRecord | null = null;

      const updatedList = currentList.map(v => {
        if (String(v.id) === String(visitorId) || String(v.visitor_id) === String(visitorId)) {
          targetRecord = {
            ...v,
            status: 'rejected',
            approval_status: 'rejected',
            rejection_reason: reason || 'Entry declined by resident'
          };
          return targetRecord;
        }
        return v;
      });

      if (!targetRecord) {
        return { success: false, error: 'Visitor record not found.' };
      }

      saveStoredVisitors(updatedList);

      // Audit event
      recordEvent({
        visitor_id: visitorId,
        visitor_name: targetRecord.visitor_name,
        event_type: 'rejected',
        performed_by: rejectorName,
        performer_role: 'resident',
        reason: reason || 'Declined by resident',
        metadata: { resident_id: rejectedByResidentId }
      });

      // Notification to security
      visitorNotificationService.addNotification({
        recipient_user_id: 'security',
        visitor_id: visitorId,
        title: 'Visitor Request Rejected',
        message: `Visitor request for ${targetRecord.visitor_name} was rejected by ${rejectorName}.${reason ? ` Reason: ${reason}` : ''}`,
        showToast: true,
        toastType: 'warning'
      });

      // Background remote sync
      try {
        const numId = typeof visitorId === 'string' ? parseInt(visitorId, 10) : visitorId;
        if (!isNaN(numId)) {
          await supabase
            .from('visitors')
            .update({
              status: 'Rejected',
              approval_status: 'Rejected',
              purpose: `Reason: ${reason || 'Entry declined by resident'}`
            })
            .eq('visitor_id', numId);
        }
      } catch {}

      return { success: true, data: targetRecord };
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
      const currentList = getStoredVisitors();
      const existing = currentList.find(v => String(v.id) === String(visitorId) || String(v.visitor_id) === String(visitorId));

      if (!existing) {
        return { success: false, error: 'Visitor record not found in system.' };
      }

      if (existing.status === 'inside') {
        return { success: false, error: 'Visitor is already checked in and inside the society.' };
      }

      if (existing.status === 'exited') {
        return { success: false, error: 'Visitor has already exited. Cannot check in again.' };
      }

      if (existing.status === 'rejected') {
        return { success: false, error: 'Cannot check in a rejected visitor.' };
      }

      const now = new Date().toISOString();
      let updatedRecord: VisitorRecord | null = null;

      const updatedList = currentList.map(v => {
        if (String(v.id) === String(visitorId) || String(v.visitor_id) === String(visitorId)) {
          updatedRecord = {
            ...v,
            status: 'inside',
            entry_time: now,
            checked_in_by: guardUser.name || 'Security Guard',
            security_user_name: guardUser.name || v.security_user_name || 'Amit Jadhav',
            security_user_shift: guardUser.shift || v.security_user_shift || 'Morning'
          };
          return updatedRecord;
        }
        return v;
      });

      saveStoredVisitors(updatedList);

      // Audit event
      recordEvent({
        visitor_id: visitorId,
        visitor_name: existing.visitor_name,
        event_type: 'check_in',
        performed_by: guardUser.name || 'Security Guard',
        performer_role: 'security',
        metadata: { entry_time: now }
      });

      // Notify resident
      if (existing.resident_id) {
        visitorNotificationService.addNotification({
          recipient_user_id: existing.resident_id,
          visitor_id: visitorId,
          title: 'Visitor Entered Society',
          message: `${existing.visitor_name} has checked in and entered the society.`,
          showToast: true,
          toastType: 'info'
        });
      }

      // Remote sync
      try {
        const numId = typeof visitorId === 'string' ? parseInt(visitorId, 10) : visitorId;
        if (!isNaN(numId)) {
          await supabase
            .from('visitors')
            .update({
              status: 'Inside',
              entry_time: now,
              security_user_name: guardUser.name || 'Amit Jadhav',
              security_user_shift: guardUser.shift || 'Morning'
            })
            .eq('visitor_id', numId);
        }
      } catch {}

      return { success: true, data: updatedRecord || existing };
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
      const currentList = getStoredVisitors();
      const existing = currentList.find(v => String(v.id) === String(visitorId) || String(v.visitor_id) === String(visitorId));

      if (!existing) {
        return { success: false, error: 'Visitor record not found.' };
      }

      if (existing.status === 'exited') {
        return { success: false, error: 'Visitor has already exited the society.' };
      }

      if (existing.status !== 'inside') {
        return { success: false, error: 'Cannot check out a visitor who is not currently inside.' };
      }

      const now = new Date().toISOString();
      let updatedRecord: VisitorRecord | null = null;

      const updatedList = currentList.map(v => {
        if (String(v.id) === String(visitorId) || String(v.visitor_id) === String(visitorId)) {
          updatedRecord = {
            ...v,
            status: 'exited',
            exit_time: now,
            checked_out_by: guardUser.name || 'Security Guard'
          };
          return updatedRecord;
        }
        return v;
      });

      saveStoredVisitors(updatedList);

      // Audit event
      recordEvent({
        visitor_id: visitorId,
        visitor_name: existing.visitor_name,
        event_type: 'check_out',
        performed_by: guardUser.name || 'Security Guard',
        performer_role: 'security',
        metadata: { exit_time: now }
      });

      // Notify resident
      if (existing.resident_id) {
        visitorNotificationService.addNotification({
          recipient_user_id: existing.resident_id,
          visitor_id: visitorId,
          title: 'Visitor Exited Society',
          message: `${existing.visitor_name} has checked out and exited the society.`,
          showToast: true,
          toastType: 'info'
        });
      }

      // Remote sync
      try {
        const numId = typeof visitorId === 'string' ? parseInt(visitorId, 10) : visitorId;
        if (!isNaN(numId)) {
          await supabase
            .from('visitors')
            .update({
              status: 'Exited',
              exit_time: now
            })
            .eq('visitor_id', numId);
        }
      } catch {}

      return { success: true, data: updatedRecord || existing };
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
      const currentList = getStoredVisitors();
      let updatedRecord: VisitorRecord | null = null;

      const updatedList = currentList.map(v => {
        if (String(v.id) === String(visitorId) || String(v.visitor_id) === String(visitorId)) {
          updatedRecord = {
            ...v,
            status: 'cancelled',
            rejection_reason: reason
          };
          return updatedRecord;
        }
        return v;
      });

      saveStoredVisitors(updatedList);

      recordEvent({
        visitor_id: visitorId,
        visitor_name: updatedRecord?.visitor_name || 'Visitor',
        event_type: 'cancelled',
        performed_by: 'User',
        reason
      });

      try {
        const numId = typeof visitorId === 'string' ? parseInt(visitorId, 10) : visitorId;
        if (!isNaN(numId)) {
          await supabase
            .from('visitors')
            .update({ status: 'Cancelled' })
            .eq('visitor_id', numId);
        }
      } catch {}

      return { success: true, data: updatedRecord || undefined };
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
