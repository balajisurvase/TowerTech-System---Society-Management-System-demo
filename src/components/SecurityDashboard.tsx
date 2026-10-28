import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  UserCheck, 
  Clock, 
  LogIn, 
  LogOut as LogOutIcon, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Car, 
  Building2, 
  RefreshCw, 
  X,
  AlertCircle,
  FileText,
  UserPlus,
  Package,
  Siren,
  PhoneCall,
  CheckCircle2,
  Calendar,
  Camera,
  Check,
  Ban
} from 'lucide-react';
import { User, Resident, Visitor } from '../types';
import { societyService } from '../lib/societyService';
import { toast } from 'sonner';

interface SecurityDashboardProps {
  user: User;
  residents: Resident[];
  onLogout?: () => void;
  onUserUpdate?: (updatedUser: Partial<User>) => void;
}

export default function SecurityDashboard({ user, residents, onLogout }: SecurityDashboardProps) {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Inside' | 'Exited' | 'Pending'>('All');
  
  const isSecurityRole = user.role === 'security';
  const isAdminRole = user.role === 'admin' || !!user.admin_id;
  const isResidentRole = !isSecurityRole && !isAdminRole;

  // Registration Modal State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showPreApproveModal, setShowPreApproveModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showResidentCallModal, setShowResidentCallModal] = useState(false);
  const [selectedCallResident, setSelectedCallResident] = useState<Resident | null>(null);
  
  const [visitorPhoto, setVisitorPhoto] = useState<string>('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [residentSearch, setResidentSearch] = useState('');
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [formData, setFormData] = useState({
    visitor_name: '',
    visitor_mobile: '',
    visitor_type: 'Guest',
    vehicle_number: '',
    purpose: '',
    notes: ''
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Photo size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setVisitorPhoto(reader.result as string);
        toast.success('Visitor photo captured successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApproveVisitor = async (visitorId: string | number) => {
    try {
      const updates: Partial<Visitor> = {
        approval_status: 'Approved',
        approval_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setVisitors(prev => prev.map(v => (String(v.visitor_id) === String(visitorId) || String(v.id) === String(visitorId)) ? { ...v, ...updates } : v));
      await societyService.updateVisitor(visitorId, updates);
      toast.success('Visitor entry approved. Security officer can now record gate entry.');
      await fetchVisitors();
    } catch (err) {
      console.error('Failed to approve visitor:', err);
      toast.error('Failed to approve visitor');
    }
  };

  const handleRejectVisitor = async (visitorId: string | number) => {
    const reason = window.prompt('Enter reason for denying entry (optional):', 'Resident declined visitor entry');
    if (reason === null) return;
    try {
      const updates: Partial<Visitor> = {
        approval_status: 'Rejected',
        status: 'Rejected',
        notes: reason || 'Entry denied'
      };
      setVisitors(prev => prev.map(v => (String(v.visitor_id) === String(visitorId) || String(v.id) === String(visitorId)) ? { ...v, ...updates } : v));
      await societyService.updateVisitor(visitorId, updates);
      toast.info('Visitor entry denied.');
      await fetchVisitors();
    } catch (err) {
      console.error('Failed to deny visitor:', err);
      toast.error('Failed to deny visitor');
    }
  };

  const handleRecordEntry = async (visitorId: string | number) => {
    try {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const updates: Partial<Visitor> = {
        status: 'Inside',
        entry_time: timeStr
      };
      setVisitors(prev => prev.map(v => (String(v.visitor_id) === String(visitorId) || String(v.id) === String(visitorId)) ? { ...v, ...updates } : v));
      await societyService.updateVisitor(visitorId, updates);
      toast.success('Visitor entry recorded. Gate barrier access granted.');
      await fetchVisitors();
    } catch (err) {
      console.error('Failed to record visitor entry:', err);
      toast.error('Failed to record entry');
    }
  };

  const fetchVisitors = async () => {
    try {
      const data = await societyService.getVisitors();
      const mapped = data.map(v => {
        const res = residents.find(r => r.resident_id === v.resident_id);
        return {
          ...v,
          resident_name: v.resident_name || res?.name || 'Resident',
          tower: v.tower || res?.tower || 'A',
          floor: v.floor ?? res?.floor ?? 1,
          flat: v.flat || res?.flat || '101'
        };
      });
      setVisitors(mapped);
    } catch (err) {
      console.warn('Could not fetch visitors:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
    // Fast 8-second auto-refresh polling for real-time visitor gate synchronization
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchVisitors();
      }
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVisitors();
  };

  // Role-filtered visitor records:
  // Residents see ONLY visitors for their flat/resident_id
  // Security and Admin see all society visitors
  const roleBaseVisitors = visitors.filter(v => {
    if (isResidentRole) {
      const myResId = user.resident_id || user.id;
      const myFlat = user.flat;
      const matchRes = myResId && String(v.resident_id) === String(myResId);
      const matchFlat = myFlat && String(v.flat).toLowerCase().trim() === String(myFlat).toLowerCase().trim();
      return matchRes || matchFlat;
    }
    return true;
  });

  // Filter visitors by status & search query
  const filteredVisitors = roleBaseVisitors.filter(v => {
    const matchesStatus = statusFilter === 'All' 
      ? true 
      : statusFilter === 'Pending' 
        ? (v.status === 'Pending' || v.approval_status === 'Pending')
        : v.status === statusFilter;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      (v.visitor_name && v.visitor_name.toLowerCase().includes(q)) ||
      (v.visitor_mobile && v.visitor_mobile.toLowerCase().includes(q)) ||
      (v.resident_name && v.resident_name.toLowerCase().includes(q)) ||
      (v.flat && v.flat.toLowerCase().includes(q)) ||
      (v.vehicle_number && v.vehicle_number.toLowerCase().includes(q)) ||
      (v.purpose && v.purpose.toLowerCase().includes(q))
    );

    return matchesStatus && matchesSearch;
  });

  // Metrics
  const insideCount = roleBaseVisitors.filter(v => v.status === 'Inside').length;
  const expectedCount = roleBaseVisitors.filter(v => v.status === 'Pending' || v.approval_status === 'Pending').length;
  const exitedTodayCount = roleBaseVisitors.filter(v => v.status === 'Exited').length;
  const deliveriesCount = roleBaseVisitors.filter(v => v.visitor_type === 'Delivery').length;

  const handleMarkExit = async (visitorId: string | number) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updates: Partial<Visitor> = {
      status: 'Exited',
      exit_time: timeStr
    };

    setVisitors(prev => prev.map(v => (String(v.visitor_id) === String(visitorId) || String(v.id) === String(visitorId)) ? { ...v, ...updates } : v));
    toast.success('Visitor marked as Exited.');
    await societyService.updateVisitor(visitorId, updates);
    await fetchVisitors();
  };

  const handlePreApproveVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.visitor_name.trim() || !formData.visitor_mobile.trim()) {
      toast.error('Please enter visitor name and mobile number.');
      return;
    }

    setRegisterLoading(true);
    try {
      const newVisitorData: Partial<Visitor> = {
        visitor_name: formData.visitor_name.trim(),
        visitor_mobile: formData.visitor_mobile.trim(),
        visitor_type: formData.visitor_type || 'Guest',
        vehicle_number: formData.vehicle_number?.trim() || undefined,
        purpose: formData.purpose?.trim() || 'Pre-Approved Guest Entry',
        profile_photo: visitorPhoto || undefined,
        resident_id: user.resident_id || user.id,
        resident_name: user.name,
        tower: user.tower || 'A',
        floor: user.floor || 1,
        flat: user.flat || '101',
        status: 'Pending',
        approval_status: 'Approved',
        entry_time: 'Expected Today',
        security_id: 'PRE-APPROVED',
        created_at: new Date().toISOString()
      };

      await societyService.addVisitor(newVisitorData);
      toast.success(`Pre-approved visitor pass generated for ${formData.visitor_name}`);
      await fetchVisitors();

      setShowPreApproveModal(false);
      setVisitorPhoto('');
      setFormData({
        visitor_name: '',
        visitor_mobile: '',
        visitor_type: 'Guest',
        vehicle_number: '',
        purpose: '',
        notes: ''
      });
    } catch (err) {
      console.error('Failed to pre-approve visitor:', err);
      toast.error('Failed to pre-approve visitor');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleRegisterVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResident) {
      toast.error('Please search and select a resident flat first.');
      return;
    }

    setRegisterLoading(true);
    try {
      const newVisitorData: Partial<Visitor> = {
        visitor_name: formData.visitor_name,
        visitor_mobile: formData.visitor_mobile,
        visitor_type: formData.visitor_type,
        vehicle_number: formData.vehicle_number || undefined,
        purpose: formData.purpose,
        profile_photo: visitorPhoto || undefined,
        resident_id: selectedResident.resident_id,
        status: 'Pending',
        approval_status: 'Pending',
        entry_time: 'Awaiting Authorization',
        security_id: user.security_id || user.id,
        security_user_name: user.name,
        security_user_shift: user.shift || 'General',
        resident_name: selectedResident.name,
        tower: selectedResident.tower,
        floor: selectedResident.floor,
        flat: selectedResident.flat,
        created_at: new Date().toISOString()
      };

      await societyService.addVisitor(newVisitorData);
      toast.success(`Visitor logged for Flat ${selectedResident.tower}-${selectedResident.flat}. Approval request routed to Resident and Admin.`);
      await fetchVisitors();

      setShowRegisterModal(false);
      setVisitorPhoto('');
      setFormData({
        visitor_name: '',
        visitor_mobile: '',
        visitor_type: 'Guest',
        vehicle_number: '',
        purpose: '',
        notes: ''
      });
      setSelectedResident(null);
      setResidentSearch('');
    } catch (err) {
      console.error('Failed to register visitor:', err);
      toast.error('Failed to register visitor');
    } finally {
      setRegisterLoading(false);
    }
  };

  const filteredResidents = residents.filter(r => {
    const q = residentSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      r.name.toLowerCase().includes(q) ||
      r.flat.toLowerCase().includes(q) ||
      r.resident_id.toLowerCase().includes(q) ||
      (r.tower && r.tower.toLowerCase().includes(q))
    );
  }).slice(0, 5);

  const now = new Date();
  const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateFormatted = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Card */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-900/40">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight">
                {isResidentRole ? 'Visitor Management' : isAdminRole ? 'Visitor Management Log' : 'Security Gate Post'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Gate Sync Active
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {isResidentRole ? (
                <>Resident Account: <span className="text-white font-bold">{user.name}</span> • Flat {user.flat || 'A-102'}</>
              ) : isAdminRole ? (
                <>Administrator View: <span className="text-white font-bold">{user.name}</span> • Society Records</>
              ) : (
                <>Duty Officer: <span className="text-white font-bold">{user.name}</span> ({user.shift || 'General Shift'})</>
              )} • <span className="font-mono text-indigo-300">{dateFormatted}, {timeFormatted}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isResidentRole && (
            <button
              onClick={() => {
                setFormData({
                  visitor_name: '',
                  visitor_mobile: '',
                  visitor_type: 'Guest',
                  vehicle_number: '',
                  purpose: 'Pre-Approved Guest Entry',
                  notes: ''
                });
                setShowPreApproveModal(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Pre-Approve Guest Pass</span>
            </button>
          )}

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors flex items-center gap-2 text-xs font-bold shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Sync Gate Data</span>
          </button>
        </div>
      </div>

      {/* SPEED & TOUCH TARGETS: PRIMARY QUICK ACTIONS */}
      <div className="space-y-2">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 px-1">
          Primary Gate Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. VISITOR CHECK-IN (Prominent) */}
          <button
            onClick={() => {
              setFormData(prev => ({ ...prev, visitor_type: 'Guest' }));
              setShowRegisterModal(true);
            }}
            className="col-span-2 sm:col-span-1 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-md shadow-indigo-600/20 transition-all active:scale-95 text-left flex flex-col justify-between h-28 border border-indigo-500 group"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-black leading-tight">Visitor Check-In</p>
              <p className="text-[10px] text-indigo-200 font-medium">New guest entry</p>
            </div>
          </button>

          {/* 2. VISITOR CHECK-OUT */}
          <button
            onClick={() => setStatusFilter('Inside')}
            className="p-4 bg-white hover:bg-slate-50 text-slate-800 rounded-2xl border border-slate-200 shadow-2xs transition-all active:scale-95 text-left flex flex-col justify-between h-28 group"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-indigo-50 text-slate-700 group-hover:text-indigo-600 flex items-center justify-center transition-colors">
              <LogOutIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight text-slate-900">Visitor Check-Out</p>
              <p className="text-[10px] text-slate-400 font-medium">{insideCount} Inside</p>
            </div>
          </button>

          {/* 3. DELIVERY ENTRY */}
          <button
            onClick={() => {
              setFormData(prev => ({ ...prev, visitor_type: 'Delivery', purpose: 'Parcel Delivery' }));
              setShowRegisterModal(true);
            }}
            className="p-4 bg-white hover:bg-amber-50/50 text-slate-800 rounded-2xl border border-slate-200 shadow-2xs transition-all active:scale-95 text-left flex flex-col justify-between h-28 group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight text-slate-900">Delivery Entry</p>
              <p className="text-[10px] text-slate-400 font-medium">Amazon, Swiggy, etc.</p>
            </div>
          </button>

          {/* 4. VEHICLE ENTRY */}
          <button
            onClick={() => {
              setFormData(prev => ({ ...prev, visitor_type: 'Cab / Taxi', purpose: 'Cab Entry' }));
              setShowRegisterModal(true);
            }}
            className="p-4 bg-white hover:bg-blue-50/50 text-slate-800 rounded-2xl border border-slate-200 shadow-2xs transition-all active:scale-95 text-left flex flex-col justify-between h-28 group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight text-slate-900">Vehicle Entry</p>
              <p className="text-[10px] text-slate-400 font-medium">Cab / Parking Pass</p>
            </div>
          </button>

          {/* 5. RESIDENT CALL */}
          <button
            onClick={() => setShowResidentCallModal(true)}
            className="p-4 bg-white hover:bg-emerald-50/50 text-slate-800 rounded-2xl border border-slate-200 shadow-2xs transition-all active:scale-95 text-left flex flex-col justify-between h-28 group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight text-slate-900">Resident Call</p>
              <p className="text-[10px] text-slate-400 font-medium">Intercom Directory</p>
            </div>
          </button>

          {/* 6. EMERGENCY */}
          <button
            onClick={() => setShowEmergencyModal(true)}
            className="p-4 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-2xl border border-rose-200 shadow-2xs transition-all active:scale-95 text-left flex flex-col justify-between h-28 group"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center">
              <Siren className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-black text-rose-700 leading-tight">Emergency</p>
              <p className="text-[10px] text-rose-500 font-semibold">Broadcast Alert</p>
            </div>
          </button>
        </div>
      </div>

      {/* LIVE GATE STATUS SUMMARY CARDS (Solid Vibrant Colors) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#2563EB] p-5 rounded-2xl shadow-lg shadow-blue-500/20 text-white flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-white/90">Visitors Inside</p>
            <h3 className="text-3xl font-black text-white font-mono tracking-tight mt-1">{insideCount}</h3>
            <p className="text-[11px] font-bold text-white/80 mt-0.5">Currently on premises</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center font-black backdrop-blur-xs">
            <LogIn className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="bg-[#EA580C] p-5 rounded-2xl shadow-lg shadow-orange-500/20 text-white flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-white/90">Expected Visitors</p>
            <h3 className="text-3xl font-black text-white font-mono tracking-tight mt-1">{expectedCount}</h3>
            <p className="text-[11px] font-bold text-white/80 mt-0.5">Pre-approved by flat</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center font-black backdrop-blur-xs">
            <Clock className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="bg-[#059669] p-5 rounded-2xl shadow-lg shadow-emerald-500/20 text-white flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-white/90">Checked Out Today</p>
            <h3 className="text-3xl font-black text-white font-mono tracking-tight mt-1">{exitedTodayCount}</h3>
            <p className="text-[11px] font-bold text-white/80 mt-0.5">Exited gate safely</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center font-black backdrop-blur-xs">
            <LogOutIcon className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="bg-[#0D9488] p-5 rounded-2xl shadow-lg shadow-teal-500/20 text-white flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-white/90">Deliveries Today</p>
            <h3 className="text-3xl font-black text-white font-mono tracking-tight mt-1">{deliveriesCount}</h3>
            <p className="text-[11px] font-bold text-white/80 mt-0.5">Couriers / Parcels</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center font-black backdrop-blur-xs">
            <Package className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* LIVE VISITOR LOG & CONTROLS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Live Visitor Log</h3>
            <p className="text-[11px] text-slate-400">Real-time gate passes & status management</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, flat, mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl">
              {(['All', 'Inside', 'Exited', 'Pending'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors ${
                    statusFilter === tab ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Visitor Cards / Table */}
        <div className="space-y-3">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs font-semibold">
              Loading gate visitor logs...
            </div>
          ) : filteredVisitors.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-xs font-bold text-slate-600">No visitors found</p>
              <p className="text-[10px] text-slate-400 mt-0.5">No visitors currently match the filter criteria.</p>
            </div>
          ) : (
            filteredVisitors.map(v => {
              const isInside = v.status === 'Inside';
              const isExited = v.status === 'Exited';
              const isPendingApproval = v.approval_status === 'Pending' || (!v.approval_status && v.status === 'Pending');
              const isApproved = v.approval_status === 'Approved';
              const isDenied = v.approval_status === 'Rejected' || v.status === 'Rejected';

              // Current user can approve if Admin OR if Resident of destination flat
              const canApprove = isAdminRole || (isResidentRole && (
                (user.resident_id && String(v.resident_id) === String(user.resident_id)) ||
                (user.flat && String(v.flat).toLowerCase().trim() === String(user.flat).toLowerCase().trim())
              ));

              return (
                <div 
                  key={v.visitor_id || v.id}
                  className="p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    {v.profile_photo ? (
                      <img 
                        src={v.profile_photo} 
                        alt={v.visitor_name} 
                        className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs" 
                      />
                    ) : (
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isInside ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {v.visitor_name ? v.visitor_name.charAt(0).toUpperCase() : 'V'}
                      </div>
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{v.visitor_name}</span>
                        <span className="text-[10px] font-semibold text-slate-500">({v.visitor_mobile})</span>
                        
                        {/* Approval Status Badge */}
                        {isDenied ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                            Entry Denied
                          </span>
                        ) : isApproved ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Authorized
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                            Pending Approval
                          </span>
                        )}

                        {/* Premises Status Badge */}
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          isInside 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : isExited 
                              ? 'bg-slate-100 text-slate-600' 
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          ● {v.status || 'Pending Gate In'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Visiting: <strong className="text-indigo-700 font-bold">{v.resident_name || 'Resident'}</strong> (Flat {v.tower}-{v.flat}) • Type: {v.visitor_type || 'Guest'} • Purpose: {v.purpose || 'Visit'}
                        {v.vehicle_number ? ` • Vehicle: ${v.vehicle_number}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <div className="text-right text-[11px] text-slate-400 mr-1">
                      <span>Entry: <strong className="text-slate-700">{v.entry_time || 'Pending'}</strong></span>
                      {v.exit_time && <span> • Exit: <strong className="text-slate-700">{v.exit_time}</strong></span>}
                    </div>

                    {/* Resident & Admin Approve / Deny Action Buttons */}
                    {isPendingApproval && canApprove && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleApproveVisitor(v.visitor_id || v.id!)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition"
                          title="Authorize gate entry for this visitor"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleRejectVisitor(v.visitor_id || v.id!)}
                          className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition"
                          title="Deny gate entry"
                        >
                          <Ban className="w-3.5 h-3.5" /> Deny
                        </button>
                      </div>
                    )}

                    {/* Security Staff: Record Entry after resident authorization */}
                    {isApproved && !isInside && !isExited && (isSecurityRole || isAdminRole) && (
                      <button
                        onClick={() => handleRecordEntry(v.visitor_id || v.id!)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
                        title="Record physical gate barrier entry"
                      >
                        <LogIn className="w-3.5 h-3.5" /> Record Entry
                      </button>
                    )}

                    {/* Security Staff: Prompt flat if visitor still pending authorization */}
                    {isPendingApproval && isSecurityRole && (
                      <button
                        onClick={() => {
                          const res = residents.find(r => r.resident_id === v.resident_id);
                          if (res) {
                            setSelectedCallResident(res);
                            setShowResidentCallModal(true);
                          } else {
                            toast.info(`Intercom dialed to Flat ${v.flat}`);
                          }
                        }}
                        className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                      >
                        <PhoneCall className="w-3 h-3" /> Call Flat
                      </button>
                    )}

                    {/* Inside Premises -> Check Out Button */}
                    {isInside && (isSecurityRole || isAdminRole) && (
                      <button
                        onClick={() => handleMarkExit(v.visitor_id || v.id!)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
                      >
                        <LogOutIcon className="w-3.5 h-3.5" /> Check Out
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* VISITOR CHECK-IN MODAL */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-[100] overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-lg w-full relative border border-slate-200 my-8 animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowRegisterModal(false)}
              className="absolute right-6 top-6 p-1 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Visitor Check-In</h3>
                <p className="text-xs text-slate-500 font-medium">Log visitor details for immediate gate pass entry</p>
              </div>
            </div>

            <form onSubmit={handleRegisterVisitor} className="space-y-4">
              {/* Resident Search & Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Target Resident Flat *
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search resident name, flat (e.g. A-101)..."
                    value={residentSearch}
                    onChange={(e) => {
                      setResidentSearch(e.target.value);
                      if (selectedResident && selectedResident.name !== e.target.value) {
                        setSelectedResident(null);
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-semibold text-slate-800"
                  />
                </div>

                {!selectedResident && residentSearch && (
                  <div className="mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto divide-y divide-slate-100">
                    {filteredResidents.length === 0 ? (
                      <div className="p-3 text-xs text-slate-400 text-center">No resident matching query</div>
                    ) : (
                      filteredResidents.map(res => (
                        <button
                          key={res.resident_id}
                          type="button"
                          onClick={() => {
                            setSelectedResident(res);
                            setResidentSearch(`${res.name} (Tower ${res.tower} - Flat ${res.flat})`);
                          }}
                          className="w-full p-2.5 text-left hover:bg-indigo-50/50 flex items-center justify-between text-xs transition"
                        >
                          <div>
                            <strong className="text-slate-800">{res.name}</strong>
                            <span className="text-slate-400 ml-2">Tower {res.tower} • Flat {res.flat}</span>
                          </div>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                            {res.resident_id}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {selectedResident && (
                  <div className="mt-2 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-indigo-900">{selectedResident.name}</p>
                      <p className="text-[11px] text-indigo-700">
                        Tower {selectedResident.tower} • Flat {selectedResident.flat} • Phone: {selectedResident.phone}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedResident(null);
                        setResidentSearch('');
                      }}
                      className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px]"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Visitor Photo Capture / Upload */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-indigo-600" />
                    Visitor Photo Verification (Optional)
                  </span>
                  {visitorPhoto && (
                    <button 
                      type="button" 
                      onClick={() => setVisitorPhoto('')}
                      className="text-rose-600 hover:text-rose-700 text-[10px] font-bold"
                    >
                      Remove Photo
                    </button>
                  )}
                </label>
                <div className="flex items-center gap-3">
                  {visitorPhoto ? (
                    <img 
                      src={visitorPhoto} 
                      alt="Captured visitor" 
                      className="w-14 h-14 rounded-xl object-cover border-2 border-indigo-500 shadow-sm" 
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 bg-white">
                      <Camera className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition">
                      <Camera className="w-4 h-4 text-indigo-600" />
                      <span>{visitorPhoto ? 'Change Photo' : 'Capture / Upload Photo'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        capture="user" 
                        className="hidden" 
                        onChange={handlePhotoUpload} 
                      />
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1">Camera snapshot or image file (max 2MB)</p>
                  </div>
                </div>
              </div>

              {/* Visitor Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Visitor Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amit Sharma"
                    value={formData.visitor_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, visitor_name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={formData.visitor_mobile}
                    onChange={(e) => setFormData(prev => ({ ...prev, visitor_mobile: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Visitor Category
                  </label>
                  <select
                    value={formData.visitor_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, visitor_type: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white outline-none focus:border-indigo-500"
                  >
                    <option value="Guest">Guest / Friend</option>
                    <option value="Delivery">Delivery / Courier</option>
                    <option value="Maintenance / Service">Service Worker</option>
                    <option value="Cab / Taxi">Cab / Taxi</option>
                    <option value="Relative">Relative</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Vehicle Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MH-12-AB-1234"
                    value={formData.vehicle_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicle_number: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Purpose of Visit *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Guest Visit / Parcel Delivery"
                  value={formData.purpose}
                  onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registerLoading || !selectedResident}
                  className="flex-[1.5] py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2"
                >
                  {registerLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'CHECK IN VISITOR'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESIDENT CALL DIRECTORY MODAL */}
      {showResidentCallModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-lg w-full relative border border-slate-200 animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowResidentCallModal(false)}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Intercom & Resident Directory</h3>
                <p className="text-xs text-slate-400">Quick dial security intercom to resident flat</p>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto divide-y divide-slate-100">
              {residents.slice(0, 8).map(r => (
                <div key={r.resident_id} className="pt-2 pb-1 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800">{r.name}</p>
                    <p className="text-[10px] text-slate-400">Flat {r.tower}-{r.flat} • {r.role}</p>
                  </div>
                  <a
                    href={`tel:${r.phone}`}
                    onClick={() => toast.success(`Calling ${r.name} (${r.phone})...`)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[10px] uppercase flex items-center gap-1 shadow-2xs"
                  >
                    <Phone className="w-3 h-3" />
                    Call Flat
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PRE-APPROVE GUEST PASS MODAL (FOR RESIDENTS) */}
      {showPreApproveModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full relative border border-slate-200 animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowPreApproveModal(false)}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Pre-Approve Guest Gate Pass</h3>
                <p className="text-xs text-slate-400">Flat {user.flat || 'A-102'} • Seamless Gate Access</p>
              </div>
            </div>

            <form onSubmit={handlePreApproveVisitor} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Visitor / Guest Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.visitor_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, visitor_name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Visitor Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  value={formData.visitor_mobile}
                  onChange={(e) => setFormData(prev => ({ ...prev, visitor_mobile: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pass Category</label>
                  <select
                    value={formData.visitor_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, visitor_type: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value="Guest">Guest / Friend</option>
                    <option value="Delivery">Delivery (Parcel / Food)</option>
                    <option value="Cab / Taxi">Cab / Taxi</option>
                    <option value="Service / Repair">Service / Maintenance</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vehicle Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="MH-12-XX-1234"
                    value={formData.vehicle_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicle_number: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Purpose / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Dinner visit / Amazon parcel"
                  value={formData.purpose}
                  onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPreApproveModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="flex-[1.5] py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs uppercase shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2"
                >
                  {registerLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'ISSUE PRE-APPROVED PASS'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EMERGENCY BROADCAST MODAL */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-rose-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full relative border border-rose-200 animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowEmergencyModal(false)}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center space-y-3">
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
                <Siren className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="text-xl font-black text-rose-700">Security Gate Emergency Siren</h3>
              <p className="text-xs text-slate-500">
                Trigger high-priority society emergency broadcast to all resident dashboards and admin alert system.
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs uppercase"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.error('EMERGENCY SIREN BROADCAST SENT TO ALL RESIDENTS');
                  setShowEmergencyModal(false);
                }}
                className="flex-1 py-3 bg-rose-600 text-white font-black rounded-xl text-xs uppercase shadow-lg shadow-rose-200"
              >
                Trigger Siren Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

