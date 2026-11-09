import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Check, 
  X, 
  Phone, 
  Building2, 
  Shield, 
  Clock, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  XCircle,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { VisitorRecord } from '../types/visitor';
import { visitorService } from '../services/visitorService';
import { visitorRealtimeService } from '../services/visitorRealtimeService';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface VisitorAlertPopupProps {
  currentResidentId?: string;
  currentResidentFlat?: string;
  currentResidentTower?: string;
  currentResidentName?: string;
}

// Gentle, modern 2-tone melodic chime using Web Audio API
function playChimeSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // First note: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second harmonic note: 880 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.14);
    gain2.gain.setValueAtTime(0.24, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.6);
  } catch {}
}

export default function VisitorAlertPopup({
  currentResidentId,
  currentResidentFlat,
  currentResidentTower,
  currentResidentName = 'Resident'
}: VisitorAlertPopupProps) {
  const [activeAlerts, setActiveAlerts] = useState<VisitorRecord[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('towertech_visitor_sound') !== 'false';
  });
  const [processingId, setProcessingId] = useState<string | number | null>(null);
  const [rejectingVisitor, setRejectingVisitor] = useState<VisitorRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Track shown visitor notification IDs to prevent duplicates
  const shownIdsRef = useRef<Set<string>>(new Set());

  // Helper to determine if visitor belongs to this resident
  const isMatchForCurrentResident = (visitor: any): boolean => {
    if (!visitor) return false;

    // Match by resident_id
    if (currentResidentId && visitor.resident_id) {
      if (String(visitor.resident_id).toLowerCase() === String(currentResidentId).toLowerCase()) {
        return true;
      }
    }

    // Match by flat & tower
    const vFlat = String(visitor.flat || visitor.flat_number || '').trim().toLowerCase();
    const myFlat = String(currentResidentFlat || '').trim().toLowerCase();

    if (vFlat && myFlat && vFlat === myFlat) {
      // If tower specified on both, check tower match
      const vTower = String(visitor.tower || '').trim().toLowerCase();
      const myTower = String(currentResidentTower || '').trim().toLowerCase();
      if (!vTower || !myTower || vTower === myTower) {
        return true;
      }
    }

    return false;
  };

  // Subscribe to real-time visitor database updates
  useEffect(() => {
    if (!currentResidentFlat && !currentResidentId) return;

    // Load initial pending visitor requests for this resident on mount
    const checkInitialPending = async () => {
      try {
        const all = await visitorService.getVisitors();
        const pendingForMe = all.filter(v => {
          const isPending = v.status === 'pending' || v.approval_status === 'pending';
          return isPending && isMatchForCurrentResident(v);
        });

        // Add any pending ones that haven't been dismissed in this session
        const toShow: VisitorRecord[] = [];
        pendingForMe.forEach(v => {
          const key = `seen_${v.id}_${v.created_at}`;
          if (!shownIdsRef.current.has(key)) {
            shownIdsRef.current.add(key);
            toShow.push(v);
          }
        });

        if (toShow.length > 0) {
          setActiveAlerts(prev => [...toShow, ...prev]);
          if (soundEnabled) playChimeSound();
        }
      } catch (err) {
        console.warn('Failed to check initial pending visitors:', err);
      }
    };

    checkInitialPending();

    // Listen to real-time events via Supabase Realtime
    const unsubscribe = visitorRealtimeService.subscribe((payload) => {
      const record = payload.newRecord;
      if (!record) return;

      const isPending = (record.status || 'Pending').toLowerCase() === 'pending' && 
                        (record.approval_status || 'Pending').toLowerCase() === 'pending';

      if (isPending && isMatchForCurrentResident(record)) {
        const key = `seen_${record.visitor_id || record.id}_${record.created_at}`;
        if (!shownIdsRef.current.has(key)) {
          shownIdsRef.current.add(key);

          // Fetch full mapped record
          visitorService.getVisitorById(record.visitor_id || record.id).then(mapped => {
            if (mapped) {
              setActiveAlerts(prev => [mapped, ...prev.filter(a => a.id !== mapped.id)]);
              if (soundEnabled) playChimeSound();
            }
          });
        }
      } else if (!isPending) {
        // If status changed away from pending (e.g., approved/rejected elsewhere), remove from active popups
        const id = record.visitor_id || record.id;
        setActiveAlerts(prev => prev.filter(a => Number(a.visitor_id) !== Number(id) && String(a.id) !== String(id)));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentResidentId, currentResidentFlat, currentResidentTower, soundEnabled]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('towertech_visitor_sound', String(next));
    if (next) playChimeSound();
  };

  const dismissAlert = (visitorId: number | string) => {
    setActiveAlerts(prev => prev.filter(v => v.visitor_id !== visitorId && v.id !== visitorId));
  };

  const handleApprove = async (visitor: VisitorRecord) => {
    setProcessingId(visitor.visitor_id);
    try {
      const res = await visitorService.approveVisitorRequest(
        visitor.visitor_id,
        currentResidentId || 'R001',
        currentResidentName
      );

      if (res.success) {
        toast.success(`Entry Approved for ${visitor.visitor_name}`, {
          description: `Security has been notified. Visitor can now be checked in at ${visitor.gate_name || 'Main Gate'}.`
        });
        dismissAlert(visitor.visitor_id);
      } else {
        toast.error(res.error || 'Failed to approve visitor.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Approval error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingVisitor) return;
    setProcessingId(rejectingVisitor.visitor_id);
    try {
      const res = await visitorService.rejectVisitorRequest(
        rejectingVisitor.visitor_id,
        currentResidentId || 'R001',
        currentResidentName,
        rejectReason.trim() || 'Declined by resident'
      );

      if (res.success) {
        toast.success(`Entry Declined for ${rejectingVisitor.visitor_name}`, {
          description: 'Security gate has been instructed not to admit visitor.'
        });
        dismissAlert(rejectingVisitor.visitor_id);
        setRejectingVisitor(null);
        setRejectReason('');
      } else {
        toast.error(res.error || 'Failed to decline visitor.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Decline error');
    } finally {
      setProcessingId(null);
    }
  };

  if (activeAlerts.length === 0 && !rejectingVisitor) {
    return null;
  }

  return (
    <>
      {/* Floating Visitor Alert Notification Container (Top-Right / Fixed) */}
      <aside aria-label="Visitor Gate Alerts" className="fixed top-16 right-3 sm:right-6 z-[130] w-[calc(100vw-24px)] sm:w-96 flex flex-col gap-3 pointer-events-none">
        {activeAlerts.map((visitor) => {
          const isProcessing = processingId === visitor.visitor_id;
          const displayGate = visitor.gate_name || 'Main Gate';
          const flatDisplay = `Flat ${visitor.tower || currentResidentTower || 'A'}-${visitor.flat_number || currentResidentFlat || '101'}`;

          return (
            <div
              key={visitor.id}
              className="pointer-events-auto bg-white rounded-3xl border-2 border-amber-300 shadow-2xl p-5 overflow-hidden relative animate-in slide-in-from-top-4 duration-200"
            >
              {/* Pulsing Alert Top Border */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 animate-pulse" />

              {/* Header: Title, Gate, Sound Toggle & Close */}
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                    <Bell className="w-4 h-4 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 tracking-tight leading-tight">
                      New Visitor at {displayGate}
                    </h4>
                    <p className="text-[11px] font-bold text-amber-600 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>Waiting for your entry approval</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={toggleSound}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                    title={soundEnabled ? 'Mute alert chime' : 'Enable alert chime'}
                  >
                    {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-purple-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissAlert(visitor.visitor_id)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Dismiss alert (stays in Pending list)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Visitor Details Card Body */}
              <div className="py-3 flex items-start gap-3.5">
                {/* Visitor Live Photo Thumbnail */}
                <div className="relative shrink-0">
                  {visitor.profile_photo ? (
                    <img
                      src={visitor.profile_photo}
                      alt={visitor.visitor_name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-200 shadow-sm"
                      onError={(e) => {
                        // Fallback on broken image
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-800 border border-purple-200 flex flex-col items-center justify-center font-black text-xl shadow-xs">
                      {visitor.visitor_name.charAt(0).toUpperCase()}
                      <span className="text-[9px] font-bold text-purple-600 uppercase tracking-tighter">Photo</span>
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[8px] font-black uppercase tracking-wider shadow-xs">
                    NEW
                  </span>
                </div>

                {/* Text Specifications */}
                <div className="space-y-1 min-w-0 flex-1 text-xs">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-black text-slate-900 text-sm truncate">
                      {visitor.visitor_name}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                      {visitor.category?.replace('_', ' ') || 'Guest'}
                    </span>
                  </div>

                  <p className="text-slate-600 font-mono font-medium flex items-center gap-1.5 text-[11px]">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{visitor.visitor_mobile || 'No Mobile'}</span>
                  </p>

                  <div className="pt-0.5 text-[11px] text-slate-600">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Visiting</span>
                    <span className="font-bold text-purple-900">{flatDisplay}</span>
                  </div>

                  <div className="text-[11px] text-slate-600 pt-0.5">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Purpose</span>
                    <span className="font-medium text-slate-800 line-clamp-1">{visitor.purpose}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: [Approve] [Reject] */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setRejectingVisitor(visitor)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleApprove(visitor)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isProcessing ? 'Approving...' : 'Approve'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </aside>

      {/* Confirmation Modal when Resident clicks Reject */}
      {rejectingVisitor && (
        <div 
          className="fixed inset-0 z-[140] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setRejectingVisitor(null)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-rose-100 space-y-5 animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Decline Visitor Entry</h3>
                <p className="text-xs text-slate-500">
                  Decline entry for <span className="font-bold text-slate-800">{rejectingVisitor.visitor_name}</span> at {rejectingVisitor.gate_name || 'Main Gate'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Reason for Declining (Optional)
              </label>
              <textarea
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Not expecting any guest, wrong flat, unavailable..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingVisitor(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingId === rejectingVisitor.visitor_id}
                onClick={handleConfirmReject}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Confirm Decline</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
