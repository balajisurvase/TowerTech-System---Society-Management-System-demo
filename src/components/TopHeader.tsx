import React, { useState, useEffect } from 'react';
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
  Menu,
  Shield,
  Check
} from 'lucide-react';
import { User } from '../types';
import TowerTechLogo from './TowerTechLogo';
import { visitorNotificationService } from '../modules/visitors/services/visitorNotificationService';
import { VisitorNotification } from '../modules/visitors/types/visitor';

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
  const [liveNotifications, setLiveNotifications] = useState<VisitorNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const isAdmin = user.role === 'admin' || !!user.admin_id;
  const isSecurity = user.role === 'security';

  const flatDisplay = user.flat ? (user.tower ? `${user.tower}-${user.flat}` : `Flat ${user.flat}`) : (user.resident_id || user.tenant_id || '');

  // Subscribe to real-time visitor notifications
  useEffect(() => {
    setLiveNotifications(visitorNotificationService.getNotifications());
    setUnreadCount(visitorNotificationService.getUnreadCount());

    const unsubscribe = visitorNotificationService.subscribe((notifications) => {
      setLiveNotifications(notifications);
      setUnreadCount(visitorNotificationService.getUnreadCount());
    });

    return () => unsubscribe();
  }, []);

  // Map subnav tabs (TowerTech style: ACTIVITY | MY STUFF | COMMUNITY | MANAGEMENT)
  const isActivity = activeTab === 'security' || activeTab === 'audit';
  const isMyStuff = activeTab === 'dashboard' || activeTab === 'profile';
  const isCommunity = activeTab === 'notices' || activeTab === 'communication' || activeTab === 'residents';
  const isManagementTab = activeTab === 'maintenance' || activeTab === 'financial' || activeTab === 'bookings' || activeTab === 'complaints';

  return (
    <header className="sticky top-0 z-50 bg-[#30204F] text-white shadow-md font-sans">
      {/* Top Bar: Brand, Search, Notifications, Avatar */}
      <div className="w-full px-4 md:px-6 py-2.5 flex items-center justify-between gap-4 border-b border-purple-900/40">

        
        {/* Left Section: Brand Logo + Hamburger */}
        <div className="flex items-center gap-3">
          {onToggleMobileNav && (
            <button 
              onClick={onToggleMobileNav}
              className="md:hidden p-1.5 rounded-lg text-white hover:bg-white/20 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-1 shadow-md shadow-purple-950/20 border border-white/20 shrink-0 overflow-hidden">
              <TowerTechLogo className="w-full h-full" type="icon" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-base font-black text-white tracking-tight">
                  TowerTech<span className="text-[#FAA928]">.</span>
                </span>
              </div>
              <span className="text-[11px] font-extrabold text-white block leading-tight mt-0.5 tracking-wide">
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
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer border border-white/10"
            title="Search Features, Residents & Bills"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* 🔔 Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all relative active:scale-95 cursor-pointer border border-white/10"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#FAA928] text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-purple-900 shadow-md animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-88 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-100 mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-[#6e44d8] uppercase tracking-wider">Activity Alerts</h4>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-black text-white bg-[#FAA928] text-slate-950 px-2 py-0.5 rounded-full">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => visitorNotificationService.markAllAsRead()}
                      className="text-[10px] font-black text-[#6e44d8] hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar">
                  {liveNotifications.length > 0 ? (
                    liveNotifications.slice(0, 6).map((n) => (
                      <div 
                        key={n.id}
                        onClick={() => {
                          visitorNotificationService.markAsRead(n.id);
                          setActiveTab('security');
                          setShowNotifications(false);
                        }}
                        className={`flex items-start gap-3 p-2.5 rounded-xl transition-all cursor-pointer ${
                          !n.read ? 'bg-purple-50/80 border border-purple-100' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          n.type === 'approval_request' ? 'bg-orange-100 text-orange-700' :
                          n.type === 'visitor_approved' ? 'bg-emerald-100 text-emerald-700' :
                          n.type === 'visitor_rejected' ? 'bg-rose-100 text-rose-700' :
                          n.type === 'visitor_inside' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          <Shield className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-black text-slate-900 leading-snug truncate">{n.title}</p>
                            <span className="text-[9px] font-bold text-slate-400 shrink-0">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 font-medium line-clamp-2 mt-0.5">{n.message}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-slate-400 text-xs font-medium">
                      No notifications yet
                    </div>
                  )}
                </div>

                <div className="pt-2 mt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => {
                      setActiveTab('security');
                      setShowNotifications(false);
                    }}
                    className="py-2 bg-[#6e44d8] hover:bg-[#5b32c6] text-white font-black text-xs rounded-xl transition-colors text-center uppercase tracking-wider cursor-pointer shadow-xs"
                  >
                    Visitor Desk
                  </button>
                  <button 
                    onClick={() => {
                      setActiveTab('notices');
                      setShowNotifications(false);
                    }}
                    className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl transition-colors text-center uppercase tracking-wider cursor-pointer"
                  >
                    Notice Board
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill & Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 p-1.5 pl-2.5 rounded-xl text-white font-bold text-xs transition-all active:scale-95 cursor-pointer border border-white/10"
            >
              <span className="hidden sm:inline max-w-[100px] truncate">{user.name || 'User'}</span>
              <div className="w-6 h-6 rounded-full bg-[#6339CA] text-white font-black text-xs flex items-center justify-center shadow-xs">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white text-purple-900 rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in duration-100">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-[#6339CA] truncate">{user.name}</p>
                  <p className="text-[10px] font-bold text-[#6339CA] truncate">{user.admin_role || (user.role === 'admin' ? 'Chairman' : user.role === 'security' ? 'Security Staff' : (user.occupancy_type === 'Tenant' ? 'Tenant' : 'Owner'))}</p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-purple-800 hover:bg-[#6339CA]/10 rounded-xl flex items-center gap-2 mt-1 transition-colors"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#6339CA]" />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 mt-1 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>



      {/* Global Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-[#6339CA]/50 backdrop-blur-xs flex items-start justify-center pt-20 p-4 z-[100] text-purple-900">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <Search className="w-5 h-5 text-[#542d87] shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search flat, bills, notices, complaints..."
                className="w-full bg-transparent border-none outline-none text-sm font-bold text-[#6339CA] placeholder:text-slate-400"
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
                  <p className="text-xs font-black text-purple-900">📢 Notice Board</p>
                  <p className="text-[10px] text-slate-500">Society circulars</p>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('security');
                    setShowSearchModal(false);
                  }}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-left border border-slate-100 transition-colors"
                >
                  <p className="text-xs font-black text-purple-900">🛡️ Gate Pass</p>
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
