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
  ChevronLeft,
  ArrowDownCircle,
  CheckCircle2
} from 'lucide-react';
import { Role } from '../types';
import TowerTechLogo from './TowerTechLogo';

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
      category: 'RESIDENT SERVICES',
      items: [
        { id: 'maintenance', label: 'My Bills & Maintenance', icon: CreditCard },
        { id: 'complaints', label: 'My Complaints', icon: MessageSquare },
        { id: 'bookings', label: 'Amenity Booking', icon: Calendar },
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

      {/* SIDEBAR THEME (Light Purple Shaded Theme with Bright White Text) */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-[240px] sm:w-[260px] bg-gradient-to-b from-[#6e44d8] to-[#5b32c6] text-white flex flex-col shrink-0 z-50 font-sans select-none transition-transform duration-200 ease-in-out p-4 shadow-2xl border-r border-purple-400/30 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        
        {/* BRAND LOGO */}
        <div className="flex items-center justify-between pb-6 px-1 relative">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => setActiveTab('dashboard')}
          >
            {/* Logo Image */}
            <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-purple-900/20 group-hover:scale-105 transition-transform overflow-hidden p-1">
              <TowerTechLogo className="w-full h-full" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-xl font-black text-white tracking-tight">
                  TowerTech<span className="text-[#FAA928]">.</span>
                </span>
              </div>
              <p className="text-[10px] font-black text-white uppercase tracking-widest mt-1 opacity-100">
                Society Management
              </p>
            </div>
          </div>

          {/* Figma Style Collapse Indicator Button */}
          <div className="hidden md:flex absolute -right-7 top-4 w-6 h-6 rounded-full bg-white border border-purple-200 shadow-md text-purple-600 items-center justify-center cursor-pointer hover:bg-purple-50 transition-colors z-20">
            <ChevronLeft className="w-3.5 h-3.5 text-purple-700" />
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* CATEGORIZED NAVIGATION LINKS */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar pr-1 py-3 space-y-5">
          {navCategories.map((group) => (
            <div key={group.category} className="space-y-1.5">
              <p className="text-[11px] font-black text-white uppercase tracking-wider px-3 mb-2 opacity-100">
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
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 text-[13px] font-extrabold cursor-pointer border ${
                      isActive 
                        ? 'bg-white text-[#6e44d8] font-black shadow-lg border-white' 
                        : 'text-white font-extrabold border-transparent hover:bg-white/20 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${isActive ? 'text-[#6e44d8]' : 'text-white'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge ? (
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black shrink-0 shadow-xs ${
                        isActive ? 'bg-[#6e44d8] text-white' : 'bg-[#FAA928] text-white'
                      }`}>
                        {item.badge}
                      </span>
                    ) : isActive ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6e44d8] shrink-0"></span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* SIGN OUT */}
        <div className="pt-2 shrink-0">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-rose-200 hover:text-white hover:bg-rose-500/10 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

      </aside>
    </>
  );
}
