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
import ResidentDocumentsSection from './ResidentDocumentsSection';
import { AddComplaintWorkspace, ViewComplaintWorkspace } from './workspaces/ComplaintWorkspaces';

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
  if (activeTab === 'documents') {
    return (
      <div className="space-y-6 max-w-5xl mx-auto w-full">
        <ResidentDocumentsSection 
          resident={resident} 
          isOwner={false} 
          onRefresh={onRefresh} 
        />
      </div>
    );
  }

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

  const flatType = resident.flat_type || (resident.bhk ? (resident.bhk === '1 BHK' ? 'Smart 1 BHK' : resident.bhk === '3 BHK' ? 'Premium 3 BHK' : 'Smart 2 BHK') : 'Smart 2 BHK');
  const sqft = resident.square_feet || (flatType.includes('1 BHK') ? 540 : flatType.includes('3 BHK') ? 920 : 720);
  const bhk = resident.bhk || (flatType.includes('1 BHK') ? '1 BHK' : flatType.includes('3 BHK') ? '3 BHK' : '2 BHK');
  const wing = resident.wing || resident.tower || 'Wing A';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* TENANT OCCUPANCY BANNER (Requirement 2: Clearly Differentiate Owner & Tenant in Flat Occupancy) */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative group shrink-0">
            {photoPreview ? (
              <img 
                src={photoPreview} 
                alt={resident.name} 
                className="w-16 h-16 rounded-xl object-cover border-2 border-purple-500 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-purple-700 border-2 border-purple-500 flex items-center justify-center font-bold text-xl text-white shadow-md">
                {resident.name.charAt(0)}
              </div>
            )}
            <button 
              onClick={() => setActiveTab('profile')}
              className="absolute -bottom-1 -right-1 bg-purple-600 hover:bg-purple-500 text-white p-1 rounded-lg text-[10px] font-bold shadow-md transition-all"
              title="Change Photo"
            >
              <Camera className="w-3 h-3" />
            </button>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-900/60 text-purple-200 border border-purple-600/60 flex items-center gap-1.5">
                <Key className="w-3 h-3 text-purple-300" />
                TENANT OCCUPIED
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-950/60 text-emerald-300 border border-emerald-700/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {resident.status || 'Active Tenant'}
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-bold tracking-tight mt-1.5 text-white">
              {resident.name}
            </h2>

            <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 font-medium">
              <span>Flat {resident.flat} • {wing}</span>
              <span>•</span>
              <span className="text-purple-300 font-semibold">{flatType} ({bhk} • {sqft} sq.ft.)</span>
              <span>•</span>
              <span>Owner: <strong className="text-slate-200 font-semibold">{linkedOwner.name}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveTab('documents')}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold tracking-wide transition-all border border-purple-400/30 flex items-center gap-2 shadow-xs"
          >
            <FileText className="w-4 h-4" />
            Tenant Documents
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold tracking-wide transition-all border border-slate-700 flex items-center gap-2"
          >
            <UserIcon className="w-4 h-4" />
            Edit Profile
          </button>
          <button
            onClick={() => setShowGuestPassModal(true)}
            className="px-3.5 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-semibold tracking-wide transition-all flex items-center gap-2 shadow-xs"
          >
            <UserPlus className="w-4 h-4 text-purple-700" />
            Issue Gate Pass
          </button>
        </div>
      </div>

      {activeTab === 'profile' ? (
        /* TENANT PROFILE SETTINGS & DETAILS MODULE */
        <div className="space-y-6">
          {/* Detailed Tenant Profile Box (Requirement 1) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Tenant Profile Details</h3>
                  <p className="text-xs text-slate-500">Official tenant records & flat tenancy information</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-purple-50 text-purple-700 font-bold text-xs rounded-lg border border-purple-200">
                  TENANT OCCUPIED
                </span>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200">
                  {resident.status || 'Active Tenant'}
                </span>
              </div>
            </div>

            {/* 13 Tenant Profile Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tenant Name</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{resident.name}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Flat Number</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">Flat {resident.flat}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Building / Wing</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{wing} (Tower {resident.tower})</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mobile Number</p>
                <p className="text-sm font-bold font-mono text-slate-900 mt-0.5">{resident.phone || '—'}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email</p>
                <p className="text-sm font-medium text-slate-900 mt-0.5 truncate">{resident.email || '—'}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 sm:col-span-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Permanent Address</p>
                <p className="text-sm font-medium text-slate-900 mt-0.5">{resident.permanent_address || 'Permanent address on record with society office'}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Move-in Date</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{resident.move_in_date || '01 Jan 2024'}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Expected Move-out Date</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{resident.expected_move_out_date || '31 Dec 2026'}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Owner Name</p>
                <p className="text-sm font-bold text-indigo-700 mt-0.5">{linkedOwner.name || 'Deepak Yadav'}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tenant Status</p>
                <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-xs mt-0.5">
                  {resident.status || 'Active Tenant'}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">BHK</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{bhk}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Flat Type</p>
                <p className="text-sm font-bold text-purple-700 mt-0.5">{flatType}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Square Feet</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{sqft} sq.ft.</p>
              </div>
            </div>
          </div>

          {/* Edit Tenant Profile Settings Form */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Update Profile Settings</h3>
                <p className="text-xs text-slate-500">
                  Update contact information, photo & login credentials
                </p>
              </div>
              <span className="px-2.5 py-1 bg-purple-50 text-purple-700 font-bold text-xs rounded-lg border border-purple-200">
                Tenant ID: {resident.tenant_id || 'T001'}
              </span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* UPLOAD PROFILE IMAGE SECTION */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <label className="block text-xs font-bold text-slate-800">
                  Profile Photo
                </label>
                
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="shrink-0 text-center">
                    {photoPreview ? (
                      <img 
                        src={photoPreview} 
                        alt="Avatar preview" 
                        className="w-20 h-20 rounded-xl object-cover border-2 border-purple-500 shadow-xs mx-auto"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-purple-600 text-white font-bold text-2xl flex items-center justify-center border-2 border-purple-500 shadow-xs mx-auto">
                        {profileData.name.charAt(0) || 'T'}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-3 w-full">
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Upload New Photo</p>
                      <p className="text-[11px] text-slate-500">PNG or JPG, up to 5MB</p>
                    </div>
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-xs">
                      <Upload className="w-4 h-4" />
                      Choose Photo File
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* PERSONAL DETAILS FIELDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tenant Full Name
                  </label>
                  <input 
                    type="text" 
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-medium text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input 
                    type="text" 
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-medium text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input 
                    type="email" 
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-medium text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Login Password
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      value={profileData.password}
                      onChange={(e) => setProfileData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-300 font-mono font-medium text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
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

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-2"
                >
                  {updatingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Embedded Tenant Documents Module */}
          <ResidentDocumentsSection 
            resident={resident} 
            isOwner={false} 
            onRefresh={onRefresh} 
          />
        </div>
      ) : (
        /* TENANT DASHBOARD OVERVIEW */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT 2 COLUMNS: LANDLORD INFO, BILLS, REPAIRS */}
            <div className="lg:col-span-2 space-y-6">
              {/* PROPERTY OWNER / LANDLORD CARD (Requirement 1: Complete 11 Owner fields) */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 font-bold">
                      <Home className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Owner & Property Details</h3>
                      <p className="text-[11px] text-slate-500">Property owner records for Flat {resident.flat}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-800 font-bold text-xs rounded-md border border-amber-200">
                    OWNER OCCUPIED (BY PROXY)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Owner Name</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{linkedOwner.name || 'Deepak Yadav'}</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Flat Number</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">Flat {resident.flat}</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Building / Wing</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{wing}</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mobile Number</p>
                    <p className="text-sm font-bold font-mono text-slate-900 mt-0.5">{linkedOwner.phone || '9000000021'}</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email</p>
                    <p className="text-sm font-medium text-slate-900 mt-0.5 truncate">{linkedOwner.email || 'owner@gvsociety.com'}</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date of Possession</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{(linkedOwner as any).possession_date || '15 Mar 2021'}</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Resident Status</p>
                    <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-bold text-xs mt-0.5">
                      {(linkedOwner as any).status || 'Active Owner'}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Family Members</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{(linkedOwner as any).family_members?.length || 4} Members</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">BHK</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{bhk}</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Flat Type</p>
                    <p className="text-sm font-bold text-purple-700 mt-0.5">{flatType}</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Square Feet</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{sqft} sq.ft.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <a
                    href={`tel:${linkedOwner.phone}`}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call Owner
                  </a>
                  <button
                    onClick={() => {
                      setActiveTab('communication');
                    }}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Message Owner
                  </button>
                </div>
              </div>

              {/* TENANT MAINTENANCE & QUICK BILL PAY */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Flat Maintenance Bills</h3>
                    <p className="text-[11px] text-slate-500">Bills for {wing} - Flat {resident.flat}</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('maintenance')} 
                    className="text-purple-700 text-xs font-bold hover:underline flex items-center gap-1"
                  >
                    View All Bills <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {tenantMaintenance.length === 0 ? (
                  <div className="bg-slate-50 p-5 rounded-xl text-center border border-dashed border-slate-200">
                    <p className="text-xs text-slate-500">No maintenance bills recorded for this unit.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tenantMaintenance.slice(0, 3).map((bill, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50/80 hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{bill.month} Maintenance</p>
                          <p className="text-[11px] text-slate-500 font-medium">Due: {bill.due_date}</p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <span className="text-sm font-mono font-bold text-slate-900">₹{bill.amount}</span>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            bill.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
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
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Maintenance & Repair Tickets</h3>
                    <p className="text-[11px] text-slate-500">Raise maintenance requests to society office & owner</p>
                  </div>
                  <button
                    onClick={() => setShowComplaintModal(true)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Request
                  </button>
                </div>

                {complaints.filter(c => c.resident_id === resident.resident_id).length === 0 ? (
                  <div className="bg-purple-50/50 p-5 rounded-xl text-center border border-purple-100">
                    <p className="text-xs font-medium text-purple-900">No active maintenance or repair requests.</p>
                    <button 
                      onClick={() => setShowComplaintModal(true)}
                      className="mt-2 text-xs font-bold text-purple-700 hover:underline"
                    >
                      Submit a repair request
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {complaints.filter(c => c.resident_id === resident.resident_id).slice(0, 3).map((cmp, idx) => (
                      <div key={idx} className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{cmp.category}</p>
                          <p className="text-[11px] text-slate-500 max-w-sm truncate">{cmp.description}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          cmp.status === 'Done' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
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
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-purple-50 text-purple-700 rounded-lg flex items-center justify-center font-bold">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Guest Passes</h3>
                      <p className="text-[11px] text-slate-500">Visitor gate approvals</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowGuestPassModal(true)}
                    className="p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-xs"
                    title="Issue New Gate Pass"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  {issuedGuestPasses.map((pass) => (
                    <div key={pass.id} className="p-2.5 bg-purple-50/60 rounded-xl border border-purple-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-purple-950">{pass.name}</p>
                        <p className="text-[11px] text-purple-700 font-mono font-medium">Code: {pass.code}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-purple-200 text-purple-900 font-mono font-bold text-[10px] rounded border border-purple-300">
                        Approved
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TENANT SOCIETY GUIDELINES */}
              <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm space-y-3 border border-slate-800">
                <div className="flex items-center gap-2 text-purple-400">
                  <Sparkles className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Society Rules for Tenants</h3>
                </div>
                <ul className="text-xs space-y-2 text-slate-300">
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

          {/* TENANT DOCUMENTS SECTION (Requirement 4 & 5) */}
          <ResidentDocumentsSection 
            resident={resident} 
            isOwner={false} 
            onRefresh={onRefresh} 
          />
        </div>
      )}

      {/* CREATE REPAIR COMPLAINT WORKSPACE (FULL SCREEN) */}
      {showComplaintModal && (
        <AddComplaintWorkspace
          user={resident as any}
          onBack={() => setShowComplaintModal(false)}
          onSubmit={async (cData) => {
            try {
              setSubmittingComplaint(true);
              await societyService.addComplaint({
                resident_id: resident.resident_id,
                resident_name: resident.name,
                tower: resident.tower,
                flat_no: resident.flat,
                category: cData.category,
                description: cData.description,
                status: 'Pending',
                complaint_date: new Date().toISOString().split('T')[0],
                society_id: resident.society_id
              });
              toast.success('Complaint / Request submitted successfully!');
              setShowComplaintModal(false);
              onRefresh();
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Error';
              toast.error('Failed to submit complaint: ' + msg);
            } finally {
              setSubmittingComplaint(false);
            }
          }}
        />
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
