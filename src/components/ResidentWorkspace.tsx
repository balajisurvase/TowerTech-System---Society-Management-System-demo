import React, { useState, type FormEvent } from 'react';
import { 
  ArrowLeft, 
  User, 
  Building2, 
  ShieldCheck, 
  Home, 
  Phone, 
  Mail, 
  Key, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  Calendar, 
  DollarSign, 
  FileText, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  Layers, 
  MapPin, 
  FileCheck,
  Clock,
  Sparkles
} from 'lucide-react';
import { Resident, MaintenanceRecord, Complaint } from '../types';
import ResidentDocumentsSection from './ResidentDocumentsSection';

interface AddEditResidentWorkspaceProps {
  mode: 'add' | 'edit';
  residentEditData: {
    resident_id: string;
    name: string;
    tower: string;
    floor: number;
    flat: string;
    phone: string;
    email: string;
    password: string;
    role: 'Owner' | 'Tenant';
    occupancy_type: 'Owner' | 'Tenant';
    tenant_id: string | null;
    owner_id: string | null;
    status: 'Active' | 'Inactive';
    bhk: string;
    flat_type: string;
    square_feet: number;
  };
  setResidentEditData: React.Dispatch<React.SetStateAction<any>>;
  editingResident: Resident | null;
  residents: Resident[];
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  updating: string | null;
}

export function AddEditResidentWorkspace({
  mode,
  residentEditData,
  setResidentEditData,
  editingResident,
  residents,
  onSubmit,
  onCancel,
  updating
}: AddEditResidentWorkspaceProps) {
  const [showPassword, setShowPassword] = useState(false);

  const flatTypeRatesPreset: Record<string, { bhk: string; sqft: number }> = {
    'Smart 1 BHK': { bhk: '1 BHK', sqft: 520 },
    'Smart 2 BHK': { bhk: '2 BHK', sqft: 620 },
    'Premium 2 BHK': { bhk: '2 BHK', sqft: 720 },
    'Premium 3 BHK': { bhk: '3 BHK', sqft: 920 },
  };

  const isOwner = (residentEditData.role || residentEditData.occupancy_type || 'Owner') === 'Owner';
  const ownersList = residents.filter(r => (r.role || r.occupancy_type || 'Owner') === 'Owner');

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Top Header & Navigation Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs group"
            title="Back to Residents"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-[#321F5C] tracking-tight">
                {mode === 'edit' ? 'Edit Resident Profile' : 'Add New Resident'}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${
                isOwner ? 'bg-[#6339CA]/10 text-[#6339CA] border-blue-200' : 'bg-purple-50 text-purple-800 border-purple-200'
              }`}>
                {isOwner ? 'Ownership' : 'Tenancy'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              {mode === 'edit' 
                ? `Updating credentials, apartment allocation, and tenancy status for ${editingResident?.name} (${editingResident?.resident_id})` 
                : 'Register a new member to the society directory with property allocation and verification credentials.'
              }
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5 self-end md:self-center">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={Boolean(updating)}
            className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
              isOwner 
                ? 'bg-[#6339CA] hover:bg-[#5D31C7] shadow-[#6339CA]/25' 
                : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/25'
            }`}
          >
            {updating ? (
              <span>Saving...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{mode === 'edit' ? 'Save Changes' : 'Add Resident'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Form Content */}
      <form onSubmit={onSubmit} className="space-y-6">
        {/* SECTION 1: Personal Information */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#6339CA]/10 text-[#6339CA] flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#321F5C] uppercase tracking-wider">
                  Section 1: Personal Information
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Resident contact information and login credentials</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Step 1 of 4</span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Full Name */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={residentEditData.name}
                  onChange={(e) => setResidentEditData({ ...residentEditData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#6339CA] focus:ring-2 focus:ring-[#6339CA]/10 outline-none text-xs font-semibold text-slate-800 bg-white"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  value={residentEditData.phone}
                  onChange={(e) => setResidentEditData({ ...residentEditData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#6339CA] focus:ring-2 focus:ring-[#6339CA]/10 outline-none text-xs font-semibold text-slate-800 bg-white"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  placeholder="e.g. ramesh@example.com"
                  value={residentEditData.email}
                  onChange={(e) => setResidentEditData({ ...residentEditData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#6339CA] focus:ring-2 focus:ring-[#6339CA]/10 outline-none text-xs font-semibold text-slate-800 bg-white"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                Account Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Portal login password"
                  value={residentEditData.password}
                  onChange={(e) => setResidentEditData({ ...residentEditData, password: e.target.value })}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-[#6339CA] focus:ring-2 focus:ring-[#6339CA]/10 outline-none text-xs font-semibold text-slate-800 bg-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Used by resident to log into resident portal</p>
            </div>

            {/* Resident ID */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                Resident System ID
              </label>
              <input
                type="text"
                disabled={mode === 'edit'}
                placeholder={mode === 'edit' ? residentEditData.resident_id : 'Auto-generated on creation (e.g. R091)'}
                value={residentEditData.resident_id}
                onChange={(e) => setResidentEditData({ ...residentEditData, resident_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 font-mono text-xs font-bold outline-none"
              />
              <p className="text-[11px] text-slate-400 font-medium">Unique identifier within society system</p>
            </div>
          </div>
        </div>

        {/* SECTION 2: Property Information */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-[#6339CA] flex items-center justify-center font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#321F5C] uppercase tracking-wider">
                  Section 2: Property Information
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Building tower, flat configuration and apartment details</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Step 2 of 4</span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Tower */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                Tower / Wing <span className="text-rose-500">*</span>
              </label>
              <select
                value={residentEditData.tower}
                onChange={(e) => setResidentEditData({ ...residentEditData, tower: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#6339CA] focus:ring-2 focus:ring-[#6339CA]/10 outline-none text-xs font-bold text-slate-800 bg-white"
              >
                {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(t => (
                  <option key={t} value={t}>Tower {t}</option>
                ))}
              </select>
            </div>

            {/* Floor */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                Floor Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="30"
                required
                value={residentEditData.floor}
                onChange={(e) => setResidentEditData({ ...residentEditData, floor: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#6339CA] focus:ring-2 focus:ring-[#6339CA]/10 outline-none text-xs font-semibold text-slate-800 bg-white"
              />
            </div>

            {/* Flat Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                Flat Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 101, 204"
                value={residentEditData.flat}
                onChange={(e) => setResidentEditData({ ...residentEditData, flat: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#6339CA] focus:ring-2 focus:ring-[#6339CA]/10 outline-none text-xs font-bold text-slate-800 bg-white"
              />
            </div>

            {/* BHK Configuration */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                BHK Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={residentEditData.bhk}
                onChange={(e) => {
                  const newBhk = e.target.value;
                  const autoFlatType = newBhk === '1 BHK' ? 'Smart 1 BHK' : newBhk === '3 BHK' ? 'Premium 3 BHK' : 'Smart 2 BHK';
                  setResidentEditData({
                    ...residentEditData,
                    bhk: newBhk,
                    flat_type: autoFlatType,
                    square_feet: flatTypeRatesPreset[autoFlatType]?.sqft || 620
                  });
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#6339CA] focus:ring-2 focus:ring-[#6339CA]/10 outline-none text-xs font-bold text-slate-800 bg-white"
              >
                <option value="1 BHK">1 BHK Apartment</option>
                <option value="2 BHK">2 BHK Apartment</option>
                <option value="3 BHK">3 BHK Apartment</option>
                <option value="4 BHK">4 BHK Penthouse</option>
              </select>
            </div>

            {/* Flat Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                Flat Variant / Model
              </label>
              <select
                value={residentEditData.flat_type}
                onChange={(e) => {
                  const ft = e.target.value;
                  setResidentEditData({
                    ...residentEditData,
                    flat_type: ft,
                    square_feet: flatTypeRatesPreset[ft]?.sqft || residentEditData.square_feet
                  });
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#6339CA] focus:ring-2 focus:ring-[#6339CA]/10 outline-none text-xs font-bold text-slate-800 bg-white"
              >
                <option value="Smart 1 BHK">Smart 1 BHK (520 sq.ft.)</option>
                <option value="Smart 2 BHK">Smart 2 BHK (620 sq.ft.)</option>
                <option value="Premium 2 BHK">Premium 2 BHK (720 sq.ft.)</option>
                <option value="Premium 3 BHK">Premium 3 BHK (920 sq.ft.)</option>
              </select>
            </div>

            {/* Square Feet */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                Carpet Area (Square Feet)
              </label>
              <input
                type="number"
                min="200"
                max="5000"
                value={residentEditData.square_feet}
                onChange={(e) => setResidentEditData({ ...residentEditData, square_feet: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#6339CA] focus:ring-2 focus:ring-[#6339CA]/10 outline-none text-xs font-bold text-slate-800 bg-white"
              />
              <p className="text-[11px] text-slate-400 font-medium">Used for square-foot maintenance calculation rate</p>
            </div>
          </div>
        </div>

        {/* SECTION 3: Resident Information (Type & Status) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#321F5C] uppercase tracking-wider">
                  Section 3: Resident Classification & Status
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Specify tenancy role and account activity state</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Step 3 of 4</span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resident Type: Owner vs Tenant */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-700">Resident Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setResidentEditData({ ...residentEditData, role: 'Owner', occupancy_type: 'Owner' })}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                    isOwner 
                      ? 'bg-[#6339CA]/10/80 border-[#6339CA] text-blue-900 shadow-sm ring-2 ring-[#6339CA]/20' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-[#6339CA]">Property Owner</span>
                    {isOwner && <CheckCircle2 className="w-4 h-4 text-[#6339CA]" />}
                  </div>
                  <p className="text-[11px] font-medium text-slate-500">
                    Holds full title deed, voting rights, and society ownership records.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setResidentEditData({ ...residentEditData, role: 'Tenant', occupancy_type: 'Tenant' })}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                    !isOwner 
                      ? 'bg-purple-50/80 border-purple-500 text-purple-900 shadow-sm ring-2 ring-purple-500/20' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-purple-700">Lease Tenant</span>
                    {!isOwner && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                  </div>
                  <p className="text-[11px] font-medium text-slate-500">
                    Occupies unit under lease agreement with an authorized landlord.
                  </p>
                </button>
              </div>
            </div>

            {/* Account Status: Active vs Inactive */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-700">Account Status</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setResidentEditData({ ...residentEditData, status: 'Active' })}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                    residentEditData.status === 'Active' 
                      ? 'bg-emerald-50/80 border-emerald-500 text-emerald-900 shadow-sm ring-2 ring-emerald-500/20' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-emerald-700">Active Member</span>
                    {residentEditData.status === 'Active' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <p className="text-[11px] font-medium text-slate-500">
                    Full access to gate passes, notices, billing, and amenity booking.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setResidentEditData({ ...residentEditData, status: 'Inactive' })}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                    residentEditData.status === 'Inactive' 
                      ? 'bg-rose-50/80 border-rose-500 text-rose-900 shadow-sm ring-2 ring-rose-500/20' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-rose-700">Inactive / Vacated</span>
                    {residentEditData.status === 'Inactive' && <CheckCircle2 className="w-4 h-4 text-rose-600" />}
                  </div>
                  <p className="text-[11px] font-medium text-slate-500">
                    Suspended portal login; archived historical ledger records.
                  </p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: Additional Information (Type-Specific Details) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#321F5C] uppercase tracking-wider">
                  Section 4: Additional & Tenancy Information
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Linkage to landlord and secondary residency data</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Step 4 of 4</span>
          </div>

          <div className="p-6">
            {!isOwner ? (
              /* Tenant-Specific Fields */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    Select Property Owner (Landlord) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={residentEditData.owner_id || ''}
                    onChange={(e) => setResidentEditData({ ...residentEditData, owner_id: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-xs font-bold text-slate-800 bg-purple-50/30"
                  >
                    <option value="">-- Choose Registered Owner --</option>
                    {ownersList.map(owner => (
                      <option key={owner.resident_id} value={owner.resident_id}>
                        {owner.name} ({owner.resident_id}) • Tower {owner.tower} - Flat {owner.flat}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Associates tenant with the legal owner for approvals and NOCs
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Tenant ID / Agreement Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. T001 or LEASE-2026-04"
                    value={residentEditData.tenant_id || ''}
                    onChange={(e) => setResidentEditData({ ...residentEditData, tenant_id: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-xs font-semibold text-slate-800 bg-white"
                  />
                  <p className="text-[11px] text-slate-400 font-medium">
                    Internal tenant identifier or registered lease reference
                  </p>
                </div>
              </div>
            ) : (
              /* Owner-Specific Fields */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-4 rounded-xl bg-[#6339CA]/10/60 border border-blue-200">
                  <h4 className="text-xs font-bold text-blue-900 mb-1">Ownership Validation</h4>
                  <p className="text-xs text-[#6339CA]/80 leading-relaxed">
                    Once added, the owner can upload Sale Deed, Index II, and property tax records in the Resident Documents workspace for Secretary review.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold text-[#321F5C] mb-1">Billing Auto-Sync</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    This unit will automatically be included in monthly society maintenance bill generations for Tower {residentEditData.tower}, Flat {residentEditData.flat}.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Submission Toolbar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to Residents</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={Boolean(updating)}
              className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                isOwner 
                  ? 'bg-[#6339CA] hover:bg-[#5D31C7] shadow-[#6339CA]/25' 
                  : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/25'
              }`}
            >
              {updating ? (
                <span>Saving Resident...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{mode === 'edit' ? 'Save Changes' : 'Add Resident'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

interface ResidentProfileWorkspaceProps {
  resident: Resident;
  residents: Resident[];
  maintenance: MaintenanceRecord[];
  complaints: Complaint[];
  onBack: () => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  onViewBill: (bill: MaintenanceRecord) => void;
}

export function ResidentProfileWorkspace({
  resident,
  residents,
  maintenance,
  complaints,
  onBack,
  onEdit,
  onDelete,
  onRefresh,
  onViewBill
}: ResidentProfileWorkspaceProps) {
  const isOwner = (resident.role || resident.occupancy_type || 'Owner') === 'Owner';
  const residentBills = maintenance.filter(m => m.resident_id === resident.resident_id);
  const residentComplaints = complaints.filter(c => c.resident_id === resident.resident_id);
  
  const totalBilled = residentBills.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
  const paidBills = residentBills.filter(b => b.status === 'Paid');
  const unpaidBills = residentBills.filter(b => b.status !== 'Paid');
  const pendingAmount = unpaidBills.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);

  const linkedOwner = !isOwner && resident.owner_id ? residents.find(r => r.resident_id === resident.owner_id) : null;

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Top Header & Navigation Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs group"
            title="Back to Residents"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-[#321F5C] tracking-tight">
                Resident Profile — {resident.name}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${
                isOwner ? 'bg-[#6339CA]/10 text-[#6339CA] border-blue-200' : 'bg-purple-50 text-purple-800 border-purple-200'
              }`}>
                {isOwner ? 'Owner' : 'Tenant'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                resident.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {resident.status || 'Active'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Resident ID: <span className="font-mono font-bold text-slate-700">{resident.resident_id}</span> • Unit: Tower {resident.tower}, Flat {resident.flat} • {resident.flat_type || '2 BHK'}
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5 self-end md:self-center">
          <button
            type="button"
            onClick={onEdit}
            className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold rounded-xl border border-purple-200 transition-colors flex items-center gap-2 shadow-2xs cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-purple-700" />
            <span>Edit Resident</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(resident.resident_id)}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Grid: Overview & Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Resident Overview Hero */}
        <div className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between ${
          isOwner ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white border-purple-600' : 'bg-gradient-to-br from-purple-600 to-purple-700 text-white border-purple-600'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/80">Membership Card</span>
              <span className="font-mono text-xs font-bold bg-white/20 px-2 py-0.5 rounded text-white">{resident.resident_id}</span>
            </div>
            <div className="mt-4 flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 text-white flex items-center justify-center font-black text-xl shadow-inner">
                {resident.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-black leading-tight text-white">{resident.name}</h2>
                <p className="text-xs text-white/80 font-medium mt-0.5">
                  Tower {resident.tower} • Flat {resident.flat}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/20 grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-[10px] text-white/70 font-semibold uppercase">Classification</p>
              <p className="font-bold text-white mt-0.5">{isOwner ? 'Property Owner' : 'Lease Tenant'}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/70 font-semibold uppercase">Society Reg</p>
              <p className="font-bold text-white mt-0.5">{resident.society_id || 'GV2026'}</p>
            </div>
          </div>
        </div>

        {/* Property Information Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-[#6339CA]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Property Information</h3>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Apartment Unit</span>
                <span className="font-bold text-slate-800">Tower {resident.tower} - Flat {resident.flat}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Floor Level</span>
                <span className="font-bold text-slate-800">Floor {resident.floor || '1'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">BHK Configuration</span>
                <span className="font-bold text-slate-800">{resident.bhk || '2 BHK'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Carpet Area</span>
                <span className="font-bold text-slate-800">{resident.square_feet || 620} sq.ft.</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Flat Variant</span>
                <span className="font-bold text-[#6339CA] bg-[#6339CA]/10 px-2 py-0.5 rounded text-[11px]">{resident.flat_type || 'Smart 2 BHK'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Credentials Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Phone className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Contact & Access</h3>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Primary Mobile</span>
                <span className="font-bold text-slate-800 font-mono">{resident.phone || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Email Address</span>
                <span className="font-bold text-slate-800 truncate max-w-[170px]" title={resident.email}>{resident.email || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Portal Password</span>
                <span className="font-bold text-slate-800 font-mono bg-slate-100 px-2 py-0.5 rounded text-[11px]">{resident.password || 'resident123'}</span>
              </div>
              {!isOwner && linkedOwner && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Landlord Owner</span>
                  <span className="font-bold text-purple-700 truncate max-w-[170px]">{linkedOwner.name} ({linkedOwner.resident_id})</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Account Access</span>
                <span className={`font-bold ${resident.status === 'Active' ? 'text-emerald-600' : 'text-rose-600'}`}>{resident.status || 'Active'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width Section 5: Documents */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-black text-[#321F5C] tracking-tight">Resident Documents & Verification</h3>
            <p className="text-xs text-slate-500 font-medium">Upload, review, replace, and verify ownership or tenancy records</p>
          </div>
        </div>
        <ResidentDocumentsSection
          resident={resident}
          isOwner={isOwner}
          isAdminReview={true}
          onRefresh={onRefresh}
        />
      </div>

      {/* Full-Width Section 6: Maintenance & Invoices */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-[#321F5C] tracking-tight">Maintenance Bills & Payment History</h3>
            <p className="text-xs text-slate-500 font-medium">
              Total Billed: ₹{totalBilled.toLocaleString()} • Outstanding Dues: ₹{pendingAmount.toLocaleString()} ({unpaidBills.length} unpaid)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
              {paidBills.length} Paid
            </span>
            <span className="px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold">
              {unpaidBills.length} Unpaid
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Bill ID</th>
                <th className="px-6 py-3.5">Billing Month</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Due Date</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {residentBills.length > 0 ? (
                residentBills.map((bill, idx) => (
                  <tr key={bill.maintenance_id || bill.id || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-bold text-[#6339CA]">{bill.bill_no || bill.maintenance_id}</td>
                    <td className="px-6 py-3.5 font-bold text-slate-800">{bill.month}</td>
                    <td className="px-6 py-3.5 font-black text-[#321F5C]">₹{Number(bill.amount).toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-slate-600">{bill.due_date || '—'}</td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        bill.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => onViewBill(bill)}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-[#6339CA]/10 text-[#6339CA] hover:bg-[#6339CA]/10 border border-blue-200 transition-colors inline-flex items-center gap-1 shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Invoice</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No maintenance bills generated yet for this resident.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full-Width Section 7: Complaints */}
      {residentComplaints.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200">
            <h3 className="text-base font-black text-[#321F5C] tracking-tight">Complaints & Requests</h3>
            <p className="text-xs text-slate-500 font-medium">History of issues reported by this unit</p>
          </div>
          <div className="divide-y divide-slate-100">
            {residentComplaints.map(c => (
              <div key={c.complaint_id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-700">{c.complaint_id}</span>
                    <span className="font-bold text-[#321F5C] text-sm">{c.category}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      c.status === 'Done' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>{c.status}</span>
                  </div>
                  <p className="text-slate-600 mt-1">{c.description}</p>
                </div>
                <span className="text-slate-400 shrink-0 font-medium">
                  {new Date(c.complaint_date || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
