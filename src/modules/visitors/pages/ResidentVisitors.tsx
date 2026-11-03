import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, 
  Users, 
  Clock, 
  LogIn, 
  Calendar, 
  Sparkles, 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Building2,
  Plus
} from 'lucide-react';
import { User, Resident } from '../../../types';
import { VisitorRecord } from '../types/visitor';
import { visitorService } from '../services/visitorService';
import { visitorRealtimeService } from '../services/visitorRealtimeService';
import VisitorStatistics from '../components/VisitorStatistics';
import VisitorApprovalCard from '../components/VisitorApprovalCard';
import VisitorCard from '../components/VisitorCard';
import VisitorDetails from '../components/VisitorDetails';
import VisitorHistoryTable from '../components/VisitorHistoryTable';
import VisitorInvitationComponent from '../components/VisitorInvitation';
import { toast } from 'sonner';

interface ResidentVisitorsProps {
  user: User | Resident;
  onRefresh?: () => void;
}

export default function ResidentVisitors({ user, onRefresh }: ResidentVisitorsProps) {
  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'expected' | 'inside' | 'history' | 'invite'>('pending');
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorRecord | null>(null);

  const residentId = (user as any).resident_id || user.id || 'R083';
  const residentName = user.name || 'Rahul Sharma';
  const residentFlat = (user as any).flat || '101';
  const residentTower = (user as any).tower || 'D';

  const fetchResidentVisitors = async () => {
    try {
      const all = await visitorService.getVisitors();
      // Filter specifically for this resident's flat/resident_id
      const myVisitors = all.filter(v => {
        const matchResId = v.resident_id && String(v.resident_id) === String(residentId);
        const matchFlat = v.flat_number && String(v.flat_number).toLowerCase().trim() === String(residentFlat).toLowerCase().trim();
        return matchResId || matchFlat;
      });
      setVisitors(myVisitors);
    } catch (err) {
      console.warn('Failed to load resident visitors:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchResidentVisitors();

    // Subscribe to real-time database updates
    const unsubscribe = visitorRealtimeService.subscribe(() => {
      fetchResidentVisitors();
    });

    return () => {
      unsubscribe();
    };
  }, [residentId, residentFlat]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchResidentVisitors();
    if (onRefresh) onRefresh();
    toast.success('Visitor records refreshed');
  };

  // Approve visitor handler
  const handleApprove = async (visitorId: number | string) => {
    try {
      const res = await visitorService.approveVisitorRequest(visitorId, residentId, residentName);
      if (res.success && res.data) {
        toast.success(`Approved visitor entry for ${res.data.visitor_name}`);
        await fetchResidentVisitors();
      } else {
        toast.error(res.error || 'Failed to approve visitor.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Approval error');
    }
  };

  // Reject visitor handler
  const handleReject = async (visitorId: number | string, reason?: string) => {
    try {
      const res = await visitorService.rejectVisitorRequest(visitorId, residentId, residentName, reason);
      if (res.success && res.data) {
        toast.info(`Visitor ${res.data.visitor_name} was declined.`);
        await fetchResidentVisitors();
      } else {
        toast.error(res.error || 'Failed to decline visitor.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Rejection error');
    }
  };

  // Categorize sections
  const pendingList = useMemo(() => visitors.filter(v => v.status === 'pending'), [visitors]);
  const expectedList = useMemo(() => visitors.filter(v => v.status === 'approved'), [visitors]);
  const insideList = useMemo(() => visitors.filter(v => v.status === 'inside'), [visitors]);
  const historyList = useMemo(() => visitors.filter(v => v.status === 'exited' || v.status === 'rejected'), [visitors]);

  return (
    <div className="space-y-6 font-sans">
      {/* 1. RESIDENT HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#321F5C] via-[#5D31C7] to-[#6339CA] text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-purple-900/60 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-purple-400/20 text-purple-200 border border-purple-400/30 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-purple-300" />
              <span>Flat {residentFlat} (Tower {residentTower})</span>
            </span>
            <span className="text-purple-300 text-xs font-mono font-bold">
              Resident ID: {residentId}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
            Visitor Management · {residentName}
          </h2>
          <p className="text-xs text-purple-200 font-medium">
            Review gate entry requests, track admitted visitors in real time, and generate digital fast passes for your guests.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 w-full md:w-auto justify-between md:justify-end">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 transition-all cursor-pointer text-white"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invite')}
            className="px-5 py-3 bg-[#FAA928] hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Invite Guest / Pass</span>
          </button>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <VisitorStatistics
        insideCount={insideList.length}
        pendingCount={pendingList.length}
        expectedCount={expectedList.length}
        todayCount={visitors.length}
        activeFilter={activeTab === 'inside' ? 'inside' : activeTab === 'pending' ? 'pending' : activeTab === 'expected' ? 'expected' : undefined}
        onFilterClick={(filterId) => {
          if (filterId === 'inside') setActiveTab('inside');
          else if (filterId === 'pending') setActiveTab('pending');
          else if (filterId === 'expected') setActiveTab('expected');
          else setActiveTab('history');
        }}
      />

      {/* 3. RESIDENT SECTIONS TABS */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-1 text-xs font-black uppercase tracking-wider">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'pending' ? 'bg-[#6339CA] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>Pending Approval</span>
          {pendingList.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white animate-pulse">
              {pendingList.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('expected')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'expected' ? 'bg-[#6339CA] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>Expected Visitors</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-800">
            {expectedList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inside')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'inside' ? 'bg-[#6339CA] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>Visitors Currently Inside</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800">
            {insideList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'history' ? 'bg-[#6339CA] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Visitor History
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('invite')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'invite' ? 'bg-[#6339CA] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Invite Visitor</span>
        </button>
      </div>

      {/* 4. TAB CONTENTS */}

      {/* SECTION 1: PENDING APPROVAL */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Pending Entry Approvals ({pendingList.length})
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Visitors waiting at the gate for Flat {residentFlat}. Your response will notify security in real time.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingList.map((v, index) => (
              <VisitorApprovalCard
                key={v.id ? `res-pending-${v.id}-${index}` : `res-pending-${index}`}
                visitor={v}
                onApprove={handleApprove}
                onReject={handleReject}
                onViewDetails={(vis) => setSelectedVisitor(vis)}
              />
            ))}
          </div>

          {pendingList.length === 0 && (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 opacity-80" />
              <p className="text-sm font-black text-slate-800">No Pending Requests</p>
              <p className="text-xs text-slate-400">There are no visitors currently waiting at the gate for your flat.</p>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: EXPECTED VISITORS */}
      {activeTab === 'expected' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Expected Visitors ({expectedList.length})
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Approved requests awaiting physical arrival and security check-in.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expectedList.map((v, index) => (
              <VisitorCard
                key={v.id ? `res-expected-${v.id}-${index}` : `res-expected-${index}`}
                visitor={v}
                userRole="resident"
                onViewDetails={(vis) => setSelectedVisitor(vis)}
              />
            ))}
          </div>

          {expectedList.length === 0 && (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 space-y-2">
              <Calendar className="w-10 h-10 mx-auto text-purple-400 opacity-60" />
              <p className="text-sm font-black text-slate-800">No Expected Visitors</p>
              <p className="text-xs text-slate-400">You have no approved visitors awaiting check-in.</p>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: VISITORS CURRENTLY INSIDE */}
      {activeTab === 'inside' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Visitors Currently Inside ({insideList.length})
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Guests who have checked in through the gate and are currently at Flat {residentFlat}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insideList.map((v, index) => (
              <VisitorCard
                key={v.id ? `res-inside-${v.id}-${index}` : `res-inside-${index}`}
                visitor={v}
                userRole="resident"
                onViewDetails={(vis) => setSelectedVisitor(vis)}
              />
            ))}
          </div>

          {insideList.length === 0 && (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 space-y-2">
              <LogIn className="w-10 h-10 mx-auto text-blue-400 opacity-60" />
              <p className="text-sm font-black text-slate-800">No Visitors Inside</p>
              <p className="text-xs text-slate-400">No visitors are currently on premises for your flat.</p>
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: VISITOR HISTORY */}
      {activeTab === 'history' && (
        <VisitorHistoryTable
          visitors={visitors}
          onViewDetails={(vis) => setSelectedVisitor(vis)}
          title={`Flat ${residentFlat} Visitor Entry History`}
        />
      )}

      {/* SECTION 5: INVITE VISITOR */}
      {activeTab === 'invite' && (
        <VisitorInvitationComponent
          resident={{
            resident_id: residentId,
            name: residentName,
            flat: residentFlat,
            tower: residentTower
          }}
          onInvitationCreated={() => {
            fetchResidentVisitors();
          }}
        />
      )}

      {/* MODAL: DETAILS */}
      {selectedVisitor && (
        <VisitorDetails
          visitor={selectedVisitor}
          userRole="resident"
          onClose={() => setSelectedVisitor(null)}
        />
      )}
    </div>
  );
}
