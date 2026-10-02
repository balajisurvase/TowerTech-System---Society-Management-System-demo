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
  X
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

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
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

  let sections: NavSection[] = [];

  if (isSecurity) {
    sections = [
      {
        title: 'SECURITY',
        items: [
          { id: 'security', label: 'Visitor Desk', icon: Shield },
        ]
      },
      {
        title: 'COMMUNICATION',
        items: [
          { id: 'notices', label: 'Notices', icon: Megaphone },
          { id: 'communication', label: 'Broadcasts', icon: MessagesSquare },
        ]
      },
      {
        title: 'ACCOUNT',
        items: [
          { id: 'profile', label: 'Profile', icon: User },
        ]
      }
    ];
  } else if (isUserAdmin) {
    sections = [
      {
        title: 'MAIN',
        items: [
          { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        ]
      },
      {
        title: 'SOCIETY',
        items: [
          { id: 'residents', label: 'Residents', icon: Users },
          { id: 'maintenance', label: 'Maintenance', icon: CreditCard },
          { id: 'complaints', label: 'Complaints', icon: MessageSquare },
          { id: 'notices', label: 'Notices', icon: Megaphone },
          { id: 'communication', label: 'Communication', icon: MessagesSquare },
        ]
      },
      {
        title: 'MANAGEMENT',
        items: [
          { id: 'financial', label: 'Finance & Ledger', icon: IndianRupee },
          { id: 'bookings', label: 'Amenity Bookings', icon: Calendar },
        ]
      },
      {
        title: 'SECURITY',
        items: [
          { id: 'security', label: 'Security & Gate', icon: Shield },
        ]
      },
      {
        title: 'ADMINISTRATION',
        items: [
          { id: 'profile', label: 'Admin Settings', icon: User },
        ]
      }
    ];
  } else {
    // Resident or Tenant
    sections = [
      {
        title: 'MAIN',
        items: [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        ]
      },
      {
        title: 'COMMUNITY',
        items: [
          { id: 'notices', label: 'Notice Board', icon: Megaphone },
          { id: 'communication', label: 'Helpdesk Chat', icon: MessagesSquare },
          { id: 'complaints', label: 'My Complaints', icon: MessageSquare },
        ]
      },
      {
        title: 'SERVICES',
        items: [
          { id: 'maintenance', label: 'My Maintenance', icon: CreditCard },
          { id: 'bookings', label: 'Book Amenity', icon: Calendar },
          { id: 'security', label: 'Gate Passes', icon: Shield },
        ]
      },
      {
        title: 'ACCOUNT',
        items: [
          { id: 'profile', label: 'My Profile', icon: User },
        ]
      }
    ];
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
        />
      )}

      <aside className={`fixed md:sticky top-0 left-0 h-screen w-[250px] bg-[#0F172A] text-slate-400 flex flex-col shrink-0 z-50 border-r border-slate-800 font-sans select-none transition-transform duration-200 ease-in-out ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Brand Header */}
        <div className="p-4 md:p-5 pb-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-indigo-950/50 border border-indigo-400/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold tracking-tight text-white leading-none truncate">
                TowerTech
              </h1>
              <p className="text-[10px] font-semibold text-indigo-400/90 tracking-wide mt-1 truncate">
                Green Park Residency
              </p>
            </div>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Grouped Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto custom-scrollbar">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 text-[10px] font-extrabold text-slate-500 tracking-wider uppercase">
                {section.title}
              </div>
              {section.items.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-xs font-semibold cursor-pointer ${
                      isActive 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40 font-bold' 
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{tab.label}</span>
                    </div>
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer / User & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/50">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all text-xs font-semibold group cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-rose-400 transition-colors" />
            <span className="truncate">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

