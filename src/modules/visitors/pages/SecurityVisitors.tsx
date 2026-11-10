import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, 
  Users, 
  Plus, 
  Search, 
  RefreshCw, 
  LogIn, 
  LogOut as LogOutIcon, 
  Clock, 
  Building2, 
  Calendar,
  Phone,
  CheckCircle2,
  AlertCircle,
  Filter
} from 'lucide-react';
import TowerTechLogo from '../../../components/TowerTechLogo';
import { User, Resident } from '../../../types';
import { VisitorRecord } from '../types/visitor';
import { visitorService } from '../services/visitorService';
import { visitorRealtimeService } from '../services/visitorRealtimeService';
import VisitorStatistics from '../components/VisitorStatistics';
import VisitorCard from '../components/VisitorCard';
import VisitorForm from '../components/VisitorForm';
import VisitorDetails from '../components/VisitorDetails';
import VisitorHistoryTable from '../components/VisitorHistoryTable';
import { toast } from 'sonner';
import { format } from 'date-fns';

import LiveClock from '../../../components/ui/LiveClock';

interface SecurityVisitorsProps {
  user: User;
  residents?: Resident[];
  onLogout?: () => void;
}

export default function SecurityVisitors({ user, residents, onLogout }: SecurityVisitorsProps) {
  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'new_visitor' | 'pending' | 'inside' | 'history'>('overview');
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Gate details
  const gateName = 'Main Gate (GATE-01)';
  const guardName = user.name || 'Amit Jadhav';
  const guardShift = user.shift || 'Morning Shift';

  // Fetch visitors from Supabase
  const fetchVisitors = async () => {
    try {
      const data = await visitorService.getVisitors();
      setVisitors(data);
    } catch (err) {
      console.warn('Error fetching visitors:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVisitors();

    // Subscribe to Supabase Realtime updates
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
    toast.success('Live visitor records refreshed');
  };

  // Check In action
  const handleCheckIn = async (visitorId: number | string) => {
    try {
      const res = await visitorService.checkInVisitor(visitorId, {
        name: guardName,
        phone: user.phone,
        shift: guardShift
      });
      if (res.success && res.data) {
        toast.success(`Checked In: ${res.data.visitor_name}`, {
          description: `Visitor successfully admitted into society.`
        });
        await fetchVisitors();
      } else {
        toast.error(res.error || 'Failed to check in visitor.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Check-in failed');
    }
  };

  // Check Out action
  const handleCheckOut = async (visitorId: number | string) => {
    try {
      const res = await visitorService.checkOutVisitor(visitorId, {
        name: guardName
      });
      if (res.success && res.data) {
        toast.success(`Checked Out: ${res.data.visitor_name}`, {
          description: `Departure recorded at ${gateName}.`
        });
        await fetchVisitors();
      } else {
        toast.error(res.error || 'Failed to check out visitor.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Check-out failed');
    }
  };

  // Metric counts
  const insideVisitors = visitors.filter(v => v.status === 'inside');
  const pendingVisitors = visitors.filter(v => v.status === 'pending');
  const expectedVisitors = visitors.filter(v => v.status === 'approved');
  const todayEntries = visitors.length;

  // Filtered live passes for security search
  const filteredLiveVisitors = useMemo(() => {
    return visitors.filter(v => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        v.visitor_name.toLowerCase().includes(q) ||
        v.visitor_mobile.includes(q) ||
        (v.flat_number && v.flat_number.toLowerCase().includes(q)) ||
        (v.tower && v.tower.toLowerCase().includes(q)) ||
        (v.resident_name && v.resident_name.toLowerCase().includes(q)) ||
        (v.vehicle_number && v.vehicle_number.toLowerCase().includes(q)) ||
        (v.purpose && v.purpose.toLowerCase().includes(q))
      );

      const matchesStatus = statusFilter === 'all' || v.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [visitors, searchQuery, statusFilter]);

  return (
    <div className="space-y-6 font-sans">
      {/* 1. SECURITY HEADER */}
      <div className="bg-gradient-to-r from-[#30204F] via-[#46288f] to-[#6841C6] text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-purple-900/40 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center p-2 shadow-xl shadow-purple-950/30 border border-white/20 shrink-0">
            <TowerTechLogo className="w-full h-full" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#F4B740]/20 text-[#F4B740] border border-[#F4B740]/30 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#F4B740]" />
                <span>Security Gate Operations</span>
              </span>
              <span className="text-purple-200 text-xs font-mono font-bold">
                {gateName}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
              Guard on Duty: {guardName}
            </h2>
            <p className="text-xs text-purple-200 font-medium">
              Green Park Residency · Shift: {guardShift} · Live Real-Time Gateway
            </p>
          </div>
        </div>

        {/* Date, Time & Actions */}
        <div className="flex flex-wrap items-center gap-3 relative z-10 w-full md:w-auto justify-between md:justify-end">
          <LiveClock />

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 transition-all cursor-pointer text-white"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('new_visitor')}
            className="px-5 py-3 bg-[#F4B740] hover:bg-[#e0a430] text-[#272333] font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Visitor Entry</span>
          </button>
        </div>
      </div>

      {/* 2. STATISTICS CARDS */}
      <VisitorStatistics
        insideCount={insideVisitors.length}
        pendingCount={pendingVisitors.length}
        expectedCount={expectedVisitors.length}
        todayCount={todayEntries}
        activeFilter={activeTab === 'inside' ? 'inside' : activeTab === 'pending' ? 'pending' : activeTab === 'overview' ? 'all' : undefined}
        onFilterClick={(filterId) => {
          if (filterId === 'inside') setActiveTab('inside');
          else if (filterId === 'pending') setActiveTab('pending');
          else if (filterId === 'expected') setActiveTab('overview');
          else setActiveTab('overview');
        }}
      />

      {/* 3. WORKING NAVIGATION TABS */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-1 text-xs font-black uppercase tracking-wider">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'overview' ? 'bg-[#6339CA] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Overview & Live Passes
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('new_visitor')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'new_visitor' ? 'bg-[#6339CA] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Visitor</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'pending' ? 'bg-[#6339CA] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>Pending Approvals</span>
          {pendingVisitors.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white">
              {pendingVisitors.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inside')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'inside' ? 'bg-[#6339CA] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>Visitors Inside</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800">
            {insideVisitors.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'history' ? 'bg-[#6339CA] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Visitor History & Reports
        </button>
      </div>

      {/* 4. CONTENT SECTIONS */}

      {/* TAB: NEW VISITOR REGISTRATION FORM */}
      {activeTab === 'new_visitor' && (
        <VisitorForm
          securityUser={{
            name: guardName,
            phone: user.phone,
            shift: guardShift,
            gate_name: gateName
          }}
          onSuccess={() => {
            fetchVisitors();
            setActiveTab('overview');
          }}
          onCancel={() => setActiveTab('overview')}
        />
      )}

      {/* TAB: PENDING APPROVALS */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Awaiting Resident Approval ({pendingVisitors.length})
            </h3>
            <span className="text-xs text-slate-400">Automatic real-time authorization</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingVisitors.map((v, index) => (
              <VisitorCard
                key={v.id ? `pending-${v.id}-${index}` : `pending-${index}`}
                visitor={v}
                userRole="security"
                onViewDetails={(vis) => setSelectedVisitor(vis)}
                onCheckIn={handleCheckIn}
                onCheckOut={handleCheckOut}
              />
            ))}
          </div>

          {pendingVisitors.length === 0 && (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 opacity-80" />
              <p className="text-sm font-black text-slate-800">All Visitor Requests Processed</p>
              <p className="text-xs text-slate-400">There are no pending visitor approvals at this moment.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB: VISITORS INSIDE */}
      {activeTab === 'inside' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Visitors Currently Inside Society ({insideVisitors.length})
            </h3>
            <span className="text-xs text-blue-600 font-bold">Active on premises</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insideVisitors.map((v, index) => (
              <VisitorCard
                key={v.id ? `inside-${v.id}-${index}` : `inside-${index}`}
                visitor={v}
                userRole="security"
                onViewDetails={(vis) => setSelectedVisitor(vis)}
                onCheckIn={handleCheckIn}
                onCheckOut={handleCheckOut}
              />
            ))}
          </div>

          {insideVisitors.length === 0 && (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 space-y-2">
              <LogIn className="w-10 h-10 mx-auto text-blue-500 opacity-60" />
              <p className="text-sm font-black text-slate-800">No Visitors Inside</p>
              <p className="text-xs text-slate-400">All registered visitors have checked out.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Action Banner */}
          {pendingVisitors.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black">
                  {pendingVisitors.length}
                </div>
                <div>
                  <p className="text-xs font-black text-amber-900">Pending Resident Approvals</p>
                  <p className="text-[11px] text-amber-700">Visitors waiting at the gate for resident authorization.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
              >
                Review Pending
              </button>
            </div>
          )}

          {/* Approved & Waiting for Check-in */}
          {expectedVisitors.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Approved · Ready for Security Check-In ({expectedVisitors.length})</span>
                </h3>
                <span className="text-xs text-emerald-700 font-bold">Resident Approved</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {expectedVisitors.map((v, index) => (
                  <VisitorCard
                    key={v.id ? `expected-${v.id}-${index}` : `expected-${index}`}
                    visitor={v}
                    userRole="security"
                    onViewDetails={(vis) => setSelectedVisitor(vis)}
                    onCheckIn={handleCheckIn}
                    onCheckOut={handleCheckOut}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recent Live Visitors Grid with Search & Filters */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Live Visitor Gate Passes ({filteredLiveVisitors.length})
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Real-time status tracking and gate clearance
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Search Input */}
                <div className="relative flex-1 sm:w-60">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, mobile, flat..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-purple-200"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-200"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">🟡 Pending</option>
                  <option value="approved">🟢 Approved (Ready)</option>
                  <option value="inside">🔵 Checked In (Inside)</option>
                  <option value="exited">⚪ Checked Out</option>
                  <option value="rejected">🔴 Rejected</option>
                </select>

                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className="text-xs font-black text-[#6339CA] hover:underline uppercase tracking-wider px-2"
                >
                  Full History
                </button>
              </div>
            </div>

            {/* Visitors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLiveVisitors.map((v, index) => (
                <VisitorCard
                  key={v.id ? `live-${v.id}-${index}` : `live-${index}`}
                  visitor={v}
                  userRole="security"
                  onViewDetails={(vis) => setSelectedVisitor(vis)}
                  onCheckIn={handleCheckIn}
                  onCheckOut={handleCheckOut}
                />
              ))}
            </div>

            {filteredLiveVisitors.length === 0 && (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 space-y-2">
                <Users className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-black text-slate-800">
                  {searchQuery || statusFilter !== 'all' ? 'No Matching Visitors Found' : 'No Visitor Records Yet'}
                </p>
                <p className="text-xs text-slate-400">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your search criteria or resetting status filter.'
                    : "Click 'New Visitor Entry' to register your first visitor."}
                </p>
                {(searchQuery || statusFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                    className="mt-2 text-xs font-black text-purple-700 hover:underline"
                  >
                    Reset Search & Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: VISITOR HISTORY & AUDIT LOG */}
      {activeTab === 'history' && (
        <VisitorHistoryTable
          visitors={visitors}
          onViewDetails={(vis) => setSelectedVisitor(vis)}
          title="Security Gate Entry & Exit Audit History"
        />
      )}

      {/* MODAL: VISITOR DETAILS */}
      {selectedVisitor && (
        <VisitorDetails
          visitor={selectedVisitor}
          userRole="security"
          onClose={() => setSelectedVisitor(null)}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
        />
      )}
    </div>
  );
}
