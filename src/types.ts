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
  society_id?: string;
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
  admin_role?: string;
  security_id?: string;
  shift?: string;
  society_id?: string;
  flat?: string;
  floor?: number;
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
  event_date?: string;
  start_time?: string;
  end_time?: string;
  target_audience?: string;
  status: NoticeStatus | string;
  is_pinned?: boolean;
  society_id: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
  attachment_size?: number;
  acknowledgements?: string[];
  views?: string[];
  views_count?: number;
  publisher_id?: string;
  publisher_role?: string;
  publisher_avatar?: string;
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

export interface SocietyEvent {
  id?: string;
  event_id: string;
  title: string;
  category?: string;
  description?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  organizer?: string;
  posted_by?: string;
  notice_id?: string;
  society_id: string;
  created_at?: string;
}

export interface StaffSalaryRecord {
  id?: string;
  staff_id?: string;
  name?: string;
  staff_name?: string;
  role: string;
  phone?: string;
  salary?: number;
  monthly_salary?: number;
  month: string;
  payment_status: 'Paid' | 'Pending' | 'Processing';
  payment_date?: string;
  payment_mode?: PaymentMode;
  notes?: string;
  society_id?: string;
  basic_salary?: number;
  bonus?: number;
  deductions?: number;
  advance_amount?: number;
  net_salary?: number;
  transaction_reference?: string;
}

export interface ServiceContract {
  id?: string;
  contract_id?: string;
  service_name?: string;
  vendor_name: string;
  service_type?: string;
  vendor_contact?: string;
  contact_person?: string;
  phone?: string;
  billing_cycle?: 'Monthly' | 'Quarterly' | 'Bi-Annual' | 'Annual' | string;
  annual_cost?: number;
  contract_amount?: number;
  start_date: string;
  end_date: string;
  status: 'Active' | 'Expired' | 'Pending Renewal' | 'Under Renewal' | 'Terminated' | string;
  notes?: string;
  society_id?: string;
  gst_number?: string;
  outstanding_amount?: number;
}

export interface FinancialSettings {
  id?: string;
  society_id: string;
  currency: string;
  financial_year_start?: string;
  billing_day: number;
  due_day: number;
  grace_period_days: number;
  late_fee_type: 'fixed' | 'percentage';
  late_fee_amount: number;
  billing_frequency: 'monthly' | 'quarterly' | 'yearly';
  created_at?: string;
  updated_at?: string;
}

export interface MaintenanceRateRule {
  id?: string;
  society_id: string;
  rate_name: string;
  calculation_method: 'per_bhk' | 'per_sqft' | 'hybrid' | 'fixed';
  bhk_rates?: {
    '1 BHK': number;
    '2 BHK': number;
    '3 BHK': number;
    '4 BHK': number;
    [key: string]: number;
  };
  rate_per_sqft?: number;
  base_amount?: number;
  fixed_amount?: number;
  effective_from: string;
  effective_to?: string;
  is_active: boolean;
}

export interface MaintenanceBill {
  id?: string;
  bill_id?: string;
  society_id: string;
  flat_id: string;
  flat_number: string;
  tower?: string;
  resident_name?: string;
  resident_user_id?: string;
  bill_number: string;
  billing_month: string;
  calculation_method?: string;
  bhk_type?: string;
  flat_area?: number;
  rate_per_unit?: number;
  maintenance_amount: number;
  additional_charges?: number;
  previous_balance?: number;
  late_fee?: number;
  discount?: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  due_date: string;
  status: 'draft' | 'generated' | 'unpaid' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled' | string;
  notes?: string;
  created_at?: string;
}

export interface FinancialPayment {
  id?: string;
  society_id: string;
  payment_number: string;
  transaction_reference?: string;
  payer_name?: string;
  payer_user_id?: string;
  flat_id?: string;
  flat_number?: string;
  payment_category: 'maintenance' | 'parking' | 'booking' | 'penalty' | 'donation' | 'other_income' | 'vendor' | 'salary' | 'expense' | 'refund' | string;
  amount: number;
  payment_method: 'upi' | 'cash' | 'bank_transfer' | 'cheque' | 'online' | 'other' | string;
  payment_date: string;
  status: 'pending' | 'successful' | 'failed' | 'refunded' | 'cancelled' | string;
  gateway_name?: string;
  gateway_transaction_id?: string;
  recorded_by?: string;
  remarks?: string;
  created_at?: string;
}

export interface PaymentReceipt {
  id?: string;
  society_id: string;
  receipt_number: string;
  payment_id: string;
  payer_name: string;
  flat_number?: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  payment_category?: string;
  billing_period?: string;
  previous_outstanding?: number;
  remaining_balance?: number;
  receipt_file_url?: string;
  created_at?: string;
}

export interface IncomeEntry {
  id?: string;
  income_number: string;
  society_id: string;
  category: 'maintenance' | 'parking' | 'clubhouse_booking' | 'hall_booking' | 'penalty' | 'interest' | 'donation' | 'festival_contribution' | 'other' | string;
  description: string;
  received_from: string;
  flat_id?: string;
  flat_number?: string;
  amount: number;
  payment_id?: string;
  payment_method: string;
  transaction_reference?: string;
  income_date: string;
  attachment_url?: string;
  recorded_by?: string;
  created_at?: string;
}

export interface ExpenseRecord {
  id?: string;
  expense_number: string;
  society_id: string;
  category_id?: string;
  category_name?: string;
  expense_title: string;
  description: string;
  vendor_name?: string;
  invoice_number?: string;
  amount: number;
  paid_amount?: number;
  expense_date: string;
  due_date?: string;
  payment_method?: string;
  transaction_reference?: string;
  approval_status: 'draft' | 'pending' | 'approved' | 'rejected' | string;
  payment_status: 'unpaid' | 'partially_paid' | 'paid' | string;
  invoice_url?: string;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  remarks?: string;
  created_at?: string;
}

export interface SocietyFund {
  id?: string;
  fund_id?: string;
  society_id: string;
  fund_name: string;
  fund_type: 'general' | 'sinking' | 'repair' | 'reserve' | 'emergency' | 'other' | string;
  opening_balance: number;
  total_contributions?: number;
  interest_earned?: number;
  fund_transfers?: number;
  total_utilization?: number;
  closing_balance?: number;
  is_active?: boolean;
}

export interface FundTransaction {
  id?: string;
  society_id: string;
  fund_id: string;
  fund_name?: string;
  transaction_type: 'contribution' | 'interest' | 'utilization' | 'transfer_in' | 'transfer_out' | 'adjustment' | string;
  amount: number;
  transaction_date: string;
  description: string;
  reference_number?: string;
  related_fund_id?: string;
  recorded_by?: string;
  created_at?: string;
}

export interface BankAccount {
  id?: string;
  society_id: string;
  account_name: string;
  account_type: 'bank' | 'cash' | 'petty_cash' | 'other' | string;
  bank_name?: string;
  account_number_masked?: string;
  ifsc_code?: string;
  opening_balance: number;
  current_balance?: number;
  total_credits?: number;
  total_debits?: number;
  is_active?: boolean;
}

export interface FinancialAuditLog {
  id?: string;
  society_id: string;
  user_id?: string;
  user_role?: string;
  user_name?: string;
  action: string;
  module_name: string;
  record_id?: string;
  old_values?: any;
  new_values?: any;
  reason?: string;
  ip_address?: string;
  created_at?: string;
}


