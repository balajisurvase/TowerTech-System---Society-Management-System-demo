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

  // Compute display pill label (e.g. "G-205" or "Flat A-102" or "Admin" or "Gate Pass")
  const flatDisplay = user.flat ? (user.tower ? `${user.tower}-${user.flat}` : `Flat ${user.flat}`) : (user.resident_id || user.tenant_id || '');
  const leftLabel = isSecurity 
    ? 'Security Gate' 
    : isAdmin 
      ? 'Green Park Admin' 
      : (flatDisplay || 'Tower A');

  // Sample notifications feed
  const sampleNotifications = [
    { id: '1', title: 'Maintenance Bill Generated', time: '10 min ago', icon: CreditCard, color: 'text-emerald-600 bg-emerald-50' },
    { id: '2', title: 'New Society Notice Published', time: '1 hour ago', icon: Megaphone, color: 'text-amber-600 bg-amber-50' },
    { id: '3', title: 'Complaint #104 Updated to In-Progress', time: '3 hours ago', icon: MessageSquare, color: 'text-blue-600 bg-blue-50' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 py-3 transition-all font-sans">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left Section: Mobile Menu + Back Button (if on sub-tab) OR Profile/Flat Dropdown */}
        <div className="flex items-center gap-2 md:gap-3">
          {onToggleMobileNav && (
            <button
              onClick={onToggleMobileNav}
              className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer flex items-center justify-center border border-slate-200"
              aria-label="Toggle Navigation Menu"
              title="Navigation Menu"
            >
              <Menu className="w-4 h-4 text-slate-700" />
            </button>
          )}

          {activeTab !== 'dashboard' ? (
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold transition-all group border border-slate-200/80 shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Home</span>
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-200/80 active:scale-95 shadow-2xs"
              >
                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                <span className="font-extrabold text-slate-900 tracking-tight text-xs">
                  {leftLabel}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-600 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Left Profile / Flat Quick Menu */}
              {showProfileMenu && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-3 bg-slate-50 rounded-xl mb-2 border border-slate-100">
                    <p className="text-xs font-black text-slate-900">{user.name}</p>
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mt-0.5">
                      {isSecurity ? 'Security Guard' : isAdmin ? 'Administrator' : `${user.occupancy_type || 'Resident'} • ${user.tower || 'A'} ${user.flat ? `(${user.flat})` : ''}`}
                    </p>
                    {user.email && (
                      <p className="text-[10px] text-slate-400 truncate mt-1">{user.email}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-colors flex items-center gap-2"
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      My Profile & Account
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setActiveTab('financial');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-colors flex items-center gap-2"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        Society Ledger & Audit
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Society Name Pill */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-600 border-l border-slate-200 pl-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="tracking-tight text-slate-800">Green Park Residency</span>
          </div>
        </div>

        {/* Right Section: 🔍 Search, 🔔 Bell, 👤 Profile Icon */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* 🔍 Search Icon */}
          <button
            onClick={() => setShowSearchModal(true)}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200/60 active:scale-95"
            title="Search Features, Residents & Bills"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* 🔔 Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200/60 relative active:scale-95"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white"></span>
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-100 mb-2">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Notifications</h4>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">3 New</span>
                </div>
                <div className="space-y-2">
                  {sampleNotifications.map((n) => {
                    const Icon = n.icon;
                    return (
                      <div key={n.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer">
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
                  className="w-full mt-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors text-center block uppercase tracking-wider"
                >
                  View All Notices
                </button>
              </div>
            )}
          </div>

          {/* 👤 Profile Icon (Orange Initial Badge as in screenshot) */}
          <button
            onClick={() => setActiveTab('profile')}
            className="w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-black text-sm flex items-center justify-center shadow-2xs transition-all active:scale-95 shrink-0"
            title="Profile"
          >
            {user.name ? user.name.charAt(0).toUpperCase() : 'N'}
          </button>

        </div>
      </div>

      {/* Global Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-20 p-4 z-[100]">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <Search className="w-5 h-5 text-indigo-600 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search residents, flat numbers, notices, bills..."
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
                  className="p-3 bg-slate-50 hover:bg-indigo-50 rounded-xl text-left border border-slate-100 transition-colors group"
                >
                  <p className="text-xs font-black text-slate-800 group-hover:text-indigo-700">💳 Maintenance & Bills</p>
                  <p className="text-[10px] text-slate-400">View or pay maintenance dues</p>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('notices');
                    setShowSearchModal(false);
                  }}
                  className="p-3 bg-slate-50 hover:bg-amber-50 rounded-xl text-left border border-slate-100 transition-colors group"
                >
                  <p className="text-xs font-black text-slate-800 group-hover:text-amber-700">📢 Society Notices</p>
                  <p className="text-[10px] text-slate-400">Latest announcements</p>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('residents');
                    setShowSearchModal(false);
                  }}
                  className="p-3 bg-slate-50 hover:bg-purple-50 rounded-xl text-left border border-slate-100 transition-colors group"
                >
                  <p className="text-xs font-black text-slate-800 group-hover:text-purple-700">👥 Resident Directory</p>
                  <p className="text-[10px] text-slate-400">Flat contacts & owners</p>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('security');
                    setShowSearchModal(false);
                  }}
                  className="p-3 bg-slate-50 hover:bg-blue-50 rounded-xl text-left border border-slate-100 transition-colors group"
                >
                  <p className="text-xs font-black text-slate-800 group-hover:text-blue-700">🛡 Gate & Visitors</p>
                  <p className="text-[10px] text-slate-400">Visitor passes & security log</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
