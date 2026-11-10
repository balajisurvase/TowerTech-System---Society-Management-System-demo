import React from 'react';
import { 
  User, 
  Phone, 
  Building2, 
  Car, 
  Users, 
  Clock, 
  LogIn, 
  LogOut as LogOutIcon, 
  Eye, 
  CheckCircle2, 
  XCircle,
  Shield
} from 'lucide-react';
import { VisitorRecord } from '../types/visitor';
import VisitorStatusBadge from './VisitorStatusBadge';
import { format } from 'date-fns';

interface VisitorCardProps {
  key?: React.Key;
  visitor: VisitorRecord;
  userRole?: string;
  onViewDetails: (visitor: VisitorRecord) => void;
  onCheckIn?: (visitorId: number | string) => void;
  onCheckOut?: (visitorId: number | string) => void;
  onApprove?: (visitor: VisitorRecord) => void;
  onReject?: (visitor: VisitorRecord) => void;
}

export default function VisitorCard({
  visitor,
  userRole,
  onViewDetails,
  onCheckIn,
  onCheckOut,
  onApprove,
  onReject
}: VisitorCardProps) {
  const isSecurity = userRole === 'security';
  const isResident = userRole === 'resident' || !userRole || userRole === 'owner' || userRole === 'tenant';

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    try {
      return format(new Date(timeStr), 'hh:mm a');
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-150 p-5 flex flex-col justify-between gap-4 relative group">
      {/* Top Header: Badge & Category */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {visitor.profile_photo ? (
            <img
              src={visitor.profile_photo}
              alt={visitor.visitor_name}
              className="w-11 h-11 rounded-xl object-cover border border-purple-200 shadow-2xs shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-[#6339CA] flex items-center justify-center font-black text-sm shrink-0 border border-purple-100 shadow-2xs">
              {visitor.visitor_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h4 className="text-base font-black text-slate-900 leading-tight group-hover:text-[#6339CA] transition-colors">
              {visitor.visitor_name}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                {visitor.category.replace('_', ' ')}
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-500">
                {visitor.visitor_mobile || 'No Phone'}
              </span>
            </div>
          </div>
        </div>

        <VisitorStatusBadge status={visitor.status} size="sm" />
      </div>

      {/* Middle Details Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Visiting Flat</span>
          <span className="font-black text-slate-900 font-mono mt-0.5 block truncate">
            {visitor.flat_number} (T-{visitor.tower})
          </span>
          <span className="text-[11px] font-medium text-slate-500 block truncate">
            {visitor.resident_name || 'Resident'}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Purpose</span>
          <span className="font-bold text-slate-800 mt-0.5 block truncate" title={visitor.purpose}>
            {visitor.purpose}
          </span>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
            <span>{visitor.visitor_count || 1} guest(s)</span>
            {visitor.vehicle_number && (
              <>
                <span>•</span>
                <span className="font-mono font-bold text-purple-700 truncate">{visitor.vehicle_number}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Timing & Action Buttons */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="text-[11px] font-medium text-slate-400">
          {visitor.status === 'inside' && visitor.entry_time ? (
            <span className="text-blue-600 font-bold flex items-center gap-1">
              <LogIn className="w-3.5 h-3.5" />
              <span>In at {formatTime(visitor.entry_time)}</span>
            </span>
          ) : visitor.status === 'exited' && visitor.exit_time ? (
            <span className="text-slate-500 font-bold flex items-center gap-1">
              <LogOutIcon className="w-3.5 h-3.5" />
              <span>Out at {formatTime(visitor.exit_time)}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(visitor.created_at)}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onViewDetails(visitor)}
            className="p-2 rounded-xl text-slate-500 hover:text-[#6339CA] hover:bg-purple-50 transition-colors cursor-pointer border border-slate-200"
            title="View Full Details"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Security Actions */}
          {isSecurity && visitor.status === 'approved' && onCheckIn && (
            <button
              type="button"
              onClick={() => onCheckIn(visitor.visitor_id)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Check In</span>
            </button>
          )}

          {isSecurity && visitor.status === 'inside' && onCheckOut && (
            <button
              type="button"
              onClick={() => onCheckOut(visitor.visitor_id)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <LogOutIcon className="w-3.5 h-3.5" />
              <span>Check Out</span>
            </button>
          )}

          {/* Resident Pending Actions */}
          {isResident && visitor.status === 'pending' && (
            <div className="flex items-center gap-1">
              {onApprove && (
                <button
                  type="button"
                  onClick={() => onApprove(visitor)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>
              )}
              {onReject && (
                <button
                  type="button"
                  onClick={() => onReject(visitor)}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black text-xs uppercase tracking-wider cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
