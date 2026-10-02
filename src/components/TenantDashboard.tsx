import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { 
  Key, 
  Home, 
  User as UserIcon, 
  Phone, 
  Mail, 
  CreditCard, 
  MessageSquare, 
  Calendar, 
  ShieldCheck, 
  Upload, 
  Check, 
  Clock, 
  Plus, 
  FileText, 
  Camera, 
  Sparkles, 
  ChevronRight, 
  Download, 
  AlertCircle, 
  Building2, 
  Lock, 
  Eye, 
  EyeOff, 
  Copy, 
  Receipt,
  UserPlus,
  Send
} from 'lucide-react';
import { Resident, MaintenanceRecord, Complaint, Booking, User } from '../types';
import { societyService } from '../lib/societyService';
import { toast } from 'sonner';
import { format } from 'date-fns';
import NoticeBoard from './NoticeBoard';
import CommunicationCenter from './CommunicationCenter';
import AmenityBooking from './AmenityBooking';

interface TenantDashboardProps {
  activeTab: string;
  resident: Resident;
  residents?: Resident[];
  maintenance: MaintenanceRecord[];
  complaints: Complaint[];
  bookings: Booking[];
  onRefresh: () => void;
  onLogout: () => void;
  setActiveTab: (tab: string) => void;
  onUserUpdate?: (updatedUser: Partial<User | Resident>) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
];

export default function TenantDashboard({
  activeTab,
  resident,
  residents = [],
  maintenance,
  complaints,
  bookings,
  onRefresh,
  onLogout,
  setActiveTab,
  onUserUpdate
}: TenantDashboardProps) {
  // Find linked owner using owner_id or matching tower & flat
  const linkedOwner = residents.find(r => 
    r.resident_id === resident.owner_id || 
    (r.tower === resident.tower && r.flat === resident.flat && (r.role === 'Owner' || r.occupancy_type === 'Owner'))
  ) || {
    name: resident.owner_name || 'Deepak Yadav',
    resident_id: resident.owner_id || 'R021',
    phone: resident.owner_phone || '9000000021',
    email: 'owner@gvsociety.com',
    tower: resident.tower,
    flat: resident.flat
  };

  // Profile Form state
  const [profileData, setProfileData] = useState({
    name: resident.name || '',
    phone: resident.phone || '',
    email: resident.email || '',
    profile_photo: resident.profile_photo || (resident as any)?.avatar || '',
    password: resident.password || 'tenant123'
  });

  const [photoPreview, setPhotoPreview] = useState<string>(
    resident.profile_photo || (resident as any)?.avatar || ''
  );
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  // Tenant Quick Complaint state
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [newComplaintCategory, setNewComplaintCategory] = useState('Plumbing / Water');
  const [newComplaintDesc, setNewComplaintDesc] = useState('');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  // Tenant Guest Pass state
  const [showGuestPassModal, setShowGuestPassModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestVehicle, setGuestVehicle] = useState('');
  const [issuedGuestPasses, setIssuedGuestPasses] = useState<Array<{ id: string; name: string; phone: string; code: string; date: string }>>([
    { id: 'GP-901', name: 'Vikram Mehta', phone: '9820011223', code: 'PASS-8812', date: format(new Date(), 'dd MMM yyyy') }
  ]);

  useEffect(() => {
    setProfileData({
      name: resident.name || '',
      phone: resident.phone || '',
      email: resident.email || '',
      profile_photo: resident.profile_photo || (resident as any)?.avatar || '',
      password: resident.password || 'tenant123'
    });
    setPhotoPreview(resident.profile_photo || (resident as any)?.avatar || '');
  }, [resident.name, resident.phone, resident.email, resident.profile_photo, resident.password]);

  // Handle Photo File Upload
  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPhotoPreview(base64String);
        setProfileData(prev => ({ ...prev, profile_photo: base64String }));
        toast.success('New photo loaded! Click "Save Profile Settings" to apply.');
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Profile Settings
  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const updates = {
        name: profileData.name,
        phone: profileData.phone,
        email: profileData.email,
        profile_photo: photoPreview,
        avatar: photoPreview,
        password: profileData.password
      };

      await societyService.updateResident(resident.resident_id, updates);
      if (onUserUpdate) {
        onUserUpdate(updates);
      }
      toast.success('Tenant profile & image updated successfully!');
      onRefresh();
    } catch (err) {
      toast.error('Failed to update profile: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Create Tenant Complaint
  const handleCreateComplaint = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComplaintDesc.trim()) {
      toast.error('Please enter a complaint description');
      return;
    }
    setSubmittingComplaint(true);
    try {
      await societyService.addComplaint({
        resident_id: resident.resident_id,
        resident_name: resident.name,
        tower: resident.tower,
        flat_no: resident.flat,
        category: newComplaintCategory,
        description: newComplaintDesc,
        status: 'Pending',
        complaint_date: new Date().toISOString(),
        society_id: resident.society_id || 'GV2026'
      });
      toast.success('Complaint submitted successfully!');
      setNewComplaintDesc('');
      setShowComplaintModal(false);
      onRefresh();
    } catch (err) {
      toast.error('Failed to submit complaint: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmittingComplaint(false);
    }
  };

  // Issue Guest Pass
  const handleIssueGuestPass = (e: FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestPhone.trim()) {
      toast.error('Please fill in visitor name and phone number');
      return;
    }
    const code = `GP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPass = {
      id: `GP-${Date.now().toString().slice(-4)}`,
      name: guestName,
      phone: guestPhone,
      code,
      date: format(new Date(), 'dd MMM yyyy')
    };
    setIssuedGuestPasses([newPass, ...issuedGuestPasses]);
    toast.success(`Guest pass generated! Gate Code: ${code}`);
    setGuestName('');
    setGuestPhone('');
    setGuestVehicle('');
    setShowGuestPassModal(false);
  };

  // My Bills for Tenant
  const tenantMaintenance = maintenance.filter(m => m.flat_no === resident.flat || m.resident_id === resident.resident_id);
  const unpaidCount = tenantMaintenance.filter(m => m.status !== 'Paid').length;

  // Render Sub-Views based on activeTab
  if (activeTab === 'notices') {
    return <NoticeBoard user={resident as unknown as User} onSwitchTab={setActiveTab} onRefresh={onRefresh} />;
  }

  if (activeTab === 'communication') {
    return <CommunicationCenter user={resident as unknown as User} onSwitchTab={setActiveTab} onRefresh={onRefresh} />;
  }

  if (activeTab === 'bookings') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-slate-900">Amenity Booking for Tenants</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Book society facilities & sports arenas</p>
          </div>
          <span className="px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-purple-100 text-purple-800 border border-purple-200">
            Tenant Access Granted
          </span>
        </div>
        <AmenityBooking resident={resident} onRefresh={onRefresh} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* TENANT HERO BANNER */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-8 rounded-3xl shadow-xl border border-purple-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative group shrink-0">
              {photoPreview ? (
                <img 
                  src={photoPreview} 
                  alt={resident.name} 
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-purple-400/80 shadow-lg ring-4 ring-purple-500/30"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-purple-700/80 border-4 border-purple-400/80 flex items-center justify-center font-black text-2xl text-white shadow-lg">
                  {resident.name.charAt(0)}
                </div>
              )}
              <button 
                onClick={() => setActiveTab('profile')}
                className="absolute -bottom-1 -right-1 bg-purple-600 hover:bg-purple-500 text-white p-1.5 rounded-xl text-[10px] font-bold shadow-md border border-white/20 transition-all"
                title="Change Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-purple-500/30 text-purple-200 border border-purple-400/30 flex items-center gap-1.5 shadow-sm">
                  <Key className="w-3.5 h-3.5 text-purple-300" />
                  TENANT PORTAL
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Tenant
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-2 text-white">
                Welcome, {resident.name}
              </h2>
              <p className="text-xs font-bold text-purple-200/80 uppercase tracking-widest mt-1 flex items-center gap-2">
                <span>Tenant ID: <strong className="text-white font-mono bg-purple-800/60 px-2 py-0.5 rounded border border-purple-600/50">{resident.tenant_id || 'T001'}</strong></span>
                <span>•</span>
                <span>Tower {resident.tower} - Flat {resident.flat}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('profile')}
              className="px-4 py-2.5 bg-purple-600/80 hover:bg-purple-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-purple-400/30 flex items-center gap-2 shadow-md"
            >
              <Camera className="w-4 h-4" />
              Upload Profile Photo
            </button>
            <button
              onClick={() => setShowGuestPassModal(true)}
              className="px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-md"
            >
              <UserPlus className="w-4 h-4 text-purple-700" />
              Issue Gate Pass
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'profile' ? (
        /* TENANT PROFILE SETTINGS & UPLOAD MODULE */
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-8">
          <div className="flex items-center justify-between pb-6 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-black text-slate-900">Tenant Profile Settings</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                Upload profile image & manage personal credentials
              </p>
            </div>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 font-black text-[10px] uppercase tracking-widest rounded-full border border-purple-200">
              Tenant ID: {resident.tenant_id || 'T001'}
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-8">
            {/* UPLOAD PROFILE IMAGE SECTION */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-widest">
                Profile Photo / Avatar Settings
              </label>
              
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="shrink-0 text-center">
                  {photoPreview ? (
                    <img 
                      src={photoPreview} 
                      alt="Avatar preview" 
                      className="w-24 h-24 rounded-2xl object-cover border-4 border-purple-500 shadow-md ring-2 ring-purple-200 mx-auto"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-purple-600 text-white font-black text-3xl flex items-center justify-center border-4 border-purple-500 shadow-md mx-auto">
                      {profileData.name.charAt(0) || 'T'}
                    </div>
                  )}
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Current Photo</p>
                </div>

                <div className="flex-1 space-y-3 w-full">
                  <div>
                    <p className="text-xs font-bold text-slate-700">Option 1: Upload Image File</p>
                    <p className="text-[11px] text-slate-500">Choose a photo from your device (PNG, JPG, max 5MB)</p>
                  </div>
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl cursor-pointer transition-all uppercase tracking-widest shadow-sm">
                    <Upload className="w-4 h-4" />
                    Upload Image File
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoUpload} 
                      className="hidden" 
                    />
                  </label>

                  <div className="pt-2">
                    <p className="text-xs font-bold text-slate-700 mb-2">Option 2: Pick Preset Avatar</p>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_AVATARS.map((url, idx) => (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => {
                            setPhotoPreview(url);
                            setProfileData(prev => ({ ...prev, profile_photo: url }));
                            toast.success('Selected preset avatar');
                          }}
                          className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all ${
                            photoPreview === url ? 'border-purple-600 ring-2 ring-purple-300 scale-105' : 'border-slate-200 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PERSONAL DETAILS FIELDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Tenant Full Name
                </label>
                <input 
                  type="text" 
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Phone Number
                </label>
                <input 
                  type="text" 
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Email Address
                </label>
                <input 
                  type="email" 
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Login Password
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={profileData.password}
                    onChange={(e) => setProfileData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 font-mono font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={updatingProfile}
                className="px-6 py-3 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                {updatingProfile ? 'Saving...' : 'Save Profile & Photo'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* TENANT DASHBOARD OVERVIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLUMNS: LANDLORD INFO, BILLS, REPAIRS */}
          <div className="lg:col-span-2 space-y-6">
            {/* PROPERTY OWNER / LANDLORD CARD */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 font-black">
                    <Home className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Landlord / Owner Information</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Property owner for Flat {resident.flat}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-black text-[10px] uppercase tracking-wider rounded-md border border-amber-200">
                  Owner ID: {linkedOwner.resident_id || 'R021'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Owner Name</p>
                  <p className="text-sm font-black text-slate-800 mt-0.5">{linkedOwner.name || 'Deepak Yadav'}</p>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact Phone</p>
                  <p className="text-sm font-mono font-bold text-slate-800 mt-0.5">{linkedOwner.phone || '9000000021'}</p>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Flat Unit</p>
                  <p className="text-sm font-black text-slate-800 mt-0.5">Tower {resident.tower} - {resident.flat}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <a
                  href={`tel:${linkedOwner.phone}`}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-xs"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Call Owner
                </a>
                <button
                  onClick={() => {
                    setActiveTab('communication');
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Message
                </button>
              </div>
            </div>

            {/* TENANT MAINTENANCE & QUICK BILL PAY */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Flat Maintenance Bills</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bills for Tower {resident.tower} - Flat {resident.flat}</p>
                </div>
                <button 
                  onClick={() => setActiveTab('maintenance')} 
                  className="text-purple-700 text-xs font-black uppercase tracking-widest hover:underline flex items-center gap-1"
                >
                  View All Bills <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {tenantMaintenance.length === 0 ? (
                <div className="bg-slate-50 p-6 rounded-2xl text-center border border-dashed border-slate-200">
                  <p className="text-xs font-bold text-slate-500">No maintenance bills recorded for this unit.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {tenantMaintenance.slice(0, 3).map((bill, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-all">
                      <div>
                        <p className="text-xs font-black text-slate-800">{bill.month} Maintenance</p>
                        <p className="text-[10px] text-slate-400 font-bold">Due: {bill.due_date}</p>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <span className="text-sm font-mono font-black text-slate-900">₹{bill.amount}</span>
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          bill.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {bill.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* REPAIRS & COMPLAINTS SUMMARY */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Tenant Flat Maintenance & Repair Tickets</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Raise issue to society manager & owner</p>
                </div>
                <button
                  onClick={() => setShowComplaintModal(true)}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Repair Request
                </button>
              </div>

              {complaints.filter(c => c.resident_id === resident.resident_id).length === 0 ? (
                <div className="bg-purple-50/50 p-6 rounded-2xl text-center border border-purple-100">
                  <p className="text-xs font-bold text-purple-900">No active maintenance or repair requests.</p>
                  <button 
                    onClick={() => setShowComplaintModal(true)}
                    className="mt-2 text-[10px] font-black text-purple-700 uppercase tracking-widest underline"
                  >
                    Submit a repair request
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {complaints.filter(c => c.resident_id === resident.resident_id).slice(0, 3).map((cmp, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-slate-800">{cmp.category}</p>
                        <p className="text-[10px] text-slate-500 max-w-sm truncate">{cmp.description}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        cmp.status === 'Done' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {cmp.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: GUEST GATE PASSES & TENANT RULES */}
          <div className="space-y-6">
            {/* GUEST GATE PASSES */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-purple-50 text-purple-700 rounded-xl flex items-center justify-center font-black">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Guest Gate Passes</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Entry approval for your guests</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGuestPassModal(true)}
                  className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-xs"
                  title="Issue New Gate Pass"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5">
                {issuedGuestPasses.map((pass) => (
                  <div key={pass.id} className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-purple-950">{pass.name}</p>
                      <p className="text-[9px] text-purple-700 font-mono font-bold">Code: {pass.code}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-purple-200 text-purple-900 font-mono font-black text-[9px] rounded-md border border-purple-300">
                      Approved
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* TENANT SOCIETY GUIDELINES */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md space-y-3">
              <div className="flex items-center gap-2 text-purple-400">
                <Sparkles className="w-4 h-4" />
                <h3 className="text-xs font-black uppercase tracking-widest">Society Rules for Tenants</h3>
              </div>
              <ul className="text-xs space-y-2 font-medium text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold">•</span>
                  <span>Move-in & move-out requires prior Admin NOC pass.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold">•</span>
                  <span>Visitor gate entry must be approved via app or phone call.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold">•</span>
                  <span>Quiet hours are strictly observed between 10:00 PM – 7:00 AM.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold">•</span>
                  <span>Park vehicles only in designated tenant parking slots.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* CREATE REPAIR COMPLAINT MODAL */}
      {showComplaintModal && (
        <div className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">New Flat Repair / Maintenance Request</h3>
              <button onClick={() => setShowComplaintModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateComplaint} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Issue Category</label>
                <select
                  value={newComplaintCategory}
                  onChange={(e) => setNewComplaintCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Plumbing / Water">Plumbing / Water Leakage</option>
                  <option value="Electrical Repair">Electrical Repair</option>
                  <option value="Flat Seepage / Wall Work">Flat Seepage / Wall Work</option>
                  <option value="Lift / Common Area">Lift / Common Area</option>
                  <option value="Parking / Security">Parking / Security</option>
                  <option value="General Maintenance">General Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Issue Description</label>
                <textarea
                  value={newComplaintDesc}
                  onChange={(e) => setNewComplaintDesc(e.target.value)}
                  rows={4}
                  placeholder="Describe the issue in detail..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowComplaintModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingComplaint}
                  className="px-5 py-2 bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-800 transition-all shadow-md"
                >
                  {submittingComplaint ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ISSUE GUEST PASS MODAL */}
      {showGuestPassModal && (
        <div className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Issue Guest Entry Gate Pass</h3>
              <button onClick={() => setShowGuestPassModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueGuestPass} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Visitor Name</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Visitor Mobile</label>
                <input
                  type="text"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="e.g. 9820011223"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vehicle Number (Optional)</label>
                <input
                  type="text"
                  value={guestVehicle}
                  onChange={(e) => setGuestVehicle(e.target.value)}
                  placeholder="e.g. MH-12-AB-1234"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGuestPassModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-800 transition-all shadow-md"
                >
                  Generate Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
