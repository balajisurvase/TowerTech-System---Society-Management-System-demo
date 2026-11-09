import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Shield, 
  Clock, 
  User, 
  Phone, 
  Building2, 
  Car, 
  Users, 
  AlertTriangle 
} from 'lucide-react';
import { VisitorRecord } from '../types/visitor';
import { format } from 'date-fns';

interface VisitorApprovalCardProps {
  key?: React.Key;
  visitor: VisitorRecord;
  onApprove: (visitorId: number | string) => Promise<void>;
  onReject: (visitorId: number | string, reason?: string) => Promise<void>;
  onViewDetails: (visitor: VisitorRecord) => void;
  approving?: boolean;
  rejecting?: boolean;
}

export default function VisitorApprovalCard({
  visitor,
  onApprove,
  onReject,
  onViewDetails,
  approving,
  rejecting
}: VisitorApprovalCardProps) {
  const [showConfirmApprove, setShowConfirmApprove] = useState(false);
  const [showConfirmReject, setShowConfirmReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const formatRequestTime = (timeStr?: string) => {
    if (!timeStr) return 'Just now';
    try {
      return format(new Date(timeStr), 'hh:mm a, dd MMM');
    } catch {
      return timeStr;
    }
  };

  const handleConfirmApprove = async () => {
    setSubmittingAction(true);
    try {
      await onApprove(visitor.visitor_id);
      setShowConfirmApprove(false);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleConfirmReject = async () => {
    setSubmittingAction(true);
    try {
      await onReject(visitor.visitor_id, rejectReason.trim());
      setShowConfirmReject(false);
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-br from-amber-50/50 via-white to-purple-50/30 rounded-2xl border-2 border-amber-200/90 shadow-md p-5 flex flex-col justify-between gap-4 relative overflow-hidden transition-all duration-150 hover:shadow-lg">
        {/* Urgent Attention Accent Ribbon */}
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400" />

        {/* Header: Visitor name, category, pending badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {visitor.profile_photo ? (
              <img
                src={visitor.profile_photo}
                alt={visitor.visitor_name}
                className="w-13 h-13 rounded-2xl object-cover border-2 border-amber-300 shadow-xs shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-13 h-13 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-lg border border-amber-200 shrink-0 shadow-2xs">
                {visitor.visitor_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-slate-900">{visitor.visitor_name}</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md">
                  {visitor.category.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs font-mono font-bold text-slate-500 mt-0.5 flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{visitor.visitor_mobile || 'No Mobile Provided'}</span>
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-xs animate-pulse">
            APPROVAL NEEDED
          </span>
        </div>

        {/* Key Fields Requested */}
        <div className="bg-white/90 rounded-xl p-3.5 border border-amber-100/80 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs shadow-2xs">
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Flat Number</span>
            <span className="font-black text-purple-900 font-mono mt-0.5 block truncate">
              Flat {visitor.flat_number} (T-{visitor.tower})
            </span>
          </div>

          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Purpose of Visit</span>
            <span className="font-bold text-slate-800 mt-0.5 block truncate" title={visitor.purpose}>
              {visitor.purpose}
            </span>
          </div>

          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Visitor Count</span>
            <span className="font-bold text-slate-800 mt-0.5 block">
              {visitor.visitor_count || 1} Person(s)
            </span>
          </div>

          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Vehicle Number</span>
            <span className="font-mono font-bold text-purple-700 mt-0.5 block truncate">
              {visitor.vehicle_number || 'None'}
            </span>
          </div>

          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Request Time</span>
            <span className="font-bold text-slate-700 mt-0.5 block truncate">
              {formatRequestTime(visitor.created_at)}
            </span>
          </div>

          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Security Guard</span>
            <span className="font-bold text-slate-700 mt-0.5 block truncate">
              {visitor.security_user_name || 'Amit Jadhav'} ({visitor.gate_name || 'Main Gate'})
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => onViewDetails(visitor)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-[#6339CA] hover:bg-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Details</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={submittingAction || approving || rejecting}
              onClick={() => setShowConfirmReject(true)}
              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject</span>
            </button>

            <button
              type="button"
              disabled={submittingAction || approving || rejecting}
              onClick={() => setShowConfirmApprove(true)}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve Entry</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog: APPROVE */}
      {showConfirmApprove && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-[120] animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-2xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-xl font-black text-slate-900 tracking-tight">Approve Visitor Entry?</h4>
              <p className="text-xs text-slate-500 font-medium mt-1">
                You are authorizing <span className="font-black text-slate-900">{visitor.visitor_name}</span> to enter Green Park Residency for Flat <span className="font-bold text-purple-700">{visitor.flat_number}</span>. Security will be notified to allow entry.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 font-medium border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400">Visitor:</span>
                <span className="font-bold text-slate-800">{visitor.visitor_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Category:</span>
                <span className="font-bold uppercase text-purple-700">{visitor.category.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gate:</span>
                <span className="font-bold text-slate-800">{visitor.gate_name || 'Main Gate'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmApprove(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAction}
                onClick={handleConfirmApprove}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              >
                {submittingAction ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Approve</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: REJECT with optional reason */}
      {showConfirmReject && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-[120] animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shadow-2xs">
              <XCircle className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-xl font-black text-slate-900 tracking-tight">Decline Visitor Entry?</h4>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Security will be notified that visitor <span className="font-black text-slate-900">{visitor.visitor_name}</span> is not authorized for Flat {visitor.flat_number}.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Rejection Reason (Optional)
              </label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Not at home, Wrong flat, Did not order"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none text-xs font-bold text-slate-800"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmReject(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={submittingAction}
                onClick={handleConfirmReject}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/20 cursor-pointer disabled:opacity-50"
              >
                {submittingAction ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Confirm Reject</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
