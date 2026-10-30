import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Shield, 
  Building2, 
  Home, 
  Lock, 
  Save, 
  X, 
  CheckCircle2, 
  Key, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Clock,
  Sparkles,
  Camera
} from 'lucide-react';
import { User, Resident, Role } from '../types';
import { societyService } from '../lib/societyService';
import { toast } from 'sonner';

interface ProfileDashboardProps {
  user: User;
  onUserUpdate?: (updatedUser: Partial<User>) => void;
  onBack?: () => void;
}

export default function ProfileDashboard({ user, onUserUpdate, onBack }: ProfileDashboardProps) {
  const isAdmin = user.role === 'admin' || !!user.admin_id;
  const isSecurity = user.role === 'security';
  const isResident = !isAdmin && !isSecurity;

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [emergencyContact, setEmergencyContact] = useState('9876543219');

  // Password Change Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updates: Partial<User> = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim()
      };

      if (onUserUpdate) {
        onUserUpdate(updates);
      }

      // If resident, update resident record
      if (user.resident_id) {
        await societyService.updateResident(user.resident_id, updates as Partial<Resident>);
      }

      toast.success('Profile details updated successfully!');
      setIsEditing(false);
    } catch (err: any) {
      toast.error('Failed to update profile: ' + (err?.message || 'Error'));
    } finally {
      setSaving(false);
    }
  };

  // Handle Password Update
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      // In our mock/supabase setup, update password
      if (user.resident_id) {
        await societyService.updateResident(user.resident_id, { password: newPassword });
      }
      toast.success('Password changed successfully! Please use your new password next time.');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error('Failed to change password: ' + (err?.message || 'Error'));
    } finally {
      setPasswordLoading(false);
    }
  };

  // Format initials
  const initials = user.name 
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() 
    : 'U';

  return (
    <div className="w-full space-y-6 font-sans text-[#321F5C] animate-in fade-in duration-150">
      
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Cover Strip */}
        <div className="h-28 sm:h-32 bg-gradient-to-r from-[#321F5C] via-[#5D31C7] to-[#321F5C] relative p-4 flex items-end justify-end">
          <span className="px-3 py-1 rounded-full bg-white/10 text-white backdrop-blur-md text-[11px] font-bold border border-white/15">
            Green Park Residency • TowerTech
          </span>
        </div>

        {/* User Identity Bar */}
        <div className="p-6 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14">
          <div className="flex items-end gap-4">
            {/* Avatar Circle with initials */}
            <div className="w-24 h-24 rounded-2xl bg-[#6339CA] text-white font-extrabold text-2xl flex items-center justify-center border-4 border-white shadow-md relative">
              {initials}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[10px] text-white" title="Active Account">
                ✓
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[#321F5C] tracking-tight">
                  {user.name || 'Society Member'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#6339CA]/10 text-[#6339CA] border border-[#6339CA]/20">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {user.flat ? `Tower ${user.tower || 'A'} • Flat ${user.flat}` : 'Management Committee'} • ID: {user.resident_id || user.admin_id || user.id || 'U001'}
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2 pt-2 sm:pt-0">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Edit Contact Details
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setName(user.name || '');
                  setEmail(user.email || '');
                  setPhone(user.phone || '');
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 bg-[#6339CA] hover:bg-[#5D31C7] text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Change Password</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Profile Form + Society Context */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Account Details / Form */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-[#321F5C]">Personal Information</h3>
              <p className="text-xs text-slate-500">View and manage your registered society account details.</p>
            </div>
            {isEditing && (
              <span className="text-xs font-semibold text-[#6339CA] bg-[#6339CA]/10 px-2.5 py-0.5 rounded-lg border border-[#6339CA]/20">
                Editing Enabled
              </span>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-[#321F5C] bg-slate-50/50 disabled:bg-slate-100/60 disabled:text-slate-600 outline-none focus:border-[#6339CA] focus:ring-2 focus:ring-[#6339CA]/10 transition-all"
                    required
                  />
                </div>
              </div>

              {/* User ID (Immutable) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">System User ID</label>
                  <span className="text-[10px] text-slate-400">Read-Only</span>
                </div>
                <div className="relative">
                  <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    disabled
                    value={user.resident_id || user.admin_id || user.id || 'N/A'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100/70 cursor-not-allowed outline-none"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    disabled={!isEditing}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-[#321F5C] bg-slate-50/50 disabled:bg-slate-100/60 disabled:text-slate-600 outline-none focus:border-[#6339CA] focus:ring-2 focus:ring-[#6339CA]/10 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    disabled={!isEditing}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-[#321F5C] bg-slate-50/50 disabled:bg-slate-100/60 disabled:text-slate-600 outline-none focus:border-[#6339CA] focus:ring-2 focus:ring-[#6339CA]/10 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Assigned Role (Immutable) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Assigned Role</label>
                  <span className="text-[10px] text-slate-400">Locked by Admin</span>
                </div>
                <div className="relative">
                  <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    disabled
                    value={user.role ? user.role.toUpperCase() : 'RESIDENT'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100/70 cursor-not-allowed outline-none"
                  />
                </div>
              </div>

              {/* Flat / Tower */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Unit / Flat Allocation</label>
                  <span className="text-[10px] text-slate-400">Verified Unit</span>
                </div>
                <div className="relative">
                  <Home className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    disabled
                    value={user.flat ? `Tower ${user.tower || 'A'} - Flat ${user.flat}` : 'Administrative Headquarters'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100/70 cursor-not-allowed outline-none"
                  />
                </div>
              </div>

            </div>

            {/* Emergency Contact */}
            <div className="pt-2 border-t border-slate-100">
              <div className="space-y-1 max-w-sm">
                <label className="text-xs font-bold text-slate-700">Emergency Security Contact</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    disabled={!isEditing}
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-[#321F5C] bg-slate-50/50 disabled:bg-slate-100/60 disabled:text-slate-600 outline-none focus:border-[#6339CA] focus:ring-2 focus:ring-[#6339CA]/10 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Save Buttons (when editing) */}
            {isEditing && (
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#6339CA] hover:bg-[#5D31C7] text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Society Account Badges & Security Status */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Society Information Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#6339CA]/10 text-[#6339CA] flex items-center justify-center font-bold border border-[#6339CA]/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#321F5C]">Green Park Residency</h4>
                <p className="text-[11px] text-slate-500">Society ID: GV2026</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Account Status</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                  Verified Active
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Member Since</span>
                <span className="font-bold text-slate-800">January 2026</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Tower Wing</span>
                <span className="font-bold text-slate-800">{user.tower ? `Tower ${user.tower}` : 'Main Facility'}</span>
              </div>
            </div>
          </div>

          {/* Security & Access Level Card */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#6339CA]" />
              <span>Access & Security Credentials</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your role defines access permissions across maintenance bills, gate check-ins, and committee notices. Role changes can only be initiated by the Society Secretary.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-[#6339CA]" />
                <span>Update Account Password</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-[#321F5C]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#6339CA]/10 text-[#6339CA] flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#321F5C]">Change Account Password</h3>
                  <p className="text-[11px] text-slate-500">Ensure password has at least 6 characters</p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold outline-none focus:border-[#6339CA] focus:ring-2 focus:ring-[#6339CA]/10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold outline-none focus:border-[#6339CA] focus:ring-2 focus:ring-[#6339CA]/10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold outline-none focus:border-[#6339CA] focus:ring-2 focus:ring-[#6339CA]/10"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2 bg-[#6339CA] hover:bg-[#5D31C7] text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
