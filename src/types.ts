export type Role = 'admin' | 'resident' | 'security';
export type ResidentRole = 'Owner' | 'Tenant';
export type ResidentStatus = 'Active' | 'Inactive';

export type FinanceType = 'Income' | 'Expense' | 'Maintenance' | 'Fine';
export type PaymentMode = 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Card' | 'Online' | 'Other';
export type PaymentStatus = 'Paid' | 'Pending' | 'Overdue' | 'Failed';

export interface Finance {
  id?: string;
  finance_id: string;
  maintenance_id?: string;
  resident_id?: string;
  finance_type: FinanceType;
  category: string;
  description: string;
  amount: number;
  payment_mode: PaymentMode;
  payment_status: PaymentStatus;
  transaction_date: string;
  party_name?: string;
  reference_number?: string;
  society_id: string;
  created_at?: string;
}

export interface Resident {
  id?: string;
  resident_id: string;
  tenant_id?: string | null;
  name: string;
  tower: string;
  wing?: string;
  floor: number;
  flat: string;
  flat_number?: string;
  email?: string;
  phone: string;
  password?: string;
  society_id: string;
  role?: ResidentRole | Role;
  occupancy_type?: ResidentRole;
  owner_id?: string | null;
  owner_name?: string;
  owner_phone?: string;
  status?: ResidentStatus;
  profile_photo?: string;
  avatar?: string;
  bhk?: string;
  flat_type?: string;
  square_feet?: number;
  possession_date?: string;
  family_members?: number | string;
  permanent_address?: string;
  move_in_date?: string;
  expected_move_out_date?: string;
}

export type DocumentStatus = 'Not Uploaded' | 'Uploaded' | 'Under Review' | 'Verified' | 'Rejected';

export interface ResidentDocument {
  id: string;
  resident_id: string;
  society_id: string;
  document_type: string;
  document_name: string;
  purpose: string;
  file_path?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  status: DocumentStatus;
  uploaded_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  deposit_amount?: number;
  deposit_date?: string;
  deposit_ref?: string;
  created_at?: string;
  updated_at?: string;
}

export type MaintenanceCalcMethod = 'Flat/BHK Maintenance' | 'Square Foot Maintenance';

export interface MaintenanceRateConfig {
  flatTypeRates: {
    'Smart 1 BHK': number;
    'Smart 2 BHK': number;
    'Premium 2 BHK': number;
    'Premium 3 BHK': number;
    [key: string]: number;
  };
  sqftRate: number;
}

export interface Security {
  id: string;
  security_id: string;
  name: string;
  phone: string;
  password?: string;
  society_id: string;
  role: 'security';
  shift?: string;
  email?: string;
  status?: string;
}

export type SecurityUser = Security;

export interface Visitor {
  visitor_id?: number | string;
  id?: number | string;
  visitor_name: string;
  visitor_mobile: string;
  visitor_type?: string;
  vehicle_number?: string;
  profile_photo?: string;
  resident_id: string;
  resident_name?: string;
  tower?: string;
  floor?: number;
  flat?: string;
  purpose: string;
  entry_time?: string;
  exit_time?: string;
  status: 'Pending' | 'Approved' | 'Inside' | 'Exited' | 'Rejected';
  security_id?: string;
  security_user_name?: string;
  security_user_shift?: string;
  approval_status?: 'Pending' | 'Approved' | 'Rejected';
  approval_time?: string;
  created_at?: string;
}

export interface MaintenanceRecord {
  id?: string;
  maintenance_id: string;
  bill_no?: string;
  resident_id: string;
  resident_name?: string;
  flat_no: string;
  tower: string;
  month: string;
  amount: number;
  status: string;
  due_date: string;
  society_id: string;
  admin_id?: string;
  payment_date?: string | null;
  payment_method?: string;
  transaction_id?: string;
  late_fee?: number;
  total_paid?: number;
  generated_by?: string;
  created_at?: string;
}

export interface Complaint {
  id?: string;
  complaint_id: string;
  resident_id: string;
  resident_name?: string;
  tower: string;
  flat_no: string | number;
  complaint_date: string;
  category?: string;
  description: string;
  status: string;
  society_id: string;
  admin_id?: string;
  media?: Media[];
  admin_comment?: string;
}

export interface Booking {
  id?: string;
  booking_id: string;
  resident_id: string;
  name: string;
  tower: string;
  flat: string;
  amenity_name: string;
  amenity_type: string;
  event_name: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  time_slot?: string;
  charges: number;
  status: string;
  society_id: string;
  admin_id?: string;
  admin_comment?: string;
  created_at?: string;
}

export interface Amenity {
  id?: string;
  amenity_id: string;
  name: string;
  type?: string;
  charges: number;
  price?: number;
  society_id: string;
  description?: string;
  base_hours?: number;
  extra_hour_charge?: number;
  facilities?: string;
}

export interface Media {
  id?: string;
  media_id: string;
  complaint_id: string;
  file_url: string;
  uploaded_at?: string;
  uploaded_by: string;
  society_id: string;
}

export interface User {
  id: string;
  name: string;
  admin_name?: string;
  email?: string;
  phone: string;
  role: Role;
  occupancy_type?: 'Owner' | 'Tenant';
  tenant_id?: string | null;
  owner_id?: string | null;
  status?: string;
  password?: string;
  resident_id?: string;
  admin_id?: string;
  security_id?: string;
  shift?: string;
  society_id?: string;
  flat?: string;
  tower?: string;
  profile_photo?: string;
  avatar?: string;
}

export interface Admin {
  id: string;
  admin_id: string;
  name: string;
  email?: string;
  phone: string;
  password?: string;
  society_id: string;
  role?: string;
}

export interface Society {
  id?: string;
  society_id: string;
  name: string;
  towers: number;
  floors_per_tower: number;
  flats_per_floor: number;
  admin_email: string;
  phone: string;
  created_at?: string;
}

export type NoticeCategory = 'General' | 'Maintenance' | 'Emergency' | 'Event' | 'Meeting' | 'Rules' | 'Security' | 'Financial';
export type NoticePriority = 'Low' | 'Normal' | 'Important' | 'Urgent';
export type NoticeStatus = 'Active' | 'Draft' | 'Expired' | 'Archived';

export interface Notice {
  id?: string;
  notice_id: string;
  title: string;
  category: NoticeCategory | string;
  priority: NoticePriority | string;
  description: string;
  posted_by: string;
  posted_date: string;
  expiry_date?: string;
  target_audience?: string;
  status: NoticeStatus | string;
  is_pinned?: boolean;
  society_id: string;
  attachment_url?: string;
  attachment_name?: string;
  acknowledgements?: string[];
  created_at?: string;
}

export type CommunicationChannel = 'broadcast' | 'committee' | 'maintenance' | 'general' | 'tower';

export interface Communication {
  id?: string;
  message_id: string;
  channel: CommunicationChannel | string;
  sender_id: string;
  sender_name: string;
  sender_role: Role | ResidentRole | string;
  sender_tower?: string;
  sender_flat?: string;
  recipient_id?: string;
  recipient_name?: string;
  title?: string;
  content: string;
  attachment_url?: string;
  attachment_name?: string;
  society_id: string;
  is_announcement?: boolean;
  created_at: string;
}

