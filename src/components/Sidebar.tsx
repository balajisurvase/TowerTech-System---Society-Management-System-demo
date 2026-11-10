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

      {/* SIDEBAR THEME (Deep Aubergine Sidebar with Ivory & Gold Accents) */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-[240px] sm:w-[260px] bg-[#30204F] text-white flex flex-col shrink-0 z-50 font-sans select-none transition-transform duration-200 ease-in-out p-4 shadow-2xl border-r border-purple-900/40 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        
        {/* BRAND LOGO */}
        <div className="flex items-center justify-between pb-6 px-1 relative">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => setActiveTab('dashboard')}
          >
            {/* Logo Image */}
            <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-purple-950/40 group-hover:scale-105 transition-transform overflow-hidden p-1">
              <TowerTechLogo className="w-full h-full" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-xl font-black text-white tracking-tight">
                  TowerTech<span className="text-[#F4B740]">.</span>
                </span>
              </div>
              <p className="text-[10px] font-black text-purple-200/80 uppercase tracking-widest mt-1">
                Green Park Residency
              </p>
            </div>
          </div>

          {/* Figma Style Collapse Indicator Button */}
          <div className="hidden md:flex absolute -right-7 top-4 w-6 h-6 rounded-full bg-[#6841C6] border border-purple-300/40 shadow-md text-white items-center justify-center cursor-pointer hover:bg-[#5531ab] transition-colors z-20">
            <ChevronLeft className="w-3.5 h-3.5 text-white" />
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
              <p className="text-[10px] font-black text-purple-300/70 uppercase tracking-widest px-3 mb-2">
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
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 text-xs font-bold cursor-pointer border ${
                      isActive 
                        ? 'bg-[#6841C6] text-white font-black shadow-lg shadow-purple-950/50 border-[#6841C6]' 
                        : 'text-purple-100/90 font-bold border-transparent hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#F4B740]' : 'text-purple-200'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge ? (
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black shrink-0 shadow-xs ${
                        isActive ? 'bg-[#F4B740] text-[#272333]' : 'bg-[#F4B740] text-[#272333]'
                      }`}>
                        {item.badge}
                      </span>
                    ) : isActive ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F4B740] shrink-0"></span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* SIGN OUT */}
        <div className="pt-2 shrink-0 border-t border-purple-900/40">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-rose-300 hover:text-white hover:bg-rose-500/10 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

      </aside>
    </>
  );
}

