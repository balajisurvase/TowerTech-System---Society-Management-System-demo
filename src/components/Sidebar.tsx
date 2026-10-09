import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  MessageSquare, 
  Calendar, 
  Shield, 
  IndianRupee, 
  LogOut, 
  Building2, 
  User, 
  Megaphone, 
  MessagesSquare, 
  ChevronRight, 
  FileText, 
  X, 
  Sparkles, 
  Settings,
  HelpCircle
} from 'lucide-react';
import { Role } from '../types';

interface SidebarProps {
  isAdmin?: boolean;
  userRole?: Role;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ 
  isAdmin, 
  userRole, 
  activeTab, 
  setActiveTab, 
  onLogout,
  isMobileOpen,
  onCloseMobile
}: SidebarProps) {
  const isUserAdmin = userRole === 'admin' || isAdmin;
  const isSecurity = userRole === 'security';

  const navItems = isSecurity ? [
    { id: 'dashboard', label: 'My Stuff', icon: LayoutDashboard },
    { id: 'security', label: 'Security & Gate', icon: Shield },
    { id: 'notices', label: 'Community Notices', icon: Megaphone },
    { id: 'communication', label: 'Messages', icon: MessagesSquare },
    { id: 'profile', label: 'Settings', icon: Settings },
  ] : isUserAdmin ? [
    { id: 'dashboard', label: 'My Stuff (Dashboard)', icon: LayoutDashboard },
    { id: 'maintenance', label: 'My Financials', icon: CreditCard },
    { id: 'complaints', label: 'My Complaints', icon: MessageSquare },
    { id: 'notices', label: 'Community Notices', icon: Megaphone },
    { id: 'residents', label: 'Society Directory', icon: Users },
    { id: 'communication', label: 'Helpdesk & Chat', icon: MessagesSquare },
    { id: 'financial', label: 'Accounts & Ledger', icon: IndianRupee },
    { id: 'bookings', label: 'Amenities', icon: Calendar },
    { id: 'security', label: 'Gate Security', icon: Shield },
    { id: 'profile', label: 'Settings', icon: Settings },
  ] : [
    { id: 'dashboard', label: 'My Stuff', icon: LayoutDashboard },
    { id: 'maintenance', label: 'My Financials', icon: CreditCard },
    { id: 'complaints', label: 'My Complaints', icon: MessageSquare },
    { id: 'notices', label: 'Notice Board', icon: Megaphone },
    { id: 'communication', label: 'Messages', icon: MessagesSquare },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'security', label: 'Gate Passes', icon: Shield },
    { id: 'profile', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
        />
      )}

      <aside className={`fixed md:sticky top-0 left-0 h-screen w-[240px] sm:w-[260px] bg-[#542d87] text-white flex flex-col shrink-0 z-50 font-sans select-none transition-transform duration-200 ease-in-out p-4 shadow-xl border-r border-purple-900/40 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        
        {/* BRAND LOGO ("apnacomplex" / "TowerTech") */}
        <div className="flex items-center justify-between pb-5 px-2 border-b border-white/10">
          <div className="cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-2xl font-black text-white tracking-tight lowercase">
                apnacomplex<span className="text-orange-400">.</span>
              </span>
            </div>
            <p className="text-[10px] font-semibold text-purple-200 uppercase tracking-widest mt-1">
              Green Park Residency
            </p>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-1 py-4">
          <p className="text-[10px] font-bold text-purple-300 uppercase tracking-widest px-3 mb-2">
            Modules
          </p>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-150 text-xs font-bold cursor-pointer ${
                  isActive 
                    ? 'bg-white text-[#542d87] shadow-sm font-black' 
                    : 'text-purple-100 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#542d87]' : 'text-purple-200'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* BOTTOM HELP & PROFILE */}
        <div className="pt-3 border-t border-white/10 space-y-1">
          <button
            onClick={() => setActiveTab('communication')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 text-xs font-semibold cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Support Helpdesk</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-300 hover:text-white hover:bg-rose-500/20 text-xs font-bold cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

      </aside>
    </>
  );
}
