import React from 'react';
import { Search, Bell, ShieldCheck, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User;
  activeTab?: string;
}

export default function Header({ user, activeTab = 'dashboard' }: HeaderProps) {
  const date = new Date();
  const dateFormatted = date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });

  const getBreadcrumb = (tab: string) => {
    switch (tab) {
      case 'dashboard': return { category: 'Main', title: 'Dashboard & Overview' };
      case 'residents': return { category: 'Society', title: 'Resident Directory' };
      case 'maintenance': return { category: 'Society', title: 'Maintenance & Billing' };
      case 'complaints': return { category: 'Society', title: 'Complaints & Helpdesk' };
      case 'notices': return { category: 'Society', title: 'Notice Board & Alerts' };
      case 'communication': return { category: 'Society', title: 'Broadcasts & Messages' };
      case 'financial': return { category: 'Management', title: 'Financial Ledger & Ledger Accounts' };
      case 'bookings': return { category: 'Management', title: 'Amenity Bookings' };
      case 'security': return { category: 'Security', title: 'Visitor Gate Management' };
      case 'profile': return { category: 'Administration', title: 'Profile & Settings' };
      default: return { category: 'System', title: 'Dashboard' };
    }
  };

  const breadcrumb = getBreadcrumb(activeTab);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0 z-20 sticky top-0 font-sans shadow-2xs">
      {/* Page Title & Breadcrumbs */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
          <span>TowerTech</span>
          <span>/</span>
          <span>{breadcrumb.category}</span>
        </div>
        <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-tight">
          {breadcrumb.title}
        </h1>
      </div>

      {/* Right Controls: Search, Notifications, Date, User Profile */}
      <div className="flex items-center gap-4">
        {/* Global Search Bar */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-500 w-56 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input 
            type="text" 
            placeholder="Search residents, flats..." 
            className="bg-transparent border-none outline-none w-full text-slate-800 placeholder-slate-400 text-xs font-medium"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono font-semibold text-slate-400 bg-white border border-slate-200 rounded">
            ⌘K
          </kbd>
        </div>

        {/* Notification Bell */}
        <button 
          aria-label="Notifications"
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 rounded-lg transition-colors border border-slate-200/60"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white"></span>
        </button>

        <div className="h-6 w-[1px] bg-slate-200 hidden sm:block" />

        {/* Date Display */}
        <div className="hidden xl:block text-right">
          <p className="text-xs font-semibold text-slate-700 leading-tight font-mono">{dateFormatted}</p>
          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex items-center justify-end gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Live System
          </p>
        </div>

        <div className="h-6 w-[1px] bg-slate-200 hidden xl:block" />

        {/* User Info Lockup */}
        <div className="flex items-center gap-3 pl-1">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900 leading-tight">{user.name}</p>
            <p className="text-[10px] font-bold text-indigo-600 tracking-wide uppercase mt-0.5">
              {user.role === 'security' ? 'Security Guard' : (user.admin_id || user.role === 'admin') ? 'Administrator' : (user.occupancy_type || 'Resident')}
            </p>
          </div>
          {user.profile_photo || (user as any).avatar ? (
            <img 
              src={user.profile_photo || (user as any).avatar} 
              alt={user.name} 
              className="w-9 h-9 rounded-lg object-cover border border-slate-200 shadow-2xs shrink-0" 
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm border border-indigo-200/80 shrink-0">
              {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

