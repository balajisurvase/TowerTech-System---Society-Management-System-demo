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
  Megaphone, 
  MessagesSquare, 
  FileText, 
  X, 
  Settings,
  HelpCircle,
  ChevronLeft,
  ArrowDownCircle,
  CheckCircle2
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

  type NavItem = { id: string; label: string; icon: React.ElementType; badge?: string };
  type NavCategory = { category: string; items: NavItem[] };

  const navCategories: NavCategory[] = isSecurity ? [
    {
      category: 'MAIN MENU',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ]
    },
    {
      category: 'SECURITY',
      items: [
        { id: 'security', label: 'Visitor Management', icon: Shield, badge: 'Live' },
      ]
    },
    {
      category: 'COMMUNICATION',
      items: [
        { id: 'notices', label: 'Notice Management', icon: Megaphone },
        { id: 'communication', label: 'Communication', icon: MessagesSquare },
      ]
    },
    {
      category: 'GENERAL',
      items: [
        { id: 'profile', label: 'Settings', icon: Settings },
      ]
    }
  ] : isUserAdmin ? [
    {
      category: 'MAIN MENU',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ]
    },
    {
      category: 'SOCIETY MANAGEMENT',
      items: [
        { id: 'residents', label: 'Residents', icon: Users },
        { id: 'bookings', label: 'Amenities', icon: Calendar },
      ]
    },
    {
      category: 'FINANCIAL MANAGEMENT',
      items: [
        { id: 'financial', label: 'Financial Management', icon: IndianRupee },
        { id: 'maintenance', label: 'Maintenance', icon: CreditCard },
      ]
    },
    {
      category: 'SECURITY MANAGEMENT',
      items: [
        { id: 'security', label: 'Visitor Management', icon: Shield },
      ]
    },
    {
      category: 'COMMUNICATION',
      items: [
        { id: 'notices', label: 'Notice Management', icon: Megaphone },
        { id: 'communication', label: 'Communication', icon: MessagesSquare },
        { id: 'complaints', label: 'Complaints', icon: MessageSquare, badge: '1' },
      ]
    },
    {
      category: 'GENERAL',
      items: [
        { id: 'profile', label: 'Settings', icon: Settings },
      ]
    }
  ] : [
    {
      category: 'MAIN MENU',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ]
    },
    {
      category: 'SOCIETY MANAGEMENT',
      items: [
        { id: 'bookings', label: 'Amenities', icon: Calendar },
        { id: 'documents', label: 'Documents', icon: FileText },
      ]
    },
    {
      category: 'FINANCIAL MANAGEMENT',
      items: [
        { id: 'maintenance', label: 'Maintenance', icon: CreditCard },
      ]
    },
    {
      category: 'SECURITY MANAGEMENT',
      items: [
        { id: 'security', label: 'Visitor Management', icon: Shield },
      ]
    },
    {
      category: 'COMMUNICATION',
      items: [
        { id: 'notices', label: 'Notice Management', icon: Megaphone },
        { id: 'communication', label: 'Communication', icon: MessagesSquare },
        { id: 'complaints', label: 'Complaints', icon: MessageSquare, badge: '1' },
      ]
    },
    {
      category: 'GENERAL',
      items: [
        { id: 'profile', label: 'Settings', icon: Settings },
      ]
    }
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

      {/* DASH FIGMA THEME SIDEBAR (Deep Midnight Navy: #0b1739) */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-[240px] sm:w-[260px] bg-[#0b1739] text-white flex flex-col shrink-0 z-50 font-sans select-none transition-transform duration-200 ease-in-out p-4 shadow-2xl border-r border-slate-800/80 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        
        {/* BRAND LOGO: DASH THEME (Bright blue rounded icon + white typography) */}
        <div className="flex items-center justify-between pb-5 px-1 relative">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => setActiveTab('dashboard')}
          >
            {/* Vivid Blue Rounded App Icon */}
            <div className="w-10 h-10 rounded-2xl bg-[#1d72fe] flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
              <ArrowDownCircle className="w-5 h-5 text-white" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-xl font-black text-white tracking-tight">
                  TowerTech<span className="text-[#1d72fe]">.</span>
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Joyville Sensorium
              </p>
            </div>
          </div>

          {/* Figma Style Collapse Indicator Button */}
          <div className="hidden md:flex absolute -right-7 top-2.5 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-md text-slate-600 items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors z-20">
            <ChevronLeft className="w-3.5 h-3.5 text-slate-700" />
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* CATEGORIZED NAVIGATION LINKS */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar pr-1 py-3 space-y-4">
          {navCategories.map((group) => (
            <div key={group.category} className="space-y-1">
              <p className="text-[9px] font-black text-slate-400/80 uppercase tracking-wider px-3 mb-1.5">
                {group.category}
              </p>
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-150 text-xs font-semibold cursor-pointer ${
                      isActive 
                        ? 'bg-white/10 text-white font-black shadow-xs border border-white/10' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#1d72fe]' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge ? (
                      <span className="px-1.5 py-0.5 rounded-md bg-[#ff2e7e] text-white text-[9px] font-black shrink-0 shadow-xs">
                        {item.badge}
                      </span>
                    ) : isActive ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1d72fe] shrink-0"></span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* FIGMA DASH BOTTOM HELP CARD */}
        <div className="pt-2 shrink-0">
          <div className="bg-[#101e42] rounded-2xl p-4 border border-blue-900/40 text-center relative overflow-hidden shadow-inner">
            <div className="w-8 h-8 rounded-full bg-[#1d72fe] text-white flex items-center justify-center mx-auto mb-2 shadow-md shadow-blue-500/20">
              <HelpCircle className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-white tracking-tight">Need Help with Dash?</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Joyville support desk is active</p>
            <button
              onClick={() => setActiveTab('communication')}
              className="mt-3 w-full py-2 bg-[#1d72fe] hover:bg-blue-600 active:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Go to help center
            </button>
          </div>

          {/* SIGN OUT */}
          <button
            onClick={onLogout}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

      </aside>
    </>
  );
}
