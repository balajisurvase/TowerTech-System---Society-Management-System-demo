import React from 'react';
import { User, Resident } from '../types';
import SecurityVisitors from '../modules/visitors/pages/SecurityVisitors';
import AdminVisitors from '../modules/visitors/pages/AdminVisitors';
import ResidentVisitors from '../modules/visitors/pages/ResidentVisitors';

interface SecurityDashboardProps {
  user: User;
  residents: Resident[];
  onLogout?: () => void;
  onUserUpdate?: (updatedUser: Partial<User>) => void;
}

/**
 * SecurityDashboard routes dynamically to the dedicated role dashboard:
 * - Security Guard: Gate operations, dynamic flat selection, check-in, check-out
 * - Admin/Secretary: Society-wide visitor stats, live gate activity, analytics & CSV export
 * - Resident: Pending approvals, digital visitor QR passes, currently inside & history
 */
export default function SecurityDashboard({ user, residents, onLogout }: SecurityDashboardProps) {
  const isSecurityRole = user.role === 'security';
  const isAdminRole = user.role === 'admin' || !!user.admin_id;

  if (isSecurityRole) {
    return <SecurityVisitors user={user} residents={residents} onLogout={onLogout} />;
  }

  if (isAdminRole) {
    return <AdminVisitors user={user} residents={residents} />;
  }

  return <ResidentVisitors user={user} />;
}
