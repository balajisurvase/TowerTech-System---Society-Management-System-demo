export type VisitorStatus = 'pending' | 'approved' | 'rejected' | 'inside' | 'exited' | 'cancelled';

export type VisitorCategory = 
  | 'guest' 
  | 'delivery' 
  | 'cab' 
  | 'maintenance' 
  | 'vendor' 
  | 'domestic_help' 
  | 'other';

export interface VisitorRecord {
  id: string | number;
  visitor_id: number | string;
  visitor_name: string;
  visitor_mobile: string;
  category: VisitorCategory;
  visitor_type?: string;
  vehicle_number?: string;
  profile_photo?: string;
  resident_id: string;
  resident_name?: string;
  flat_number?: string;
  tower?: string;
  gate_id?: string;
  gate_name?: string;
  purpose: string;
  visitor_count: number;
  expected_duration?: string;
  status: VisitorStatus;
  approval_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  
  // Security guard info
  requested_by?: string;
  security_user_name?: string;
  security_user_mobile?: string;
  security_user_shift?: string;
  
  // Timestamps
  created_at: string;
  approval_time?: string;
  approved_by?: string;
  rejected_time?: string;
  rejected_by?: string;
  entry_time?: string;
  checked_in_by?: string;
  exit_time?: string;
  checked_out_by?: string;

  // Invitation info
  is_invitation?: boolean;
  invitation_code?: string;
  valid_until?: string;
}

export type VisitorEventType = 
  | 'request_created'
  | 'approval_requested'
  | 'approved'
  | 'rejected'
  | 'check_in'
  | 'check_out'
  | 'cancelled'
  | 'expired'
  | 'override';

export interface VisitorEvent {
  id: string;
  visitor_id: string | number;
  visitor_name: string;
  event_type: VisitorEventType;
  performed_by: string;
  performer_role?: 'security' | 'resident' | 'admin';
  event_time: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface VisitorNotification {
  id: string;
  recipient_user_id: string;
  visitor_id: string | number;
  title: string;
  message: string;
  category?: string;
  delivery_status: 'pending' | 'sent' | 'delivered' | 'read';
  created_at: string;
  read_at?: string;
}

export interface VisitorGate {
  id: string;
  society_id: string;
  gate_name: string;
  gate_code: string;
  is_active: boolean;
  created_at?: string;
}

export interface FlatWithResident {
  flat_id: string;
  flat_number: string;
  tower: string;
  floor: number;
  resident_id: string;
  resident_name: string;
  phone: string;
  role: string;
  occupancy_type: string;
}

export interface VisitorInvitation {
  id: string;
  invitation_code: string;
  visitor_name: string;
  visitor_mobile: string;
  category: VisitorCategory;
  resident_id: string;
  resident_name: string;
  flat_number: string;
  tower: string;
  expected_date: string;
  expected_time: string;
  valid_until: string;
  visitor_count: number;
  purpose: string;
  vehicle_number?: string;
  status: 'active' | 'used' | 'cancelled' | 'expired';
  created_at: string;
  qr_token: string;
}
