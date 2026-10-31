import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, 
  Users, 
  Clock, 
  LogIn, 
  LogOut as LogOutIcon, 
  XCircle, 
  CheckCircle2, 
  Building2, 
  RefreshCw, 
  Search, 
  Download, 
  Filter, 
  FileText,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { User, Resident } from '../../../types';
import { VisitorRecord } from '../types/visitor';
import { visitorService } from '../services/visitorService';
import { visitorRealtimeService } from '../services/visitorRealtimeService';
import VisitorStatusBadge from '../components/VisitorStatusBadge';
import VisitorDetails from '../components/VisitorDetails';
import VisitorHistoryTable from '../components/VisitorHistoryTable';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface AdminVisitorsProps {
  user: User;
  residents?: Resident[];
}

export default function AdminVisitors({ user, residents }: AdminVisitorsProps) {
  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'live_activity' | 'all_visitors' | 'rejected' | 'reports'>('overview');

  const fetchVisitors = async () => {
    try {
      const data = await visitorService.getVisitors();
      setVisitors(data);
    } catch (err) {
      console.error('Failed to load visitors:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVisitors();

    // Subscribe to realtime database updates
    const unsubscribe = visitorRealtimeService.subscribe(() => {
      fetchVisitors();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVisitors();
    toast.success('Society visitor records updated');
  };

  // Metrics
  const insideVisitors = useMemo(() => visitors.filter(v => v.status === 'inside'), [visitors]);
  const pendingVisitors = useMemo(() => visitors.filter(v => v.status === 'pending'), [visitors]);
  const rejectedVisitors = useMemo(() => visitors.filter(v => v.status === 'rejected'), [visitors]);
  const completedVisits = useMemo(() => visitors.filter(v => v.status === 'exited'), [visitors]);
  const totalToday = visitors.length;

  return (
    <div className="space-y-6 font-sans">
      {/* 1. ADMIN HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#321F5C] via-[#5D31C7] to-[#6339CA] text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-purple-900/60 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-purple-400/20 text-purple-200 border border-purple-400/30 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-purple-300" />
              <span>Society Gate Surveillance & Administration</span>
            </span>
            <span className="text-purple-300 text-xs font-mono font-bold">
              Green Park Residency
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
            Society Visitors Management Dashboard
          </h2>
          <p className="text-xs text-purple-200 font-medium">
            Monitor gate traffic, oversee pending approvals, inspect live audit records, and export comprehensive society reports.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 w-full md:w-auto justify-between md:justify-end">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 transition-all cursor-pointer text-white flex items-center gap-2"
            title="Refresh Society Data"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-xs font-bold hidden sm:inline">Sync Live Data</span>
          </button>
        </div>
      </div>

      {/* 2. ADMIN STATS CARDS (5 metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <button
          type="button"
          onClick={() => setActiveTab('all_visitors')}
          className="p-4 rounded-2xl bg-white border border-slate-200 text-left shadow-xs hover:border-purple-300 transition-all cursor-pointer flex flex-col justify-between h-[120px]"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#6339CA] flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Total</span>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{totalToday}</span>
            <p className="text-[10px] font-black uppercase text-purple-600 mt-0.5">Total Logged</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('live_activity')}
          className="p-4 rounded-2xl bg-white border border-slate-200 text-left shadow-xs hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between h-[120px]"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <LogIn className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Live</span>
          </div>
          <div>
            <span className="text-2xl font-black text-blue-700">{insideVisitors.length}</span>
            <p className="text-[10px] font-black uppercase text-blue-600 mt-0.5">Inside Society</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className="p-4 rounded-2xl bg-white border border-slate-200 text-left shadow-xs hover:border-amber-300 transition-all cursor-pointer flex flex-col justify-between h-[120px]"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Gate</span>
          </div>
          <div>
            <span className="text-2xl font-black text-amber-600">{pendingVisitors.length}</span>
            <p className="text-[10px] font-black uppercase text-amber-600 mt-0.5">Pending Action</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rejected')}
          className="p-4 rounded-2xl bg-white border border-slate-200 text-left shadow-xs hover:border-rose-300 transition-all cursor-pointer flex flex-col justify-between h-[120px]"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <XCircle className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">Declined</span>
          </div>
          <div>
            <span className="text-2xl font-black text-rose-600">{rejectedVisitors.length}</span>
            <p className="text-[10px] font-black uppercase text-rose-600 mt-0.5">Rejected</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all_visitors')}
          className="p-4 rounded-2xl bg-white border border-slate-200 text-left shadow-xs hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between h-[120px] col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <LogOutIcon className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Closed</span>
          </div>
          <div>
            <span className="text-2xl font-black text-emerald-700">{completedVisits.length}</span>
            <p className="text-[10px] font-black uppercase text-emerald-600 mt-0.5">Completed Visits</p>
          </div>
        </button>
      </div>

      {/* 3. WORKING TABS */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-1 text-xs font-black uppercase tracking-wider">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'overview' ? 'bg-[#6339CA] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Live Gate Overview
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('live_activity')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'live_activity' ? 'bg-[#6339CA] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          <span>Currently Inside ({insideVisitors.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all_visitors')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'all_visitors' ? 'bg-[#6339CA] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Society Records
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rejected')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'rejected' ? 'bg-[#6339CA] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>Rejected Requests</span>
          {rejectedVisitors.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-800">
              {rejectedVisitors.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'reports' ? 'bg-[#6339CA] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Security Reports</span>
        </button>
      </div>

      {/* 4. TAB CONTENTS */}

      {/* TAB 1: OVERVIEW & LIVE ACTIVITY */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Live Gate Activity Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Gate Activity Stream</span>
                </h3>
                <p className="text-xs text-slate-400 font-medium">Real-time gate passes updated directly from Supabase</p>
              </div>

              <span className="text-[10px] font-black uppercase tracking-wider text-[#6339CA] bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                Main Gate & North Gate
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {visitors.slice(0, 7).map((v) => (
                <div key={v.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl px-2 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#6339CA] flex items-center justify-center font-black text-xs shrink-0">
                      {v.visitor_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">{v.visitor_name}</span>
                        <span className="text-[9px] font-black uppercase text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-100">
                          {v.category.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium">
                        Visiting Flat <span className="font-bold text-slate-700">{v.flat_number} (T-{v.tower})</span> · Host: {v.resident_name || 'Resident'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                    <div className="text-left sm:text-right">
                      <p className="font-bold text-slate-700">{v.gate_name || 'Main Gate'}</p>
                      <p className="text-[10px] text-slate-400">Guard: {v.security_user_name || 'Amit Jadhav'}</p>
                    </div>

                    <VisitorStatusBadge status={v.status} size="sm" />

                    <button
                      type="button"
                      onClick={() => setSelectedVisitor(v)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-[#6339CA] hover:bg-purple-50 font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors"
                    >
                      Audit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Filtered Table */}
          <VisitorHistoryTable
            visitors={visitors}
            onViewDetails={(v) => setSelectedVisitor(v)}
            title="Recent Society Visitor Records"
          />
        </div>
      )}

      {/* TAB 2: CURRENTLY INSIDE */}
      {activeTab === 'live_activity' && (
        <VisitorHistoryTable
          visitors={insideVisitors}
          onViewDetails={(v) => setSelectedVisitor(v)}
          title="Visitors Currently on Society Premises"
        />
      )}

      {/* TAB 3: ALL SOCIETY RECORDS */}
      {activeTab === 'all_visitors' && (
        <VisitorHistoryTable
          visitors={visitors}
          onViewDetails={(v) => setSelectedVisitor(v)}
          title="Complete Society Visitor Management Master Records"
        />
      )}

      {/* TAB 4: REJECTED REQUESTS */}
      {activeTab === 'rejected' && (
        <div className="space-y-4">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-rose-900 uppercase tracking-wider">Declined Visitor Requests</h3>
              <p className="text-[11px] text-rose-700">Review visitor requests that residents declined to authorize.</p>
            </div>
            <span className="text-xs font-black text-rose-800 bg-white px-2.5 py-1 rounded-lg border border-rose-200">
              {rejectedVisitors.length} Declined
            </span>
          </div>

          <VisitorHistoryTable
            visitors={rejectedVisitors}
            onViewDetails={(v) => setSelectedVisitor(v)}
            title="Declined & Denied Gate Entry Records"
          />
        </div>
      )}

      {/* TAB 5: REPORTS & CSV EXPORT */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Daily Entry Summary</span>
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">{visitors.length} Visits</p>
              <div className="space-y-1 text-xs text-slate-500 font-medium">
                <div className="flex justify-between">
                  <span>Admitted / Inside:</span>
                  <span className="font-bold text-blue-600">{insideVisitors.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Exited:</span>
                  <span className="font-bold text-slate-700">{completedVisits.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Declined:</span>
                  <span className="font-bold text-rose-600">{rejectedVisitors.length}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Gate Activity</span>
                <Shield className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-slate-900">Main Gate (94%)</p>
              <p className="text-xs text-slate-500 font-medium">Primary residential gate handles majority of delivery and cab entries.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Security Shift Efficiency</span>
                <Clock className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">Morning Shift</p>
              <p className="text-xs text-slate-500 font-medium">Peak entries recorded between 09:00 AM and 01:00 PM.</p>
            </div>
          </div>

          <VisitorHistoryTable
            visitors={visitors}
            onViewDetails={(v) => setSelectedVisitor(v)}
            title="Generated Society-Wide Gate Report"
            allowExport={true}
          />
        </div>
      )}

      {/* MODAL: DETAILS */}
      {selectedVisitor && (
        <VisitorDetails
          visitor={selectedVisitor}
          userRole="admin"
          onClose={() => setSelectedVisitor(null)}
        />
      )}
    </div>
  );
}
