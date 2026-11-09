import React from 'react';
import { LogIn, Clock, Calendar, Users, ArrowUpRight } from 'lucide-react';

interface VisitorStatisticsProps {
  insideCount: number;
  pendingCount: number;
  expectedCount: number;
  todayCount: number;
  onFilterClick?: (status: string) => void;
  activeFilter?: string;
}

export default function VisitorStatistics({
  insideCount,
  pendingCount,
  expectedCount,
  todayCount,
  onFilterClick,
  activeFilter
}: VisitorStatisticsProps) {
  const cards = [
    {
      id: 'inside',
      label: 'Visitors Inside',
      count: insideCount,
      subtext: 'Currently on premises',
      icon: LogIn,
      badge: 'LIVE',
      gradient: 'from-blue-600 to-indigo-700',
      lightBg: 'bg-blue-50/80 border-blue-200 text-blue-900',
      iconColor: 'text-blue-600 bg-blue-100'
    },
    {
      id: 'pending',
      label: 'Pending Approvals',
      count: pendingCount,
      subtext: 'Awaiting resident action',
      icon: Clock,
      badge: pendingCount > 0 ? 'ATTENTION' : 'CLEAR',
      gradient: 'from-amber-500 to-orange-600',
      lightBg: 'bg-amber-50/80 border-amber-200 text-amber-900',
      iconColor: 'text-amber-600 bg-amber-100'
    },
    {
      id: 'expected',
      label: 'Expected Visitors',
      count: expectedCount,
      subtext: 'Approved & pre-scheduled',
      icon: Calendar,
      badge: 'TODAY',
      gradient: 'from-purple-600 to-violet-800',
      lightBg: 'bg-purple-50/80 border-purple-200 text-purple-900',
      iconColor: 'text-purple-600 bg-purple-100'
    },
    {
      id: 'all',
      label: "Today's Entries",
      count: todayCount,
      subtext: 'Total logged visitor visits',
      icon: Users,
      badge: 'DAILY TOTAL',
      gradient: 'from-[#321F5C] to-[#5D31C7]',
      lightBg: 'bg-slate-50 border-slate-200 text-slate-800',
      iconColor: 'text-[#6339CA] bg-purple-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onFilterClick && onFilterClick(card.id)}
            className={`p-5 rounded-2xl border text-left transition-all duration-150 flex flex-col justify-between h-[138px] shadow-sm relative overflow-hidden group cursor-pointer ${
              isActive 
                ? 'bg-[#321F5C] text-white border-purple-800 shadow-md ring-2 ring-purple-400' 
                : 'bg-white hover:border-purple-300 hover:shadow-md border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isActive ? 'bg-white/20 text-white' : card.iconColor
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {card.badge}
              </span>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-black tracking-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>
                  {card.count}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-0.5 ${
                  isActive ? 'text-purple-200' : 'text-purple-600'
                }`}>
                  <span>{card.label}</span>
                  <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </div>
              <p className={`text-[11px] font-medium truncate mt-0.5 ${isActive ? 'text-purple-200/80' : 'text-slate-400'}`}>
                {card.subtext}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
