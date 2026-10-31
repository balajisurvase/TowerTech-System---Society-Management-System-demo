import React from 'react';
import { 
  X, 
  User, 
  Phone, 
  Car, 
  Building2, 
  Shield, 
  Clock, 
  Calendar, 
  LogIn, 
  LogOut as LogOutIcon, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Printer
} from 'lucide-react';
import { VisitorRecord, VisitorEvent } from '../types/visitor';
import VisitorStatusBadge from './VisitorStatusBadge';
import { visitorService } from '../services/visitorService';
import { format } from 'date-fns';

interface VisitorDetailsProps {
  visitor: VisitorRecord;
  onClose: () => void;
  onCheckIn?: (visitorId: number | string) => void;
  onCheckOut?: (visitorId: number | string) => void;
  userRole?: string;
}

export default function VisitorDetails({
  visitor,
  onClose,
  onCheckIn,
  onCheckOut,
  userRole
}: VisitorDetailsProps) {
  const events: VisitorEvent[] = visitorService.getVisitorEvents(visitor.visitor_id);

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), 'dd MMM yyyy, hh:mm a');
    } catch {
      return dateStr;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-[110] p-3 sm:p-4 animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-auto flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-[#321F5C] via-[#5D31C7] to-[#6339CA] text-white flex justify-between items-start shrink-0 relative">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-black uppercase tracking-wider text-purple-200">
              <Shield className="w-3.5 h-3.5" />
              <span>TowerTech Visitor Pass · ID #{visitor.visitor_id}</span>
            </div>
            <h3 className="text-2xl font-black tracking-tight">{visitor.visitor_name}</h3>
            <p className="text-xs text-purple-200 font-medium">
              Category: <span className="font-bold uppercase text-white">{visitor.category.replace('_', ' ')}</span> · Gate: {visitor.gate_name || 'Main Gate'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
              title="Print Pass"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button 
              onClick={onClose} 
              className="p-2 text-white/80 hover:text-white hover:bg-white/15 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1 bg-slate-50/50">
          
          {/* Status Banner */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#6339CA]">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Current Security Status</p>
                <div className="mt-1">
                  <VisitorStatusBadge status={visitor.status} size="md" />
                </div>
              </div>
            </div>

            {visitor.rejection_reason && (
              <div className="text-right">
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider block">Decline Reason</span>
                <span className="text-xs font-bold text-slate-700">{visitor.rejection_reason}</span>
              </div>
            )}
          </div>

          {/* Visitor Live Photo Display */}
          {visitor.profile_photo && (
            <div className="bg-white p-4 rounded-2xl border border-purple-200/90 shadow-xs flex items-center gap-4">
              <img 
                src={visitor.profile_photo} 
                alt={visitor.visitor_name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-purple-300 shadow-sm shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-block">
                  Verified Live Photo
                </span>
                <h4 className="text-sm font-black text-slate-900">{visitor.visitor_name}</h4>
                <p className="text-xs text-slate-500 font-medium">
                  Identity recorded at {visitor.gate_name || 'Main Gate'} by Security Guard {visitor.security_user_name || ''}
                </p>
              </div>
            </div>
          )}

          {/* Core Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Left: Visitor Details */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2.5">
              <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-purple-600" />
                <span>Visitor Information</span>
              </h4>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold">Full Name</span>
                <span className="font-black text-slate-900">{visitor.visitor_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold">Mobile Number</span>
                <span className="font-mono font-bold text-slate-900">{visitor.visitor_mobile || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold">Visitor Count</span>
                <span className="font-bold text-slate-900">{visitor.visitor_count || 1} Person(s)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold">Vehicle Number</span>
                <span className="font-mono font-bold text-purple-700">{visitor.vehicle_number || 'No Vehicle'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400 font-bold">Purpose</span>
                <span className="font-bold text-slate-800 text-right max-w-[160px] truncate">{visitor.purpose}</span>
              </div>
            </div>

            {/* Right: Flat & Host Details */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2.5">
              <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-purple-600" />
                <span>Destination & Host</span>
              </h4>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold">Authorized Resident</span>
                <span className="font-black text-slate-900">{visitor.resident_name || 'Resident'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold">Flat Number</span>
                <span className="font-black text-purple-700 font-mono">Flat {visitor.flat_number} (Tower {visitor.tower})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold">Resident ID</span>
                <span className="font-mono text-slate-600">{visitor.resident_id || 'R001'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold">Security Gate</span>
                <span className="font-bold text-slate-800">{visitor.gate_name || 'Main Gate'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400 font-bold">Logged By Guard</span>
                <span className="font-bold text-slate-800">{visitor.security_user_name || 'Amit Jadhav'}</span>
              </div>
            </div>
          </div>

          {/* Event History Timeline */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] pb-2 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                <span>Audit & Activity Timeline</span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Chronological Records</span>
            </h4>

            <div className="space-y-3 pt-1">
              {/* Event: Created */}
              <div className="flex items-start gap-3 text-xs">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-black text-slate-900">Visitor Request Registered</p>
                    <span className="text-[10px] text-slate-400 font-mono">{formatTimestamp(visitor.created_at)}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Logged at {visitor.gate_name || 'Main Gate'} by guard {visitor.security_user_name || 'Amit Jadhav'}.</p>
                </div>
              </div>

              {/* Event: Approval / Rejection */}
              {visitor.approval_time && (
                <div className="flex items-start gap-3 text-xs">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                    visitor.approval_status === 'approved' || visitor.status === 'approved' || visitor.status === 'inside' || visitor.status === 'exited'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      : 'bg-rose-50 text-rose-600 border-rose-200'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-black text-slate-900">
                        {visitor.approval_status === 'rejected' || visitor.status === 'rejected' ? 'Request Rejected' : 'Resident Approved Pass'}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">{formatTimestamp(visitor.approval_time)}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Decision confirmed by resident {visitor.resident_name || 'Host Resident'}.
                    </p>
                  </div>
                </div>
              )}

              {/* Event: Check In */}
              {(visitor.entry_time && (visitor.status === 'inside' || visitor.status === 'exited')) && (
                <div className="flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                    <LogIn className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-black text-slate-900">Security Gate Check-In</p>
                      <span className="text-[10px] text-slate-400 font-mono">{formatTimestamp(visitor.entry_time)}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Visitor physically admitted through gate into society premises.</p>
                  </div>
                </div>
              )}

              {/* Event: Check Out */}
              {visitor.exit_time && visitor.status === 'exited' && (
                <div className="flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <LogOutIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-black text-slate-900">Security Gate Check-Out</p>
                      <span className="text-[10px] text-slate-400 font-mono">{formatTimestamp(visitor.exit_time)}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Visitor departure recorded and pass closed.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {visitor.status === 'approved' && onCheckIn && (
              <button
                onClick={() => {
                  onCheckIn(visitor.visitor_id);
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Check In Visitor</span>
              </button>
            )}

            {visitor.status === 'inside' && onCheckOut && (
              <button
                onClick={() => {
                  onCheckOut(visitor.visitor_id);
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer"
              >
                <LogOutIcon className="w-4 h-4" />
                <span>Check Out Visitor</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
