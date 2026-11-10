import React from 'react';
import { VisitorStatus } from '../types/visitor';
import { Clock, CheckCircle2, XCircle, LogIn, LogOut as LogOutIcon, AlertCircle } from 'lucide-react';

interface VisitorStatusBadgeProps {
  status: VisitorStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export default function VisitorStatusBadge({ status, size = 'md' }: VisitorStatusBadgeProps) {
  const normalized = (status || 'pending').toLowerCase() as VisitorStatus;

  // Status colors as strictly specified:
  // PENDING = Orange, APPROVED = Green, REJECTED = Red, INSIDE = Blue, EXITED = Grey, CANCELLED = Red, EXPIRED = Grey
  let config = {
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    icon: Clock,
    label: 'PENDING'
  };

  if (normalized === 'approved') {
    config = {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      icon: CheckCircle2,
      label: 'APPROVED'
    };
  } else if (normalized === 'inside') {
    config = {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500',
      icon: LogIn,
      label: 'INSIDE'
    };
  } else if (normalized === 'exited') {
    config = {
      bg: 'bg-slate-100 text-slate-600 border-slate-200',
      dot: 'bg-slate-400',
      icon: LogOutIcon,
      label: 'EXITED'
    };
  } else if (normalized === 'rejected') {
    config = {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
      icon: XCircle,
      label: 'REJECTED'
    };
  } else if (normalized === 'cancelled') {
    config = {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
      icon: AlertCircle,
      label: 'CANCELLED'
    };
  }

  const Icon = config.icon;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : size === 'lg' ? 'px-3.5 py-1.5 text-xs font-black' : 'px-2.5 py-1 text-[11px]';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-black uppercase tracking-wider border shadow-2xs ${config.bg} ${padding}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </span>
  );
}
