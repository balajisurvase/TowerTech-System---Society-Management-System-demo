import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  ChevronDown, 
  User as UserIcon, 
  LogOut, 
  ArrowLeft, 
  Building2, 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  Megaphone, 
  CreditCard, 
  MessageSquare, 
  Menu 
} from 'lucide-react';
import { User } from '../types';

interface TopHeaderProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onSearchClick?: () => void;
  onToggleMobileNav?: () => void;
}

export default function TopHeader({ 
  user, 
  activeTab, 
  setActiveTab, 
  onLogout,
  onSearchClick,
  onToggleMobileNav
}: TopHeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = user.role === 'admin' || !!user.admin_id;
  const isSecurity = user.role === 'security';

  const flatDisplay = user.flat ? (user.tower ? `${user.tower}-${user.flat}` : `Flat ${user.flat}`) : (user.resident_id || user.tenant_id || '');

  // Sample notifications feed
  const sampleNotifications = [
    { id: '1', title: 'Maintenance Bill Generated', time: '10 min ago', icon: CreditCard, color: 'text-orange-600 bg-orange-50' },
    { id: '2', title: 'New Society Notice Published', time: '1 hour ago', icon: Megaphone, color: 'text-amber-600 bg-amber-50' },
    { id: '3', title: 'Complaint #104 Updated to In-Progress', time: '3 hours ago', icon: MessageSquare, color: 'text-purple-600 bg-purple-50' },
  ];

  // Map subnav tabs (ApnaComplex style: ACTIVITY | MY STUFF | COMMUNITY | MANAGEMENT)
  const isActivity = activeTab === 'security' || activeTab === 'audit';
  const isMyStuff = activeTab === 'dashboard' || activeTab === 'profile';
  const isCommunity = activeTab === 'notices' || activeTab === 'communication' || activeTab === 'residents';
  const isManagement = activeTab === 'maintenance' || activeTab === 'financial' || activeTab === 'bookings' || activeTab === 'complaints';

  return (
    <header className="sticky top-0 z-50 bg-[#542d87] text-white shadow-md font-sans">
      {/* Top Bar: Brand, Search, Notifications, Avatar */}
      <div className="w-full px-4 md:px-6 py-2.5 flex items-center justify-between gap-4 border-b border-purple-900/30">
        
        {/* Left Section: Brand Logo + Hamburger */}
        <div className="flex items-center gap-3">
          {onToggleMobileNav && (
            <button 
              onClick={onToggleMobileNav}
              className="md:hidden p-1.5 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-white/15 text-white flex items-center justify-center font-black shadow-inner border border-white/20">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-base font-black text-white tracking-tight lowercase">
                  apnacomplex<span className="text-orange-400">.</span>
                </span>
                <span className="text-[10px] font-bold text-purple-200 uppercase tracking-widest hidden sm:inline">
                  | TowerTech
                </span>
              </div>
              <span className="text-[11px] font-semibold text-purple-200 block leading-tight mt-0.5">
                Green Park Residency {flatDisplay && `· ${flatDisplay}`}
              </span>
            </div>
          </button>
        </div>

        {/* Right Section: Search, Bell, Profile Avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* 🔍 Search Icon */}
          <button
            onClick={() => setShowSearchModal(true)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer"
            title="Search Features, Residents & Bills"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* 🔔 Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all relative active:scale-95 cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-[#542d87]"></span>
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-100 mb-2">
                  <h4 className="text-xs font-black text-[#542d87] uppercase tracking-wider">Notifications</h4>
                  <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">3 New</span>
                </div>
                <div className="space-y-2">
                  {sampleNotifications.map((n) => {
                    const Icon = n.icon;
                    return (
                      <div key={n.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${n.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 leading-snug">{n.title}</p>
                          <p className="text-[10px] font-medium text-slate-400 mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button 
                  onClick={() => {
                    setActiveTab('notices');
                    setShowNotifications(false);
                  }}
                  className="w-full mt-3 py-2 bg-[#542d87] hover:bg-[#462372] text-white font-bold text-xs rounded-lg transition-colors text-center block uppercase tracking-wider cursor-pointer"
                >
                  View All Notices
                </button>
              </div>
            )}
          </div>

          {/* User Profile Pill & Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 p-1.5 pl-2.5 rounded-lg text-white font-bold text-xs transition-all active:scale-95 cursor-pointer"
            >
              <span className="hidden sm:inline max-w-[100px] truncate">{user.name || 'User'}</span>
              <div className="w-6 h-6 rounded-full bg-orange-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in duration-100">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.role || 'Resident'}</p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-purple-50 rounded-lg flex items-center gap-2 mt-1"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#542d87]" />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 mt-1"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Sub-Navigation Row (ApnaComplex Signature Tabs: ACTIVITY | MY STUFF | COMMUNITY | MANAGEMENT) */}
      <div className="w-full px-4 md:px-6 flex items-center gap-6 overflow-x-auto custom-scrollbar text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('security')}
          className={`py-2.5 transition-all cursor-pointer whitespace-nowrap border-b-2 ${
            isActivity
              ? 'border-white text-white font-black'
              : 'border-transparent text-purple-200 hover:text-white'
          }`}
        >
          Activity
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`py-2.5 transition-all cursor-pointer whitespace-nowrap border-b-2 ${
            isMyStuff
              ? 'border-white text-white font-black'
              : 'border-transparent text-purple-200 hover:text-white'
          }`}
        >
          My Stuff
        </button>

        <button
          onClick={() => setActiveTab('notices')}
          className={`py-2.5 transition-all cursor-pointer whitespace-nowrap border-b-2 ${
            isCommunity
              ? 'border-white text-white font-black'
              : 'border-transparent text-purple-200 hover:text-white'
          }`}
        >
          Community
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`py-2.5 transition-all cursor-pointer whitespace-nowrap border-b-2 ${
            isManagement
              ? 'border-white text-white font-black'
              : 'border-transparent text-purple-200 hover:text-white'
          }`}
        >
          Management
        </button>
      </div>

      {/* Global Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-start justify-center pt-20 p-4 z-[100] text-slate-800">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <Search className="w-5 h-5 text-[#542d87] shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search flat, bills, notices, complaints..."
                className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-900 placeholder:text-slate-400"
              />
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Quick Shortcuts</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setActiveTab('maintenance');
                    setShowSearchModal(false);
                  }}
                  className="p-3 bg-orange-50/60 hover:bg-orange-50 rounded-lg text-left border border-orange-100 transition-colors"
                >
                  <p className="text-xs font-black text-orange-800">💳 My Financials & Pay</p>
                  <p className="text-[10px] text-slate-500">Pay maintenance dues</p>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('complaints');
                    setShowSearchModal(false);
                  }}
                  className="p-3 bg-purple-50/60 hover:bg-purple-50 rounded-lg text-left border border-purple-100 transition-colors"
                >
                  <p className="text-xs font-black text-[#542d87]">🛠️ My Complaints</p>
                  <p className="text-[10px] text-slate-500">Track and log issues</p>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('notices');
                    setShowSearchModal(false);
                  }}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-left border border-slate-100 transition-colors"
                >
                  <p className="text-xs font-black text-slate-800">📢 Notice Board</p>
                  <p className="text-[10px] text-slate-500">Society circulars</p>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('security');
                    setShowSearchModal(false);
                  }}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-left border border-slate-100 transition-colors"
                >
                  <p className="text-xs font-black text-slate-800">🛡️ Gate Pass</p>
                  <p className="text-[10px] text-slate-500">Visitors & security</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
