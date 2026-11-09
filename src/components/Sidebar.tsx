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
  FileText, 
  X, 
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

  type NavItem = { id: string; label: string; icon: React.ElementType };
  type NavCategory = { category: string; items: NavItem[] };

  const navCategories: NavCategory[] = isSecurity ? [
    {
      category: 'MAIN',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
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
      category: 'ACCOUNT & SETTINGS',
      items: [
        { id: 'profile', label: 'Profile', icon: Settings },
      ]
    }
  ] : isUserAdmin ? [
    {
      category: 'MAIN',
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
        { id: 'complaints', label: 'Complaints', icon: MessageSquare },
      ]
    },
    {
      category: 'ACCOUNT & SETTINGS',
      items: [
        { id: 'profile', label: 'Profile', icon: Settings },
      ]
    }
  ] : [
    {
      category: 'MAIN',
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
        { id: 'complaints', label: 'Complaints', icon: MessageSquare },
      ]
    },
    {
      category: 'ACCOUNT & SETTINGS',
      items: [
        { id: 'profile', label: 'Profile', icon: Settings },
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

      <aside className={`fixed md:sticky top-0 left-0 h-screen w-[240px] sm:w-[260px] bg-[#542d87] text-white flex flex-col shrink-0 z-50 font-sans select-none transition-transform duration-200 ease-in-out p-4 shadow-xl border-r border-purple-900/40 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        
        {/* BRAND LOGO ("TowerTech - Joyville Sensorium") */}
        <div className="flex items-center justify-between pb-4 px-2 border-b border-white/10">
          <div className="cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-2xl font-black text-white tracking-tight">
                TowerTech<span className="text-orange-400">.</span>
              </span>
            </div>
            <p className="text-[11px] font-extrabold text-orange-300 tracking-wide mt-1">
              Joyville Sensorium
            </p>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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
              <p className="text-[9px] font-black text-purple-300 uppercase tracking-widest px-3 mb-1">
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-150 text-xs font-bold cursor-pointer ${
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
            </div>
          ))}
        </nav>

        {/* BOTTOM HELP & PROFILE */}
        <div className="pt-3 border-t border-white/10 space-y-1 shrink-0">
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
