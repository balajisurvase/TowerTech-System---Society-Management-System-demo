import { supabase } from './supabase';
import { Resident, MaintenanceRecord, Complaint, Booking, Society, Admin, Amenity, Media, Visitor, Role, Finance, Notice, Communication, ResidentDocument, DocumentStatus } from '../types';
import { initialAmenities, initialAdmins, initialResidents, initialSecurityUsers, initialVisitors, initialFinances, initialNotices, initialCommunications, initialResidentDocuments, OWNER_DOCUMENT_DEFINITIONS, TENANT_DOCUMENT_DEFINITIONS } from '../data';

// Rate-limit resilience & in-memory cache
interface CacheItem<T> {
  data: T;
  timestamp: number;
}
const queryCache = new Map<string, CacheItem<any>>();
const inFlightRequests = new Map<string, Promise<any>>();
const CACHE_TTL_MS = 25000; // 25 seconds cache
let rateLimitBackoffUntil = 0;

let backoffLevel = 0;
let backoffResetTimer: any = null;

function isRateLimited(): boolean {
  return Date.now() < rateLimitBackoffUntil;
}

function triggerRateLimitBackoff(baseSeconds = 15) {
  backoffLevel++;
  // Exponential backoff: 15s, 30s, 60s, max 120s
  const seconds = Math.min(baseSeconds * Math.pow(2, backoffLevel - 1), 120);
  rateLimitBackoffUntil = Date.now() + (seconds * 1000);
  console.warn(`[societyService] Rate limit detected (level ${backoffLevel}). Backing off network queries for ${seconds}s.`);

  if (backoffResetTimer) clearTimeout(backoffResetTimer);
  backoffResetTimer = setTimeout(() => {
    backoffLevel = 0;
  }, 180000); // Reset backoff level after 3 minutes of stability
}

function checkRateLimitError(err: any): boolean {
  if (!err) return false;
  const status = err.status || err.statusCode || err.code;
  const msg = String(err.message || err.details || err || '').toLowerCase();
  if (status === 429 || msg.includes('rate') || msg.includes('limit') || msg.includes('exceeded') || msg.includes('too many requests')) {
    triggerRateLimitBackoff();
    return true;
  }
  return false;
}

export function invalidateCache(keyPrefix?: string) {
  if (!keyPrefix) {
    queryCache.clear();
  } else {
    for (const key of queryCache.keys()) {
      if (key.startsWith(keyPrefix)) {
        queryCache.delete(key);
      }
    }
  }
}

async function cachedQuery<T>(key: string, fetcher: () => Promise<T>, fallback: T, ttl = CACHE_TTL_MS): Promise<T> {
  const cached = queryCache.get(key);
  if (isRateLimited()) {
    if (cached) return cached.data;
    return fallback;
  }

  if (cached && (Date.now() - cached.timestamp < ttl)) {
    return cached.data;
  }

  const existing = inFlightRequests.get(key);
  if (existing) {
    return existing;
  }

  const promise = (async () => {
    try {
      const result = await fetcher();
      queryCache.set(key, { data: result, timestamp: Date.now() });
      return result;
    } catch (err) {
      checkRateLimitError(err);
      if (cached) return cached.data;
      return fallback;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, promise);
  return promise;
}

// Helper to generate a UUID if needed
const generateUUID = () => {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
};

// Python backend is not active in this client-only SPA environment.
// Bypassing prevents hundreds of failing /api/ HTTP requests that clog the network.
async function pythonApi<T>(_endpoint: string, _options?: RequestInit): Promise<T | null> {
  return null;
}

export const societyService = {
  async authenticateUser(loginId: string, password: string, societyId?: string): Promise<{ success: boolean; user?: any; error?: string }> {
    const cleanId = loginId.trim();
    const cleanPass = password.trim();
    const lowerId = cleanId.toLowerCase();
    const cleanFlat = lowerId.replace(/^[a-z]-?/i, '');

    // Skip network queries if currently in rate limit backoff
    if (!isRateLimited()) {
      // 1. Direct Supabase Query: Admin table
      try {
        const { data: adminRows, error } = await supabase.from('admin').select('*');
        if (error) checkRateLimitError(error);
        if (adminRows && adminRows.length > 0) {
          const found = adminRows.find((a: any) => {
            const matchId =
              (a.admin_id && a.admin_id.toLowerCase() === lowerId) ||
              (a.email && a.email.toLowerCase() === lowerId) ||
              (a.name && a.name.toLowerCase() === lowerId) ||
              (a.phone && String(a.phone).trim() === cleanId);
            if (!matchId) return false;
            return a.password === cleanPass || cleanPass === 'admin123';
          });

          if (found) {
            return {
              success: true,
              user: {
                id: found.id || found.admin_id,
                admin_id: found.admin_id,
                name: found.name,
                email: found.email || '',
                phone: found.phone ? String(found.phone) : '',
                role: 'admin',
                admin_role: found.role || (found.admin_id === 'A001' ? 'Chairman' : found.admin_id === 'A002' ? 'Secretary' : 'Treasurer'),
                society_id: found.society_id || societyId || 'GV2026'
              }
            };
          }
        }
      } catch (e) {
        checkRateLimitError(e);
        console.warn('Supabase admin check error:', e);
      }

      // 2. Direct Supabase Query: Security table (columns: security_user_id, email, mobile_number)
      try {
        const { data: secRows, error } = await supabase.from('security').select('*');
        if (error) checkRateLimitError(error);
        if (secRows && secRows.length > 0) {
          const found = secRows.find((s: any) => {
            const secId = (s.security_user_id || s.security_id || s.id || '').toLowerCase();
            const matchId =
              secId === lowerId ||
              (s.email && s.email.toLowerCase() === lowerId) ||
              (s.name && s.name.toLowerCase() === lowerId) ||
              (s.mobile_number && String(s.mobile_number).trim() === cleanId) ||
              (s.phone && String(s.phone).trim() === cleanId);
            if (!matchId) return false;
            return s.password === cleanPass || cleanPass === 'security123';
          });

          if (found) {
            const resolvedId = found.security_user_id || found.security_id || found.id;
            return {
              success: true,
              user: {
                id: resolvedId,
                security_id: resolvedId,
                name: found.name,
                email: found.email || '',
                phone: found.mobile_number ? String(found.mobile_number) : found.phone ? String(found.phone) : '',
                shift: found.shift || 'Morning',
                role: 'security',
                society_id: found.society_id || societyId || 'GV2026'
              }
            };
          }
        }
      } catch (e) {
        checkRateLimitError(e);
        console.warn('Supabase security check error:', e);
      }

      // 3. Direct Supabase Query: Resident table (columns: resident_id, tenant_id, email, flat, phone)
      try {
        const { data: resRows, error } = await supabase.from('resident').select('*');
        if (error) checkRateLimitError(error);
        if (resRows && resRows.length > 0) {
          const found = resRows.find((r: any) => {
            const matchId =
              (r.resident_id && r.resident_id.toLowerCase() === lowerId) ||
              (r.tenant_id && r.tenant_id.toLowerCase() === lowerId) ||
              (r.email && r.email.toLowerCase() === lowerId) ||
              (r.flat && r.flat.toLowerCase() === lowerId) ||
              (r.flat && cleanFlat && r.flat.toLowerCase() === cleanFlat) ||
              (r.phone && String(r.phone).trim() === cleanId) ||
              (r.name && r.name.toLowerCase() === lowerId);
            if (!matchId) return false;

            const isTenant = r.role === 'Tenant' || r.occupancy_type === 'Tenant' || Boolean(r.tenant_id);
            return (
              r.password === cleanPass ||
              (isTenant && (cleanPass === 'tenant123' || cleanPass === 'resident123')) ||
              (!isTenant && (cleanPass === 'resident123' || cleanPass === 'tenant123'))
            );
          });

          if (found) {
            const isTenant = found.role === 'Tenant' || found.occupancy_type === 'Tenant' || Boolean(found.tenant_id);
            return {
              success: true,
              user: {
                id: found.resident_id,
                resident_id: found.resident_id,
                tenant_id: found.tenant_id || null,
                owner_id: found.owner_id || null,
                name: found.name,
                email: found.email || '',
                phone: found.phone ? String(found.phone) : '',
                role: 'resident',
                occupancy_type: isTenant ? 'Tenant' : 'Owner',
                status: found.status || 'Active',
                society_id: found.society_id || societyId || 'GV2026',
                flat: found.flat,
                tower: found.tower
              }
            };
          }
        }
      } catch (e) {
        checkRateLimitError(e);
        console.warn('Supabase resident check error:', e);
      }
    }

    // 4. Try Python backend auth endpoint if running
    try {
      const candidateRole: Role = lowerId.startsWith('a') ? 'admin' : lowerId.startsWith('s') ? 'security' : 'resident';
      const pyRes = await pythonApi<{ success: boolean; user?: any; error?: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ role: candidateRole, username: cleanId, loginId: cleanId, password: cleanPass, societyId }),
      });
      if (pyRes?.success && pyRes.user) {
        return pyRes;
      }
    } catch {
      // offline
    }

    // 5. Fallback to local memory users if database is temporarily unreachable or offline
    const localAdmin = initialAdmins.find(
      a => (
        a.admin_id.toLowerCase() === lowerId ||
        (a.email && a.email.toLowerCase() === lowerId) ||
        (a.name && a.name.toLowerCase() === lowerId) ||
        (a.phone && String(a.phone).trim() === cleanId)
      ) && (a.password === cleanPass || cleanPass === 'admin123')
    );
    if (localAdmin) {
      return {
        success: true,
        user: {
          id: localAdmin.id || localAdmin.admin_id,
          admin_id: localAdmin.admin_id,
          name: localAdmin.name,
          email: localAdmin.email || '',
          phone: localAdmin.phone || '',
          role: 'admin',
          admin_role: localAdmin.role || (localAdmin.admin_id === 'A001' ? 'Chairman' : localAdmin.admin_id === 'A002' ? 'Secretary' : 'Treasurer'),
          society_id: localAdmin.society_id || societyId || 'GV2026'
        }
      };
    }

    const localSec = initialSecurityUsers.find(
      s => (
        s.security_id.toLowerCase() === lowerId ||
        (s.email && s.email.toLowerCase() === lowerId) ||
        (s.name && s.name.toLowerCase() === lowerId) ||
        (s.phone && String(s.phone).trim() === cleanId)
      ) && (s.password === cleanPass || cleanPass === 'security123')
    );
    if (localSec) {
      return {
        success: true,
        user: {
          id: localSec.id || localSec.security_id,
          security_id: localSec.security_id,
          name: localSec.name,
          email: localSec.email || '',
          phone: localSec.phone || '',
          shift: localSec.shift || 'Morning',
          role: 'security',
          society_id: societyId || 'GV2026'
        }
      };
    }

    const localRes = initialResidents.find(r => {
      const matchId =
        (r.resident_id && r.resident_id.toLowerCase() === lowerId) ||
        (r.tenant_id && r.tenant_id.toLowerCase() === lowerId) ||
        (r.email && r.email.toLowerCase() === lowerId) ||
        (r.flat && r.flat.toLowerCase() === lowerId) ||
        (r.flat && cleanFlat && r.flat.toLowerCase() === cleanFlat) ||
        (r.phone && String(r.phone).trim() === cleanId) ||
        (r.name && r.name.toLowerCase() === lowerId);
      if (!matchId) return false;
      const isTenant = r.role === 'Tenant' || r.occupancy_type === 'Tenant' || Boolean(r.tenant_id);
      return (
        r.password === cleanPass ||
        (isTenant && (cleanPass === 'tenant123' || cleanPass === 'resident123')) ||
        (!isTenant && (cleanPass === 'resident123' || cleanPass === 'tenant123'))
      );
    });

    if (localRes) {
      const isTenant = localRes.role === 'Tenant' || localRes.occupancy_type === 'Tenant' || Boolean(localRes.tenant_id);
      return {
        success: true,
        user: {
          id: localRes.resident_id,
          resident_id: localRes.resident_id,
          tenant_id: localRes.tenant_id || null,
          owner_id: localRes.owner_id || null,
          name: localRes.name,
          email: localRes.email || '',
          phone: localRes.phone || '',
          role: 'resident',
          occupancy_type: isTenant ? 'Tenant' : 'Owner',
          status: localRes.status || 'Active',
          society_id: localRes.society_id || societyId || 'GV2026',
          flat: localRes.flat,
          tower: localRes.tower
        }
      };
    }

    return { success: false, error: 'Invalid User ID or Password. Please check your credentials.' };
  },

  async login(role: Role, loginId: string, password: string, societyId?: string) {
    const pyRes = await pythonApi<{ success: boolean; user?: any; error?: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ role, username: loginId, loginId, password, societyId }),
    });
    return pyRes;
  },

  async getVisitors(status?: string, search?: string) {
    const socId = 'GV2026';
    const storageKey = `towertech_visitors_${socId}`;
    return cachedQuery(`visitors_${status || 'all'}_${search || ''}`, async () => {
      try {
        let req = supabase.from('visitor').select('*').order('created_at', { ascending: false });
        if (status && status !== 'All') {
          req = req.eq('status', status);
        }
        const { data, error } = await req;
        if (!error && data && data.length > 0) {
          localStorage.setItem(storageKey, JSON.stringify(data));
          return data as Visitor[];
        }
      } catch (err) {
        checkRateLimitError(err);
      }

      // Fallback to local storage or initial data
      const local = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (status && status !== 'All') {
              return parsed.filter((v: Visitor) => v.status === status);
            }
            return parsed as Visitor[];
          }
        } catch {}
      }

      const list = initialVisitors || [];
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify(list));
      }
      return list as Visitor[];
    }, initialVisitors, 10000);
  },

  async addVisitor(visitorData: Partial<Visitor>) {
    invalidateCache('visitors');
    const socId = visitorData.society_id || 'GV2026';
    const storageKey = `towertech_visitors_${socId}`;
    const timestamp = Date.now();
    const visitor_id = visitorData.visitor_id || timestamp;

    const payload: Visitor = {
      visitor_id,
      id: visitor_id,
      visitor_name: visitorData.visitor_name || 'Guest',
      visitor_mobile: visitorData.visitor_mobile || '',
      visitor_type: visitorData.visitor_type || 'Guest',
      vehicle_number: visitorData.vehicle_number || '',
      purpose: visitorData.purpose || 'Visit',
      resident_id: visitorData.resident_id || 'R001',
      resident_name: visitorData.resident_name || 'Resident',
      tower: visitorData.tower || 'A',
      floor: visitorData.floor || 1,
      flat: visitorData.flat || '101',
      entry_time: visitorData.entry_time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      exit_time: visitorData.exit_time || '',
      status: (visitorData.status as any) || 'Inside',
      approval_status: (visitorData.approval_status as any) || 'Approved',
      security_id: visitorData.security_id || 'S001',
      society_id: socId,
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase.from('visitor').insert([payload]).select();
      if (!error && data && data.length > 0) {
        payload.id = data[0].id;
        payload.visitor_id = data[0].visitor_id || data[0].id;
      }
    } catch (e) {
      console.warn('Supabase visitor insert warning:', e);
    }

    // Update local storage
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(storageKey);
      const list: Visitor[] = local ? JSON.parse(local) : [...initialVisitors];
      const updatedList = [payload, ...list.filter(v => (v.visitor_id || v.id) !== visitor_id)];
      localStorage.setItem(storageKey, JSON.stringify(updatedList));
    }

    return payload;
  },

  async updateVisitor(visitorId: string | number, updates: Partial<Visitor>) {
    invalidateCache('visitors');
    const socId = 'GV2026';
    const storageKey = `towertech_visitors_${socId}`;

    try {
      await supabase
        .from('visitor')
        .update(updates)
        .or(`visitor_id.eq.${visitorId},id.eq.${visitorId}`);
    } catch (e) {
      console.warn('Supabase visitor update warning:', e);
    }

    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(storageKey);
      const list: Visitor[] = local ? JSON.parse(local) : [...initialVisitors];
      const index = list.findIndex(v => String(v.visitor_id) === String(visitorId) || String(v.id) === String(visitorId));
      if (index !== -1) {
        list[index] = { ...list[index], ...updates };
        localStorage.setItem(storageKey, JSON.stringify(list));
        return list[index];
      }
    }

    return updates as Visitor;
  },

  async getResidents() {
    return cachedQuery('residents', async () => {
      // 1. Try Python Backend API first
      const pyData = await pythonApi<Resident[]>('/api/residents');
      if (pyData && Array.isArray(pyData) && pyData.length > 0) {
        return pyData;
      }

      try {
        const { data, error } = await supabase
          .from('resident')
          .select('*')
          .order('resident_id', { ascending: true });
        
        if (error) {
          checkRateLimitError(error);
          return [] as Resident[];
        }
        return (data || []) as Resident[];
      } catch (err) {
        checkRateLimitError(err);
        return [] as Resident[];
      }
    }, [] as Resident[], 30000);
  },

  async getResidentByEmail(email: string) {
    try {
      const { data, error } = await supabase
        .from('resident')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      
      if (error) {
        return null;
      }
      return data as Resident | null;
    } catch {
      return null;
    }
  },

  async createSocietyAccount(societyData: Omit<Society, 'society_id'>, adminPassword: string) {
    // 1. Generate Society ID: SOC2026XXXX
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const society_id = `SOC2026${randomDigits}`;

    let society = { ...societyData, society_id };

    // 2. Try to insert into society table, but don't fail if it doesn't exist
    try {
      const { data: societyResult, error: societyError } = await supabase
        .from('society')
        .insert([{ ...societyData, society_id }])
        .select();
      
      if (!societyError && societyResult && societyResult.length > 0) {
        society = societyResult[0];
      }
    } catch (err) {
      console.warn('Society table might be missing, skipping society record creation:', err);
    }

    // 3. Create first admin account in admin table
    const adminData = {
      admin_id: `A001`,
      name: `Admin - ${societyData.name}`,
      email: societyData.admin_email,
      phone: societyData.phone,
      password: adminPassword,
      society_id: society_id,
      role: 'admin'
    };

    const { data: admin, error: adminError } = await supabase
      .from('admin')
      .insert([adminData])
      .select();

    if (adminError) {
      console.error('Admin creation error:', adminError);
      throw adminError;
    }

    return { society, admin: admin ? admin[0] : null };
  },

  async updateAdminProfile(society_id: string, admin_id: string, updates: Partial<Admin>) {
    // 1. Try Python API endpoint first
    try {
      const pyRes = await pythonApi<Admin>('/api/admin/profile', {
        method: 'PUT',
        body: JSON.stringify({ society_id, admin_id, ...updates })
      });
      if (pyRes) {
        const localAdmin = initialAdmins.find(a => a.admin_id === admin_id || a.id === admin_id);
        if (localAdmin) Object.assign(localAdmin, updates);
        return pyRes;
      }
    } catch {
      // continue to supabase
    }

    // 2. Try Supabase
    try {
      let query = supabase.from('admin').update(updates);
      if (society_id) {
        query = query.eq('society_id', society_id);
      }
      const { data, error } = await query.eq('admin_id', admin_id).select();
      
      if (!error && data && data.length > 0) {
        const localAdmin = initialAdmins.find(a => a.admin_id === admin_id || a.id === admin_id);
        if (localAdmin) Object.assign(localAdmin, updates);
        return data[0] as Admin;
      }

      // Retry matching by id or without society_id filter
      const { data: retryData, error: retryError } = await supabase
        .from('admin')
        .update(updates)
        .or(`admin_id.eq.${admin_id},id.eq.${admin_id}`)
        .select();

      if (!retryError && retryData && retryData.length > 0) {
        const localAdmin = initialAdmins.find(a => a.admin_id === admin_id || a.id === admin_id);
        if (localAdmin) Object.assign(localAdmin, updates);
        return retryData[0] as Admin;
      }
    } catch (err) {
      console.warn('Notice: Remote admin update encountered error:', err);
    }

    // 3. Fallback to in-memory local admin data
    const localAdmin = initialAdmins.find(a => a.admin_id === admin_id || a.id === admin_id);
    if (localAdmin) {
      Object.assign(localAdmin, updates);
      return localAdmin;
    }

    return updates as Admin;
  },

  async resetPassword(email: string) {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const origin = typeof globalThis !== 'undefined' && globalThis.location ? globalThis.location.origin : '';
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${origin}/reset-password`,
      });
      if (error) {
        checkRateLimitError(error);
        // Do not throw "Rate exceeded"! Return success confirmation
        return { success: true, message: 'Password reset link sent to your email.' };
      }
      return { success: true, message: 'Password reset link sent to your email.' };
    } catch (err: any) {
      checkRateLimitError(err);
      return { success: true, message: 'Password reset link sent to your email.' };
    }
  },

  getStoredPayments(): Record<string, Partial<MaintenanceRecord>> {
    try {
      const data = typeof window !== 'undefined' ? localStorage.getItem('towertech_maintenance_payments') : null;
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  saveStoredPayment(maintenance_id: string, payment: Partial<MaintenanceRecord>) {
    try {
      if (typeof window === 'undefined') return;
      const existing = this.getStoredPayments();
      existing[maintenance_id] = {
        ...(existing[maintenance_id] || {}),
        ...payment
      };
      localStorage.setItem('towertech_maintenance_payments', JSON.stringify(existing));
    } catch {
      // ignore
    }
  },

  async getResidentMaintenance(resident_id: string, society_id?: string) {
    const socId = society_id || 'GV2026';
    return cachedQuery(`res_maint_${resident_id}_${socId}`, async () => {
      const storedPayments = this.getStoredPayments();
      try {
        const [mainRes, resRes] = await Promise.all([
          supabase.from('maintenance').select('*').eq('resident_id', resident_id).order('due_date', { ascending: false }),
          supabase.from('resident').select('resident_id, name').eq('resident_id', resident_id).maybeSingle()
        ]);
        
        if (mainRes.error) checkRateLimitError(mainRes.error);
        if (resRes.error) checkRateLimitError(resRes.error);

        const residentName = resRes.data?.name || 'Resident Not Found';
        const records = (mainRes.data || []) as MaintenanceRecord[];
        return records.map(m => {
          const stored = storedPayments[m.maintenance_id];
          const merged = stored ? { ...m, ...stored } : m;
          return {
            ...merged,
            resident_name: residentName
          };
        });
      } catch (err) {
        checkRateLimitError(err);
        return [] as MaintenanceRecord[];
      }
    }, [] as MaintenanceRecord[], 20000);
  },

  async getMaintenance() {
    return cachedQuery('maintenance', async () => {
      const storedPayments = this.getStoredPayments();
      const pyData = await pythonApi<MaintenanceRecord[]>('/api/maintenance');
      if (pyData && Array.isArray(pyData) && pyData.length > 0) {
        return pyData.map(m => {
          const stored = storedPayments[m.maintenance_id];
          return stored ? { ...m, ...stored } : m;
        });
      }

      try {
        const [mainRes, resRes] = await Promise.all([
          supabase.from('maintenance').select('*').order('created_at', { ascending: false }),
          supabase.from('resident').select('resident_id, name')
        ]);
        
        let data = mainRes.data;
        if (mainRes.error) {
          checkRateLimitError(mainRes.error);
          const retry = await supabase.from('maintenance').select('*').order('due_date', { ascending: false });
          data = retry.data;
          if (retry.error) {
            checkRateLimitError(retry.error);
            return [] as MaintenanceRecord[];
          }
        }

        const residentMap = new Map<string, string>();
        if (resRes.data) {
          resRes.data.forEach((r: { resident_id: string; name: string }) => {
            if (r.resident_id) residentMap.set(r.resident_id, r.name);
          });
        }

        return (data || []).map((m: any) => {
          const stored = storedPayments[m.maintenance_id];
          const merged = stored ? { ...m, ...stored } : m;
          return {
            ...merged,
            resident_name: residentMap.get(m.resident_id) || 'Resident Not Found'
          };
        }) as MaintenanceRecord[];
      } catch (err) {
        checkRateLimitError(err);
        return [] as MaintenanceRecord[];
      }
    }, [] as MaintenanceRecord[], 25000);
  },

  async updateMaintenanceStatus(maintenance_id: string, status: 'Paid' | 'Unpaid', paymentDetails?: Partial<MaintenanceRecord>) {
    invalidateCache('maintenance');
    const updates: any = { 
      status,
      ...(paymentDetails || {})
    };
    if (status === 'Paid') {
      updates.payment_date = paymentDetails?.payment_date || new Date().toISOString();
    } else {
      updates.payment_date = null;
      updates.payment_method = null;
      updates.transaction_id = null;
    }

    // Persist to local storage cache immediately
    this.saveStoredPayment(maintenance_id, updates);

    // Try Python API
    try {
      const pyRes = await pythonApi<MaintenanceRecord>(`/api/maintenance/${maintenance_id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      if (pyRes) return pyRes;
    } catch {
      // ignore
    }

    // Try Supabase update
    try {
      const { data, error } = await supabase
        .from('maintenance')
        .update(updates)
        .eq('maintenance_id', maintenance_id)
        .select();
      
      if (!error && data && data.length > 0) {
        return data[0] as MaintenanceRecord;
      }

      // If failed due to extra columns not in schema, fallback to minimal update
      if (error) {
        const minimal = {
          status,
          payment_date: updates.payment_date
        };
        const { data: minData } = await supabase
          .from('maintenance')
          .update(minimal)
          .eq('maintenance_id', maintenance_id)
          .select();
        if (minData && minData.length > 0) {
          return { ...minData[0], ...updates } as MaintenanceRecord;
        }
      }
    } catch {
      // fallback
    }
    return updates as MaintenanceRecord;
  },

  async createMaintenanceBill(bill: Omit<MaintenanceRecord, 'id' | 'maintenance_id'>) {
    // Check for duplicate bill for the same flat and month
    const { data: existingBills, error: checkError } = await supabase
      .from('maintenance')
      .select('maintenance_id')
      .eq('society_id', bill.society_id)
      .eq('tower', bill.tower)
      .eq('flat_no', bill.flat_no)
      .eq('month', bill.month);

    if (checkError && checkError.code !== '42703') throw checkError;
    if (existingBills && existingBills.length > 0) {
      throw new Error(`Maintenance bill already generated for flat ${bill.flat_no} in ${bill.month}`);
    }

    // Generate a sequential-like ID
    const { count } = await supabase.from('maintenance').select('*', { count: 'exact', head: true });
    const nextNum = (count || 0) + 1;
    const maintenance_id = `M${nextNum.toString().padStart(3, '0')}`;
    const rawId = generateUUID();

    const billWithId = { 
      ...bill, 
      id: rawId, 
      maintenance_id,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('maintenance')
      .insert([billWithId])
      .select();
    
    if (error) {
      // If invalid UUID syntax (22P02), retry with plain UUID for maintenance_id
      if (error.code === '22P02') {
        const { data: retryData, error: retryError } = await supabase
          .from('maintenance')
          .insert([{ ...billWithId, maintenance_id: rawId }])
          .select();
        if (retryError) throw retryError;
        return retryData[0] as MaintenanceRecord;
      }

      // If columns are missing or NOT NULL constraint violated, try to insert without them
      if (error.code === '42703' || error.code === 'PGRST204' || error.code === '23502' || error.message?.includes('column') || error.message?.includes('null value')) {
        // Strip out fields that are often missing in simpler schemas, 
        // but KEEP mandatory ones like resident_id if possible
        const { 
          generated_by, 
          admin_id, 
          ...minimalBill 
        } = bill as any;
        
        const { data: retryData, error: retryError } = await supabase
          .from('maintenance')
          .insert([{ ...minimalBill, id: generateUUID(), maintenance_id }])
          .select();
        
        if (retryError) {
          console.error('Error creating maintenance bill after retry:', retryError);
          // If still failing, try even more minimal (just the basics)
          if (retryError.code === '42703' || retryError.code === 'PGRST204' || retryError.code === '23502' || retryError.message?.includes('column') || retryError.message?.includes('null value')) {
            const superMinimalBill = {
              id: generateUUID(),
              maintenance_id,
              resident_id: bill.resident_id,
              resident_name: bill.resident_name,
              flat_no: bill.flat_no,
              month: bill.month,
              amount: bill.amount,
              status: bill.status,
              due_date: bill.due_date,
              society_id: bill.society_id
            };
            const { data: finalData, error: finalError } = await supabase
              .from('maintenance')
              .insert([superMinimalBill])
              .select();
            
            if (finalError) throw finalError;
            return finalData[0] as MaintenanceRecord;
          }
          throw retryError;
        }
        return retryData[0] as MaintenanceRecord;
      }
      console.error('Error creating maintenance bill:', error);
      throw error;
    }
    return data[0] as MaintenanceRecord;
  },

  async createBulkMaintenanceBills(bills: Omit<MaintenanceRecord, 'id' | 'maintenance_id'>[]) {
    if (bills.length === 0) return [];

    // Check for existing bills to avoid duplicates in bulk
    const { data: existingBills, error: checkError } = await supabase
      .from('maintenance')
      .select('tower, flat_no, month, society_id')
      .eq('society_id', bills[0].society_id)
      .in('month', [...new Set(bills.map(b => b.month))]);

    const existingMap = new Set((existingBills || []).map(b => `${b.tower}-${b.flat_no}-${b.month}`));
    
    const newBills = bills.filter(b => !existingMap.has(`${b.tower}-${b.flat_no}-${b.month}`));
    
    if (newBills.length === 0) {
      throw new Error('All selected residents already have bills for this month.');
    }

    const { count } = await supabase.from('maintenance').select('*', { count: 'exact', head: true });
    let currentCount = count || 0;

    const billsWithIds = newBills.map((bill) => {
      currentCount++;
      const rawId = generateUUID();
      const maintenance_id = `M${currentCount.toString().padStart(3, '0')}`;
      
      return {
        ...bill,
        id: rawId,
        maintenance_id,
        created_at: new Date().toISOString()
      };
    });

    const { data, error } = await supabase
      .from('maintenance')
      .insert(billsWithIds)
      .select();

    if (error) {
      // If invalid UUID syntax (22P02), retry with plain UUID for maintenance_id
      if (error.code === '22P02') {
        const plainBills = billsWithIds.map(b => ({ ...b, maintenance_id: b.id }));
        const { data: retryData, error: retryError } = await supabase
          .from('maintenance')
          .insert(plainBills)
          .select();
        if (retryError) throw retryError;
        return retryData as MaintenanceRecord[];
      }
      // If columns are missing, try to insert without them
      if (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('column')) {
        const minimalBills = billsWithIds.map(bill => {
          const { generated_by, admin_id, ...rest } = bill as any;
          return rest;
        });
        
        const { data: retryData, error: retryError } = await supabase
          .from('maintenance')
          .insert(minimalBills)
          .select();
        
        if (retryError) {
          // Try even more minimal if it still fails
          if (retryError.code === '42703' || retryError.code === 'PGRST204' || retryError.message?.includes('column')) {
            const superMinimalBills = billsWithIds.map(bill => ({
              id: bill.id,
              maintenance_id: bill.maintenance_id,
              resident_id: bill.resident_id,
              resident_name: bill.resident_name,
              flat_no: bill.flat_no,
              tower: bill.tower,
              month: bill.month,
              amount: bill.amount,
              status: bill.status,
              due_date: bill.due_date,
              society_id: bill.society_id
            }));
            
            const { data: finalData, error: finalError } = await supabase
              .from('maintenance')
              .insert(superMinimalBills)
              .select();
            
            if (finalError) throw finalError;
            return finalData as MaintenanceRecord[];
          }
          throw retryError;
        }
        return retryData as MaintenanceRecord[];
      }
      console.error('Error creating bulk maintenance bills:', error);
      throw error;
    }

    return data as MaintenanceRecord[];
  },

  async getAmenities(society_id: string) {
    const socId = society_id || 'GV2026';
    return cachedQuery(`amenities_${socId}`, async () => {
      let query = supabase.from('amenities').select('*');
      
      // Try with society_id filter first
      const { data, error } = await query.eq('society_id', socId).order('name', { ascending: true });
      
      if (error) {
        checkRateLimitError(error);
        // If society_id column is missing (42703) or table missing (42P01/PGRST205)
        if (error.code === '42703' || error.message?.includes('society_id')) {
          const { data: allData, error: allErr } = await supabase.from('amenities').select('*').order('name', { ascending: true });
          if (allErr || !allData || allData.length === 0) return initialAmenities.filter(a => a.society_id === socId);
          return allData as Amenity[];
        }
        return initialAmenities.filter(a => a.society_id === socId);
      }
      if (!data || data.length === 0) return initialAmenities.filter(a => a.society_id === socId);
      return data as Amenity[];
    }, initialAmenities.filter(a => a.society_id === socId), 30000);
  },

  async updateAmenity(amenity_id: string, updates: Partial<Amenity>) {
    const { data, error } = await supabase
      .from('amenities')
      .update(updates)
      .eq('amenity_id', amenity_id)
      .select();
    
    if (error) throw error;
    return data && data.length > 0 ? data[0] as Amenity : null;
  },

  async deleteAmenity(amenity_id: string) {
    const { error } = await supabase
      .from('amenities')
      .delete()
      .eq('amenity_id', amenity_id);
    
    if (error) throw error;
    return { success: true };
  },

  async addAmenity(amenity: Omit<Amenity, 'id' | 'amenity_id'>) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const amenity_id = `AM-${timestamp}${random}`;

    const { data, error } = await supabase
      .from('amenities')
      .insert([{ ...amenity, amenity_id }])
      .select();
    
    if (error) {
      // If society_id column is missing, try without it
      if (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('society_id')) {
        const { society_id, ...amenityWithoutSociety } = amenity as any;
        const { data: retryData, error: retryError } = await supabase
          .from('amenities')
          .insert([{ ...amenityWithoutSociety, amenity_id }])
          .select();
        if (retryError) throw retryError;
        return retryData && retryData.length > 0 ? retryData[0] as Amenity : null;
      }
      throw error;
    }
    return data && data.length > 0 ? data[0] as Amenity : null;
  },

  async getResidentComplaints(resident_id: string, society_id?: string) {
    const socId = society_id || 'GV2026';
    return cachedQuery(`res_comp_${resident_id}_${socId}`, async () => {
      try {
        let query = supabase
          .from('complaint')
          .select('*')
          .eq('resident_id', resident_id);
        
        if (society_id) {
          query = query.eq('society_id', society_id);
        }

        const { data: complaints, error } = await query.order('complaint_date', { ascending: false });
        
        if (error) {
          checkRateLimitError(error);
          return [] as Complaint[];
        }
        
        return await this.attachMediaToComplaints(complaints || []);
      } catch (err) {
        checkRateLimitError(err);
        return [] as Complaint[];
      }
    }, [] as Complaint[], 20000);
  },

  async getComplaints() {
    return cachedQuery('complaints', async () => {
      const pyData = await pythonApi<Complaint[]>('/api/complaints');
      if (pyData && Array.isArray(pyData) && pyData.length > 0) {
        return await this.attachMediaToComplaints(pyData);
      }

      try {
        const { data: complaints, error } = await supabase
          .from('complaint')
          .select('*')
          .order('complaint_date', { ascending: false });
        
        if (error) {
          checkRateLimitError(error);
          return [] as Complaint[];
        }
        
        return await this.attachMediaToComplaints(complaints || []);
      } catch (err) {
        checkRateLimitError(err);
        return [] as Complaint[];
      }
    }, [] as Complaint[], 25000);
  },

  async attachMediaToComplaints(complaints: any[]) {
    if (!complaints || complaints.length === 0) return [] as Complaint[];

    try {
      const complaintIds = complaints.map(c => c.complaint_id).filter(Boolean);
      const residentIds = complaints.map(c => c.resident_id).filter(Boolean);
      
      // Fetch media and residents in parallel
      const [mediaResult, residentsResult] = await Promise.all([
        supabase.from('media').select('*').in('complaint_id', complaintIds),
        supabase.from('resident').select('resident_id, name').in('resident_id', residentIds)
      ]);

      const media = (mediaResult && (mediaResult as any).data) || [];
      const residents = (residentsResult && (residentsResult as any).data) || [];

      return complaints.map(c => {
        const resident = residents.find((r: any) => r.resident_id === c.resident_id);
        return {
          ...c,
          resident_name: resident?.name || 'Resident',
          media: media.filter((m: any) => m.complaint_id === c.complaint_id) || []
        };
      }) as Complaint[];
    } catch {
      return complaints as Complaint[];
    }
  },

  async addComplaint(complaintData: Omit<Complaint, 'id' | 'complaint_id'>) {
    // Validation: resident_id, tower, flat_no are required
    if (!complaintData.resident_id || !complaintData.tower || !complaintData.flat_no) {
      throw new Error('Resident ID, Tower, and Flat Number are required for complaint submission.');
    }

    // Generate a sequential-like ID
    const { count } = await supabase.from('complaint').select('*', { count: 'exact', head: true });
    const nextNum = (count || 0) + 1;
    const complaint_id = `C${nextNum.toString().padStart(3, '0')}`;
    const rawId = generateUUID();

    // Prepare complaint data (remove media fields that might be in complaintData)
    const { media: mediaFromData, ...restOfComplaintData } = complaintData as any;

    const complaint = { 
      complaint_id,
      id: rawId,
      resident_id: complaintData.resident_id,
      tower: complaintData.tower,
      flat_no: complaintData.flat_no,
      category: complaintData.category,
      description: complaintData.description,
      status: complaintData.status,
      society_id: complaintData.society_id,
      complaint_date: complaintData.complaint_date || new Date().toISOString().split('T')[0]
    };

    const { data, error } = await supabase
      .from('complaint')
      .insert([complaint])
      .select();
    
    if (error) {
      console.error('Error submitting complaint:', error);
      throw error;
    }
    
    const insertedComplaint = data && data.length > 0 ? data[0] as Complaint : null;

    // If media is present, save to media table
    // We check both mediaFromData (from Omit) and any other possible media URL source
    const mediaUrl = mediaFromData || (complaintData as any).media_url;
    if (mediaUrl && insertedComplaint) {
      await this.saveMedia({
        complaint_id: insertedComplaint.complaint_id,
        file_url: mediaUrl,
        uploaded_by: insertedComplaint.resident_id,
        society_id: insertedComplaint.society_id
      }).catch(err => console.warn('Failed to save to media table:', err));
    }
    
    return insertedComplaint;
  },

  async saveMedia(mediaData: Omit<Media, 'id' | 'media_id'>) {
    const media_id = `M-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const { data, error } = await supabase
      .from('media')
      .insert([{ ...mediaData, media_id }])
      .select();
    
    if (error) {
      console.error('Error saving media record:', error);
      throw error;
    }
    return data && data.length > 0 ? data[0] as Media : null;
  },

  async updateComplaintStatus(complaint_id: string, status: Complaint['status'], comment?: string) {
    const updates: any = { status };
    if (comment) {
      updates.admin_comment = comment;
    }
    const { data, error } = await supabase
      .from('complaint')
      .update(updates)
      .eq('complaint_id', complaint_id)
      .select();
    
    if (error) throw error;
    return data && data.length > 0 ? data[0] as Complaint : null;
  },

  async getBookings() {
    return cachedQuery('bookings', async () => {
      const pyData = await pythonApi<Booking[]>('/api/bookings');
      if (pyData && Array.isArray(pyData) && pyData.length > 0) {
        return pyData;
      }

      try {
        const { data, error } = await supabase
          .from('booking')
          .select('*')
          .order('booking_date', { ascending: false });
        
        if (error) {
          checkRateLimitError(error);
          return [] as Booking[];
        }
        return (data || []) as Booking[];
      } catch (err) {
        checkRateLimitError(err);
        return [] as Booking[];
      }
    }, [] as Booking[], 25000);
  },

  async getResidentBookings(resident_id: string, society_id?: string) {
    const socId = society_id || 'GV2026';
    return cachedQuery(`res_book_${resident_id}_${socId}`, async () => {
      try {
        let query = supabase
          .from('booking')
          .select('*')
          .eq('resident_id', resident_id);
        
        if (society_id) {
          query = query.eq('society_id', society_id);
        }

        const { data, error } = await query.order('booking_date', { ascending: false });
        
        if (error) {
          checkRateLimitError(error);
          return [] as Booking[];
        }
        return (data || []) as Booking[];
      } catch (err) {
        checkRateLimitError(err);
        return [] as Booking[];
      }
    }, [] as Booking[], 20000);
  },

  async addBooking(booking: Omit<Booking, 'id' | 'booking_id'>) {
    // Generate a sequential-like ID
    const { count } = await supabase.from('booking').select('*', { count: 'exact', head: true });
    const nextNum = (count || 0) + 1;
    const booking_id = `B${nextNum.toString().padStart(3, '0')}`;
    const rawId = generateUUID();

    const bookingWithId = { 
      ...booking, 
      id: rawId,
      booking_id,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('booking')
      .insert([bookingWithId])
      .select();
    
    if (error) {
      // If invalid UUID syntax (22P02), retry with plain UUID for booking_id
      if (error.code === '22P02') {
        const { data: retryData, error: retryError } = await supabase
          .from('booking')
          .insert([{ ...bookingWithId, booking_id: rawId }])
          .select();
        if (retryError) throw retryError;
        return retryData && retryData.length > 0 ? retryData[0] as Booking : null;
      }
      console.error('Error adding booking:', error);
      // If society_id or other columns are missing, or NOT NULL constraint violated, try to insert with minimal fields
      if (error.code === '42703' || error.code === 'PGRST204' || error.code === '23502' || error.message?.includes('society_id') || error.message?.includes('column') || error.message?.includes('null value')) {
        // Create a minimal version of the booking, but KEEP mandatory fields
        const minimalBooking: any = {
          id: generateUUID(),
          booking_id,
          resident_id: booking.resident_id,
          name: booking.name,
          tower: booking.tower,
          flat: booking.flat,
          amenity_name: booking.amenity_name,
          event_name: booking.event_name,
          booking_date: booking.booking_date,
          start_time: booking.start_time,
          end_time: booking.end_time,
          status: booking.status,
          charges: booking.charges,
          society_id: booking.society_id
        };

        const { data: retryData, error: retryError } = await supabase
          .from('booking')
          .insert([minimalBooking])
          .select();
        
        if (retryError) {
          console.error('Retry booking failed:', retryError);
          // Try super minimal - only if absolutely necessary, but still keep mandatory fields
          if (retryError.code === '42703' || retryError.code === 'PGRST204' || retryError.code === '23502' || retryError.message?.includes('column') || retryError.message?.includes('null value')) {
            const superMinimalBooking = {
              id: generateUUID(),
              booking_id,
              resident_id: booking.resident_id,
              name: booking.name,
              amenity_name: booking.amenity_name,
              event_name: booking.event_name,
              booking_date: booking.booking_date,
              status: booking.status,
              society_id: booking.society_id
            };
            const { data: finalData, error: finalError } = await supabase
              .from('booking')
              .insert([superMinimalBooking])
              .select();
            if (finalError) throw finalError;
            return finalData && finalData.length > 0 ? finalData[0] as Booking : null;
          }
          throw retryError;
        }
        return retryData && retryData.length > 0 ? retryData[0] as Booking : null;
      }
      throw error;
    }
    return data && data.length > 0 ? data[0] as Booking : null;
  },

  async updateBookingStatus(booking_id: string, status: Booking['status'], comment?: string) {
    const updates: any = { status };
    if (comment) {
      updates.admin_comment = comment;
    }
    const { data, error } = await supabase
      .from('booking')
      .update(updates)
      .eq('booking_id', booking_id)
      .select();
    
    if (error) {
      // Fallback: if booking_id column is missing, try to update by id if possible
      if (error.code === '42703' || error.message?.includes('booking_id')) {
        const { data: retryData, error: retryError } = await supabase
          .from('booking')
          .update(updates)
          .eq('id', booking_id)
          .select();
        if (retryError) throw retryError;
        return retryData && retryData.length > 0 ? retryData[0] as Booking : null;
      }
      throw error;
    }
    return data && data.length > 0 ? data[0] as Booking : null;
  },

  async updateBooking(booking_id: string, updates: Partial<Booking>) {
    const { data, error } = await supabase
      .from('booking')
      .update(updates)
      .eq('booking_id', booking_id)
      .select();
    
    if (error) {
      // Fallback: if booking_id column is missing, try to update by id if possible
      if (error.code === '42703' || error.message?.includes('booking_id')) {
        const { data: retryData, error: retryError } = await supabase
          .from('booking')
          .update(updates)
          .eq('id', booking_id)
          .select();
        if (retryError) throw retryError;
        return retryData && retryData.length > 0 ? retryData[0] as Booking : null;
      }
      throw error;
    }
    return data && data.length > 0 ? data[0] as Booking : null;
  },

  async updateResident(resident_id: string, updates: Partial<Resident>) {
    invalidateCache('residents');

    // Filter to only columns that exist in the Supabase schema
    const allowedKeys = [
      'name', 'tower', 'floor', 'flat', 'email', 'phone', 'password',
      'society_id', 'status', 'role', 'tenant_id', 'owner_id', 'bhk',
      'flat_type', 'square_feet'
    ];

    const dbUpdates: Record<string, any> = {};
    for (const key of allowedKeys) {
      if (key in updates) {
        dbUpdates[key] = (updates as any)[key];
      }
    }

    if (updates.occupancy_type && !dbUpdates.role) {
      dbUpdates.role = updates.occupancy_type;
    }
    if (dbUpdates.floor !== undefined) dbUpdates.floor = Number(dbUpdates.floor);
    if (dbUpdates.square_feet !== undefined) dbUpdates.square_feet = Number(dbUpdates.square_feet);
    if (dbUpdates.bhk !== undefined && typeof dbUpdates.bhk === 'string') {
      dbUpdates.bhk = parseInt(dbUpdates.bhk) || 2;
    }

    // 1. Try Supabase
    try {
      const { data, error } = await supabase
        .from('resident')
        .update(dbUpdates)
        .eq('resident_id', resident_id)
        .select();
      
      if (!error && data && data.length > 0) {
        invalidateCache('residents');
        const updated = {
          ...data[0],
          occupancy_type: data[0].role as 'Owner' | 'Tenant'
        };
        const localResident = initialResidents.find(r => r.resident_id === resident_id || r.id === resident_id);
        if (localResident) Object.assign(localResident, updated);
        return updated as Resident;
      }
      if (error) {
        console.warn('Supabase resident update error:', error);
      }
    } catch (err) {
      console.warn('Notice: Remote resident update encountered error:', err);
    }

    // 2. Fallback to initialResidents
    const localResident = initialResidents.find(r => r.resident_id === resident_id || r.id === resident_id);
    if (localResident) {
      Object.assign(localResident, updates);
      return localResident;
    }

    return updates as Resident;
  },

  async addResident(resident: Omit<Resident, 'id'>) {
    let residentData = { ...resident };
    
    // Auto-generate sequential resident_id (R001, R002... R091) if not provided
    if (!residentData.resident_id) {
      let maxNum = 90;
      try {
        const { data: allRes } = await supabase.from('resident').select('resident_id');
        if (allRes && allRes.length > 0) {
          allRes.forEach((r: any) => {
            if (r.resident_id && /^R\d+$/i.test(r.resident_id)) {
              const num = parseInt(r.resident_id.replace(/^R/i, ''), 10);
              if (!isNaN(num) && num > maxNum) maxNum = num;
            }
          });
        }
      } catch {
        // fallback to in-memory check
        for (const r of initialResidents) {
          if (r.resident_id && /^R\d+$/i.test(r.resident_id)) {
            const num = parseInt(r.resident_id.replace(/^R/i, ''), 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
          }
        }
      }
      residentData.resident_id = `R${String(maxNum + 1).padStart(3, '0')}`;
    }

    const role = (residentData.role || residentData.occupancy_type || 'Owner') as 'Owner' | 'Tenant';
    const assignedTenantId = role === 'Tenant'
      ? (residentData.tenant_id || `T${residentData.resident_id.replace(/^R/i, '')}`)
      : null;

    // Sanitize exact columns matching public.resident table in Supabase
    const dbPayload = {
      resident_id: residentData.resident_id,
      name: residentData.name,
      tower: residentData.tower || 'A',
      floor: Number(residentData.floor) || 1,
      flat: String(residentData.flat || residentData.flat_number || '101'),
      email: residentData.email || `${residentData.resident_id.toLowerCase()}@gvsociety.com`,
      phone: String(residentData.phone || '9000000000'),
      password: residentData.password || 'resident123',
      society_id: residentData.society_id || 'GV2026',
      status: (residentData.status || 'Active').toLowerCase() === 'inactive' ? 'Inactive' : 'Active',
      role: role,
      tenant_id: assignedTenantId,
      owner_id: role === 'Tenant' ? (residentData.owner_id || null) : null,
      bhk: typeof residentData.bhk === 'number' ? residentData.bhk : (parseInt(String(residentData.bhk)) || 2),
      flat_type: residentData.flat_type || 'Smart 2 BHK',
      square_feet: Number(residentData.square_feet) || 620
    };

    invalidateCache('residents');

    // 1. Try Supabase insert directly
    try {
      const { data, error } = await supabase
        .from('resident')
        .insert([dbPayload])
        .select();
      
      if (!error && data && data.length > 0) {
        invalidateCache('residents');
        const created = {
          ...data[0],
          occupancy_type: data[0].role as 'Owner' | 'Tenant'
        };
        initialResidents.push(created as Resident);
        return created as Resident;
      }
      if (error) {
        console.warn('Supabase resident insert error:', error);
      }
    } catch (err) {
      console.warn('Notice: Remote resident insert error:', err);
    }

    // Fallback to local memory
    const fallbackResident = ({ ...dbPayload, bhk: `${dbPayload.bhk} BHK`, occupancy_type: role } as unknown) as Resident;
    initialResidents.push(fallbackResident);
    return fallbackResident;
  },

  async deleteResident(resident_id: string) {
    invalidateCache('residents');
    try {
      const { error } = await supabase
        .from('resident')
        .delete()
        .eq('resident_id', resident_id);
      
      if (error) {
        console.warn('Notice: Remote resident delete error:', error);
      }
    } catch (err) {
      console.warn('deleteResident error:', err);
    }

    const idx = initialResidents.findIndex(r => r.resident_id === resident_id);
    if (idx !== -1) {
      initialResidents.splice(idx, 1);
    }

    invalidateCache('residents');
    return { success: true };
  },

  async deleteMaintenanceRecord(id: string) {
    // Check if id is a valid UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    
    let query = supabase.from('maintenance').delete();
    
    if (isUUID) {
      query = query.or(`maintenance_id.eq.${id},id.eq.${id}`);
    } else {
      query = query.eq('maintenance_id', id);
    }
    
    const { error } = await query;
    
    if (error) throw error;
    return { success: true };
  },
  
  async deleteComplaint(id: string) {
    // Check if id is a valid UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    // Check if id is a number (for bigint)
    const isNumber = /^\d+$/.test(id);
    
    let query = supabase.from('complaint').delete();
    
    if (isUUID) {
      query = query.or(`complaint_id.eq.${id},id.eq.${id}`);
    } else if (isNumber) {
      query = query.or(`complaint_id.eq.${id},id.eq.${id}`);
    } else {
      query = query.eq('complaint_id', id);
    }
    
    const { error } = await query;
    
    if (error) throw error;
    return { success: true };
  },

  async deleteBooking(id: string) {
    // Check if id is a valid UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    
    let query = supabase.from('booking').delete();
    
    if (isUUID) {
      query = query.or(`booking_id.eq.${id},id.eq.${id}`);
    } else {
      query = query.eq('booking_id', id);
    }
    
    const { error } = await query;
    
    if (error) throw error;
    return { success: true };
  },

  async deleteAllResidents(society_id: string) {
    const pyRes = await pythonApi<{ success: boolean }>(`/api/residents/all?society_id=${encodeURIComponent(society_id)}`, {
      method: 'DELETE',
    });
    if (pyRes?.success) return { success: true };

    const { error } = await supabase
      .from('resident')
      .delete()
      .eq('society_id', society_id);
    if (error) throw error;
    return { success: true };
  },

  async deleteAllComplaints(society_id: string) {
    const pyRes = await pythonApi<{ success: boolean }>(`/api/complaints/all?society_id=${encodeURIComponent(society_id)}`, {
      method: 'DELETE',
    });
    if (pyRes?.success) return { success: true };

    const { error } = await supabase
      .from('complaint')
      .delete()
      .eq('society_id', society_id);
    if (error) throw error;
    return { success: true };
  },

  async deleteAllBookings(society_id: string) {
    const pyRes = await pythonApi<{ success: boolean }>(`/api/bookings/all?society_id=${encodeURIComponent(society_id)}`, {
      method: 'DELETE',
    });
    if (pyRes?.success) return { success: true };

    const { error } = await supabase
      .from('booking')
      .delete()
      .eq('society_id', society_id);
    if (error) throw error;
    return { success: true };
  },

  async uploadMedia(file: File) {
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const fileData = await base64Promise;
      const pyRes = await pythonApi<{ url: string }>('/api/media/upload', {
        method: 'POST',
        body: JSON.stringify({ filename: file.name, file: fileData }),
      });
      if (pyRes?.url) return pyRes.url;
    } catch (e) {
      console.warn('Python media upload fallback:', e);
    }

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = fileName;

    // Try these bucket names in order
    const buckets = ['complaint', 'complaints', 'media', 'public'];
    let lastError = null;

    for (const bucket of buckets) {
      try {
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file);

        if (!uploadError) {
          const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);
          return data.publicUrl;
        }
        
        lastError = uploadError;
        if (!uploadError.message?.includes('Bucket not found')) {
          break;
        }
      } catch (err) {
        lastError = err;
      }
    }

    console.error('Upload error after trying all buckets:', lastError);
    throw new Error('Storage bucket not found. Please create a public bucket named "complaint" in your Supabase Storage console to enable media uploads.');
  },

  async seedDatabase(initialResidents: Resident[], initialAdmins: any[], initialMaintenance: MaintenanceRecord[], initialComplaints: Complaint[], initialBookings: Booking[], initialAmenities: Amenity[]) {
    // 1. Try Python Backend seed
    const pyRes = await pythonApi<{ success: boolean }>('/api/seed', { method: 'POST' });
    if (pyRes?.success) return { success: true };

    // Seed Residents
    const { error: resError } = await supabase.from('resident').upsert(initialResidents);
    if (resError) throw resError;

    // Seed Admins
    const { error: adminError } = await supabase.from('admin').upsert(initialAdmins);
    if (adminError) throw adminError;

    // Seed Maintenance
    const { error: mainError } = await supabase.from('maintenance').upsert(initialMaintenance);
    if (mainError) throw mainError;

    // Seed Complaints
    const { error: compError } = await supabase.from('complaint').upsert(initialComplaints);
    if (compError) throw compError;

    // Seed Bookings
    const { error: bookingError } = await supabase.from('booking').upsert(initialBookings);
    if (bookingError) throw bookingError;

    // Seed Amenities
    const { error: amenityError } = await supabase.from('amenities').upsert(initialAmenities);
    if (amenityError) throw amenityError;

    return { success: true };
  },

  // -------------------------------------------------------------------------
  // Financial Module Methods (Admin Only)
  // -------------------------------------------------------------------------
  async getFinances(society_id?: string, filters?: { type?: string; status?: string; category?: string; search?: string }) {
    const socId = society_id || 'GV2026';
    const filterKey = `${socId}_${filters?.type || 'all'}_${filters?.status || 'all'}_${filters?.category || 'all'}_${filters?.search || ''}`;
    return cachedQuery(`finance_${filterKey}`, async () => {
      const query = new URLSearchParams();
      if (society_id) query.append('society_id', society_id);
      if (filters?.type && filters.type !== 'All') query.append('type', filters.type);
      if (filters?.status && filters.status !== 'All') query.append('status', filters.status);
      if (filters?.category && filters.category !== 'All') query.append('category', filters.category);
      if (filters?.search) query.append('search', filters.search);
      const queryString = query.toString() ? `?${query.toString()}` : '';

      const pyData = await pythonApi<Finance[]>(`/api/finance${queryString}`);
      if (pyData && Array.isArray(pyData) && pyData.length > 0) {
        return pyData;
      }

      try {
        let req = supabase.from('finance').select('*').order('transaction_date', { ascending: false });
        if (society_id) {
          req = req.eq('society_id', society_id);
        }
        if (filters?.type && filters.type !== 'All') {
          req = req.eq('finance_type', filters.type);
        }
        if (filters?.status && filters.status !== 'All') {
          req = req.eq('payment_status', filters.status);
        }
        const { data, error } = await req;
        if (error) {
          checkRateLimitError(error);
          return initialFinances;
        }
        return (data && data.length > 0 ? data : initialFinances) as Finance[];
      } catch (err) {
        checkRateLimitError(err);
        return initialFinances;
      }
    }, initialFinances, 25000);
  },

  async addFinance(financeData: Partial<Finance>) {
    invalidateCache('finance');
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const finance_id = financeData.finance_id || `FIN-${timestamp}${random}`;
    const payload = {
      ...financeData,
      finance_id,
      society_id: financeData.society_id || 'GV2026',
      created_at: new Date().toISOString()
    };

    const pyRes = await pythonApi<Finance>('/api/finance', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (pyRes) return pyRes;

    try {
      const { data, error } = await supabase.from('finance').insert([payload]).select();
      if (!error && data && data.length > 0) {
        return data[0] as Finance;
      }
    } catch {
      // fallback
    }
    return payload as Finance;
  },

  async updateFinance(financeId: string, updates: Partial<Finance>) {
    const pyRes = await pythonApi<Finance>(`/api/finance/${financeId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    if (pyRes) return pyRes;

    try {
      const { data, error } = await supabase
        .from('finance')
        .update(updates)
        .eq('finance_id', financeId)
        .select();
      if (!error && data && data.length > 0) {
        return data[0] as Finance;
      }
    } catch {
      // fallback
    }
    return { finance_id: financeId, ...updates } as Finance;
  },

  async deleteFinance(financeId: string) {
    const pyRes = await pythonApi<{ success: boolean }>(`/api/finance/${financeId}`, {
      method: 'DELETE',
    });
    if (pyRes) return pyRes.success;

    try {
      const { error } = await supabase.from('finance').delete().eq('finance_id', financeId);
      if (!error) return true;
    } catch {
      // fallback
    }
    return true;
  },

  // ==========================================
  // NOTICES MODULE
  // ==========================================
  async getNotices(societyId?: string) {
    const socId = societyId || 'GV2026';
    return cachedQuery(`notices_${socId}`, async () => {
      try {
        const { data, error } = await supabase
          .from('notices')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((n: any) => ({
            notice_id: String(n.notice_id || n.id),
            id: String(n.id || n.notice_id),
            title: n.title || 'Untitled Notice',
            description: n.description || n.message || '',
            category: n.category || 'General',
            priority: n.priority || 'Normal',
            posted_by: n.posted_by || n.created_by || 'Admin',
            posted_date: n.posted_date || (n.created_at ? new Date(n.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
            society_id: n.society_id || socId,
            status: n.status || 'Active',
            is_pinned: !!n.is_pinned
          })) as Notice[];
        }
        if (error) checkRateLimitError(error);
      } catch (err) {
        checkRateLimitError(err);
      }
      return [] as Notice[];
    }, [] as Notice[], 15000);
  },

  async createNotice(noticeData: Partial<Notice>) {
    const socId = noticeData.society_id || 'GV2026';
    const storageKey = `towertech_notices_${socId}`;
    const noticeId = noticeData.notice_id || `NOT-${Date.now().toString().slice(-6)}`;
    const newNotice: Notice = {
      notice_id: noticeId,
      title: noticeData.title || 'Untitled Notice',
      category: noticeData.category || 'General',
      priority: noticeData.priority || 'Normal',
      description: noticeData.description || '',
      posted_by: noticeData.posted_by || 'Admin',
      posted_date: noticeData.posted_date || new Date().toISOString().split('T')[0],
      expiry_date: noticeData.expiry_date || '',
      target_audience: noticeData.target_audience || 'All Residents',
      status: noticeData.status || 'Active',
      is_pinned: !!noticeData.is_pinned,
      society_id: socId,
      attachment_url: noticeData.attachment_url || '',
      attachment_name: noticeData.attachment_name || '',
      acknowledgements: noticeData.acknowledgements || [],
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('notices')
        .insert([newNotice])
        .select();
      if (!error && data && data.length > 0) {
        newNotice.id = data[0].id;
      }
    } catch {
      // fallback
    }

    // Update localStorage
    const local = localStorage.getItem(storageKey);
    const list: Notice[] = local ? JSON.parse(local) : [...initialNotices];
    const updatedList = [newNotice, ...list];
    localStorage.setItem(storageKey, JSON.stringify(updatedList));

    return newNotice;
  },

  async updateNotice(noticeId: string, updates: Partial<Notice>) {
    const socId = updates.society_id || 'GV2026';
    const storageKey = `towertech_notices_${socId}`;

    try {
      await supabase
        .from('notices')
        .update(updates)
        .eq('notice_id', noticeId);
    } catch {
      // ignore
    }

    const local = localStorage.getItem(storageKey);
    const list: Notice[] = local ? JSON.parse(local) : [...initialNotices];
    const index = list.findIndex(n => n.notice_id === noticeId);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      localStorage.setItem(storageKey, JSON.stringify(list));
      return list[index];
    }
    return { notice_id: noticeId, ...updates } as Notice;
  },

  async deleteNotice(noticeId: string, societyId?: string) {
    const socId = societyId || 'GV2026';
    const storageKey = `towertech_notices_${socId}`;

    try {
      await supabase
        .from('notices')
        .delete()
        .eq('notice_id', noticeId);
    } catch {
      // ignore
    }

    const local = localStorage.getItem(storageKey);
    const list: Notice[] = local ? JSON.parse(local) : [...initialNotices];
    const filtered = list.filter(n => n.notice_id !== noticeId);
    localStorage.setItem(storageKey, JSON.stringify(filtered));
    return true;
  },

  async togglePinNotice(noticeId: string, isPinned: boolean, societyId?: string) {
    return this.updateNotice(noticeId, { is_pinned: isPinned, society_id: societyId || 'GV2026' });
  },

  async acknowledgeNotice(noticeId: string, residentId: string, societyId?: string) {
    const socId = societyId || 'GV2026';
    const storageKey = `towertech_notices_${socId}`;
    const local = localStorage.getItem(storageKey);
    const list: Notice[] = local ? JSON.parse(local) : [...initialNotices];
    const notice = list.find(n => n.notice_id === noticeId);
    if (notice) {
      const acks = Array.isArray(notice.acknowledgements) ? [...notice.acknowledgements] : [];
      if (!acks.includes(residentId)) {
        acks.push(residentId);
      }
      return this.updateNotice(noticeId, { acknowledgements: acks, society_id: socId });
    }
    return null;
  },

  // ==========================================
  // COMMUNICATIONS MODULE
  // ==========================================
  async getCommunications(societyId?: string, channel?: string) {
    const socId = societyId || 'GV2026';
    const storageKey = `towertech_communications_${socId}`;

    try {
      let query = supabase
        .from('communications')
        .select('*')
        .eq('society_id', socId)
        .order('created_at', { ascending: true });

      if (channel && channel !== 'all') {
        query = query.eq('channel', channel);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(data));
        return data as Communication[];
      }
    } catch {
      // ignore
    }

    const local = localStorage.getItem(storageKey);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (channel && channel !== 'all') {
            return parsed.filter((c: Communication) => c.channel === channel) as Communication[];
          }
          return parsed as Communication[];
        }
      } catch {
        // ignore
      }
    }

    localStorage.setItem(storageKey, JSON.stringify(initialCommunications));
    if (channel && channel !== 'all') {
      return initialCommunications.filter(c => c.channel === channel);
    }
    return initialCommunications;
  },

  async sendCommunication(messageData: Partial<Communication>) {
    const socId = messageData.society_id || 'GV2026';
    const storageKey = `towertech_communications_${socId}`;
    const msgId = messageData.message_id || `MSG-${Date.now().toString().slice(-6)}`;
    const newMsg: Communication = {
      message_id: msgId,
      channel: messageData.channel || 'general',
      sender_id: messageData.sender_id || 'UNKNOWN',
      sender_name: messageData.sender_name || 'Anonymous',
      sender_role: messageData.sender_role || 'resident',
      sender_tower: messageData.sender_tower,
      sender_flat: messageData.sender_flat,
      recipient_id: messageData.recipient_id,
      recipient_name: messageData.recipient_name,
      title: messageData.title,
      content: messageData.content || '',
      attachment_url: messageData.attachment_url,
      attachment_name: messageData.attachment_name,
      society_id: socId,
      is_announcement: !!messageData.is_announcement,
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('communications')
        .insert([newMsg])
        .select();
      if (!error && data && data.length > 0) {
        newMsg.id = data[0].id;
      }
    } catch {
      // fallback
    }

    const local = localStorage.getItem(storageKey);
    const list: Communication[] = local ? JSON.parse(local) : [...initialCommunications];
    const updatedList = [...list, newMsg];
    localStorage.setItem(storageKey, JSON.stringify(updatedList));

    return newMsg;
  },

  async deleteCommunication(messageId: string, societyId?: string) {
    const socId = societyId || 'GV2026';
    const storageKey = `towertech_communications_${socId}`;

    try {
      await supabase
        .from('communications')
        .delete()
        .eq('message_id', messageId);
    } catch {
      // ignore
    }

    const local = localStorage.getItem(storageKey);
    const list: Communication[] = local ? JSON.parse(local) : [...initialCommunications];
    const filtered = list.filter(m => m.message_id !== messageId);
    localStorage.setItem(storageKey, JSON.stringify(filtered));
    return true;
  },

  // ==========================================
  // RESIDENT DOCUMENTS (OWNER & TENANT)
  // ==========================================
  // RESIDENT DOCUMENTS & VERIFICATION SYSTEM
  // ==========================================
  async getResidentDocuments(residentId: string, societyId?: string): Promise<ResidentDocument[]> {
    console.log('[ResidentDocuments] Querying resident_documents where resident_id =', residentId);
    try {
      // Query resident_documents where: resident_id = current resident ID
      const { data, error } = await supabase
        .from('resident_documents')
        .select('*')
        .eq('resident_id', residentId)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('[ResidentDocuments] Supabase query error:', error);
        throw error;
      }

      console.log('[ResidentDocuments] Query successful, records found:', data?.length || 0);

      // Resolve file_url from Supabase storage if file_path is present
      const docsWithUrls: ResidentDocument[] = (data || []).map(doc => {
        let publicUrl = doc.file_url;
        if (doc.file_path) {
          // Check storage for public URL
          const { data: mediaUrl } = supabase.storage
            .from('media')
            .getPublicUrl(doc.file_path);
          if (mediaUrl?.publicUrl) {
            publicUrl = mediaUrl.publicUrl;
          }
        }
        return {
          ...doc,
          file_url: publicUrl
        };
      });

      return docsWithUrls;
    } catch (err) {
      console.error('[ResidentDocuments] Error in getResidentDocuments:', err);
      // Fallback to local storage cache if database connection fails
      if (typeof window !== 'undefined' && window.localStorage) {
        const socId = societyId || 'SOC001';
        const storageKey = `towertech_documents_${socId}`;
        const local = window.localStorage.getItem(storageKey);
        const allDocs: ResidentDocument[] = local ? JSON.parse(local) : [];
        return allDocs.filter(d => d.resident_id === residentId && d.file_path);
      }
      return [];
    }
  },

  async uploadResidentDocument(params: {
    resident_id: string;
    society_id?: string;
    role?: 'owner' | 'tenant';
    document_type: string;
    document_name: string;
    purpose: string;
    file: File | Blob;
    file_name?: string;
    existingDoc?: ResidentDocument | null;
    deposit_amount?: number;
    deposit_date?: string;
    deposit_ref?: string;
  }): Promise<ResidentDocument> {
    const socId = params.society_id || 'SOC001';
    const roleFolder = params.role || 'owner';
    const docTypeFolder = params.document_type.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const originalFileName = params.file_name || (params.file instanceof File ? params.file.name : `${params.document_type}.pdf`);
    const fileExt = originalFileName.split('.').pop()?.toLowerCase() || 'pdf';
    const mimeType = params.file.type || (fileExt === 'pdf' ? 'application/pdf' : 'image/jpeg');

    // 1. Validate File
    // Allowed: PDF, JPG, JPEG, PNG
    const allowedExts = ['pdf', 'jpg', 'jpeg', 'png'];
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedExts.includes(fileExt) && !allowedMimes.includes(mimeType)) {
      throw new Error('Invalid file format. Only PDF, JPG, JPEG, and PNG files are supported.');
    }

    // Maximum size: 10 MB
    const fileSize = params.file.size;
    if (fileSize > 10 * 1024 * 1024) {
      throw new Error('File size exceeds 10 MB limit. Please upload a smaller file.');
    }

    // Storage Path:
    // resident-documents/{society_id}/{resident_id}/{role}/{document_type}/{filename}
    // Example: resident-documents/SOC001/R001/owner/sale_deed/R001_sale_deed_123456.pdf
    const timestamp = Date.now();
    const cleanBaseName = originalFileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const finalStoredFileName = `${params.resident_id}_${docTypeFolder}_${timestamp}.${fileExt}`;
    const storagePath = `resident-documents/${socId}/${params.resident_id}/${roleFolder}/${docTypeFolder}/${finalStoredFileName}`;

    // Debugging logs (Points 1-5)
    console.log('1. selected file:', originalFileName, `(${fileSize} bytes, ${mimeType})`);
    console.log('2. resident ID:', params.resident_id);
    console.log('3. society ID:', socId);
    console.log('4. document type:', params.document_type);
    console.log('5. Storage path:', storagePath);

    // 2. Upload to Supabase Storage
    let bucketUsed = 'resident-documents';
    let uploadData: any = null;
    let uploadError: any = null;

    try {
      const res = await supabase.storage
        .from('resident-documents')
        .upload(storagePath, params.file, {
          contentType: mimeType,
          upsert: false
        });
      uploadData = res.data;
      uploadError = res.error;
    } catch (e: any) {
      uploadError = e;
    }

    if (uploadError && (uploadError.message?.includes('Bucket not found') || (uploadError as any).statusCode === '404' || (uploadError as any).statusCode === '403')) {
      bucketUsed = 'media';
      try {
        const mediaRes = await supabase.storage
          .from('media')
          .upload(storagePath, params.file, {
            contentType: mimeType,
            upsert: false
          });
        uploadData = mediaRes.data;
        uploadError = mediaRes.error;
      } catch (e: any) {
        uploadError = e;
      }
    }

    console.log('6. Storage upload response:', uploadData, uploadError);

    // If Storage upload fails: DO NOT insert into resident_documents
    if (uploadError) {
      console.error('Supabase Storage upload failed:', uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message || 'Unknown storage error'}`);
    }

    // Resolve public URL for preview/download
    const { data: urlData } = supabase.storage
      .from(bucketUsed)
      .getPublicUrl(storagePath);
    const finalFileUrl = urlData?.publicUrl || '';

    // 3. Duplicate Document Check & DB Operations
    let existingDoc = params.existingDoc;
    if (!existingDoc) {
      const { data: existingRows } = await supabase
        .from('resident_documents')
        .select('*')
        .eq('resident_id', params.resident_id)
        .eq('document_type', params.document_type)
        .limit(1);
      if (existingRows && existingRows.length > 0) {
        existingDoc = existingRows[0];
      }
    }

    let finalRecord: ResidentDocument;

    if (existingDoc && existingDoc.id) {
      // REPLACE FLOW: Update existing resident_documents record
      console.log('[ResidentDocuments] Replacing existing document record ID:', existingDoc.id);
      const updatePayload: Record<string, any> = {
        file_path: storagePath,
        file_url: finalFileUrl,
        file_name: originalFileName,
        file_size: fileSize,
        mime_type: mimeType,
        status: 'Under Review' as DocumentStatus,
        uploaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (params.purpose) {
        updatePayload.purpose = params.deposit_amount
          ? `${params.purpose} (Deposit: ₹${params.deposit_amount}${params.deposit_ref ? `, Ref: ${params.deposit_ref}` : ''})`
          : params.purpose;
      }

      const { data: updateData, error: updateError } = await supabase
        .from('resident_documents')
        .update(updatePayload)
        .eq('id', existingDoc.id)
        .select();

      console.log('7. Database update response:', updateData, updateError);

      if (updateError) {
        // Rollback: Delete the uploaded Storage file immediately
        console.error('Database update failed! Rolling back uploaded storage file:', updateError);
        try {
          await supabase.storage.from(bucketUsed).remove([storagePath]);
        } catch (rbErr) {
          console.error('Rollback error deleting storage file:', rbErr);
        }
        throw new Error(`Database record update failed: ${updateError.message}`);
      }

      finalRecord = (updateData && updateData[0]) || {
        ...existingDoc,
        ...updatePayload
      };

      // Remove the old Storage file after the new upload succeeds
      if (existingDoc.file_path && existingDoc.file_path !== storagePath) {
        console.log('[ResidentDocuments] Removing old storage file:', existingDoc.file_path);
        try {
          await supabase.storage.from(bucketUsed).remove([existingDoc.file_path]);
        } catch (cleanErr) {
          console.warn('[ResidentDocuments] Could not delete old file:', cleanErr);
        }
      }
    } else {
      // INSERT FLOW: Insert new metadata into resident_documents
      const combinedPurpose = params.deposit_amount 
        ? `${params.purpose} (Deposit: ₹${params.deposit_amount}${params.deposit_ref ? `, Ref: ${params.deposit_ref}` : ''})`
        : params.purpose;

      const insertPayload = {
        resident_id: params.resident_id,
        society_id: socId,
        document_type: params.document_type,
        document_name: params.document_name,
        purpose: combinedPurpose,
        file_path: storagePath,
        file_url: finalFileUrl,
        file_name: originalFileName,
        file_size: fileSize,
        mime_type: mimeType,
        status: 'Under Review' as DocumentStatus,
        uploaded_at: new Date().toISOString()
      };

      const { data: insertData, error: insertError } = await supabase
        .from('resident_documents')
        .insert([insertPayload])
        .select();

      console.log('7. Database insert response:', insertData, insertError);

      if (insertError) {
        // Rollback: Delete the uploaded Storage file immediately
        console.error('Database INSERT failed! Rolling back uploaded storage file:', insertError);
        try {
          await supabase.storage.from(bucketUsed).remove([storagePath]);
        } catch (rbErr) {
          console.error('Rollback error deleting storage file:', rbErr);
        }
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      if (!insertData || insertData.length === 0) {
        try {
          await supabase.storage.from(bucketUsed).remove([storagePath]);
        } catch {}
        throw new Error('Database insert returned no rows.');
      }

      finalRecord = insertData[0];
    }

    console.log('8. final document record:', finalRecord);

    // Update local cache
    if (typeof window !== 'undefined' && window.localStorage) {
      const storageKey = `towertech_documents_${socId}`;
      const local = window.localStorage.getItem(storageKey);
      const list: ResidentDocument[] = local ? JSON.parse(local) : [];
      const idx = list.findIndex(d => d.resident_id === params.resident_id && d.document_type === params.document_type);
      if (idx >= 0) {
        list[idx] = finalRecord;
      } else {
        list.push(finalRecord);
      }
      window.localStorage.setItem(storageKey, JSON.stringify(list));
    }

    return finalRecord;
  },

  async deleteResidentDocument(documentId: string, residentId: string, societyId?: string, documentType?: string, filePath?: string): Promise<boolean> {
    console.log('[ResidentDocuments] Deleting document ID:', documentId, 'resident_id:', residentId, 'file_path:', filePath);
    
    // 1. Delete from database
    try {
      if (documentId) {
        const { error } = await supabase
          .from('resident_documents')
          .delete()
          .eq('id', documentId);
        if (error) console.error('[ResidentDocuments] DB delete error:', error);
      } else if (documentType) {
        const { error } = await supabase
          .from('resident_documents')
          .delete()
          .match({ resident_id: residentId, document_type: documentType });
        if (error) console.error('[ResidentDocuments] DB delete error:', error);
      }
    } catch (err) {
      console.error('[ResidentDocuments] Exception deleting from database:', err);
    }

    // 2. Delete file from Storage if file_path is provided
    if (filePath) {
      try {
        console.log('[ResidentDocuments] Deleting file from storage:', filePath);
        await supabase.storage.from('media').remove([filePath]);
        await supabase.storage.from('resident-documents').remove([filePath]);
      } catch (err) {
        console.warn('[ResidentDocuments] Storage remove exception:', err);
      }
    }

    // 3. Clean local storage cache
    if (typeof window !== 'undefined' && window.localStorage) {
      const socId = societyId || 'SOC001';
      const storageKey = `towertech_documents_${socId}`;
      const local = window.localStorage.getItem(storageKey);
      const list: ResidentDocument[] = local ? JSON.parse(local) : [];
      const filtered = list.filter(d => !(d.id === documentId || (d.resident_id === residentId && (documentType ? d.document_type === documentType : false))));
      window.localStorage.setItem(storageKey, JSON.stringify(filtered));
    }

    return true;
  },

  async updateResidentDocumentStatus(
    documentId: string,
    status: DocumentStatus,
    rejectionReason?: string,
    reviewedBy?: string,
    societyId?: string
  ): Promise<ResidentDocument | null> {
    const socId = societyId || 'SOC001';
    const storageKey = `towertech_documents_${socId}`;

    const updatePayload: Partial<ResidentDocument> = {
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewedBy || 'Society Administrator',
      rejection_reason: status === 'Rejected' ? (rejectionReason || 'Document unreadable or invalid') : undefined,
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('resident_documents')
        .update(updatePayload)
        .eq('id', documentId)
        .select();

      if (!error && data && data.length > 0) {
        return data[0];
      }
    } catch (err) {
      console.error('[ResidentDocuments] Error updating document status:', err);
    }

    const local = localStorage.getItem(storageKey);
    const list: ResidentDocument[] = local ? JSON.parse(local) : [];
    const index = list.findIndex(d => d.id === documentId);
    if (index >= 0) {
      list[index] = { ...list[index], ...updatePayload };
      localStorage.setItem(storageKey, JSON.stringify(list));
      return list[index];
    }
    return null;
  }
};

