import { useState, useEffect, type FormEvent } from 'react';
import { 
  Users, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle,
  Search,
  MessageSquare,
  Calendar,
  Check,
  X,
  Clock,
  ExternalLink,
  Plus,
  Edit,
  Eye,
  EyeOff,
  Trash2,
  Image as ImageIcon,
  User as UserIcon,
  Filter,
  Star,
  Play,
  CheckCircle,
  ArrowRight,
  Building2,
  Send,
  XCircle,
  UserPlus,
  FileText,
  Settings,
  ChevronRight,
  Settings2,
  CheckSquare,
  RefreshCw,
  Ban
} from 'lucide-react';
import { User, Resident, MaintenanceRecord, Complaint, Booking, Amenity, Admin } from '../types';
import { societyService } from '../lib/societyService';
import { isSupabaseConfigured } from '../lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import FinanceDashboard from './FinanceDashboard';
import NoticeBoard from './NoticeBoard';
import CommunicationCenter from './CommunicationCenter';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface AdminDashboardProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  residents: Resident[];
  maintenance: MaintenanceRecord[];
  complaints: Complaint[];
  bookings: Booking[];
  onRefresh: () => void;
  onUserUpdate?: (updatedUser: Partial<User>) => void;
}

export default function AdminDashboard({ 
  user, 
  activeTab, 
  setActiveTab,
  residents, 
  maintenance, 
  complaints, 
  bookings,
  onRefresh,
  onUserUpdate 
}: AdminDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [successPopup, setSuccessPopup] = useState<string | null>(null);
  const [errorPopup, setErrorPopup] = useState<string | null>(null);
  const [maintenanceFilter, setMaintenanceFilter] = useState<'All' | 'Paid' | 'Unpaid'>('All');
  const [maintenanceTowerFilter, setMaintenanceTowerFilter] = useState('All');
  const [maintenanceFloorFilter, setMaintenanceFloorFilter] = useState('All');
  const [maintenanceFlatFilter, setMaintenanceFlatFilter] = useState('All');
  
  const getMonthYear = (date: Date) => {
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  // Use actual current month (April 2026)
  const baseDate = new Date();
  baseDate.setDate(1); 

  const currentMonth = getMonthYear(baseDate);
  
  const lastMonthDate = new Date(baseDate);
  lastMonthDate.setDate(1);
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonth = getMonthYear(lastMonthDate);
  
  const nextMonthDate = new Date(baseDate);
  nextMonthDate.setDate(1);
  nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
  const nextMonth = getMonthYear(nextMonthDate);

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  
  const [residentTowerFilter, setResidentTowerFilter] = useState('All');
  const [residentFloorFilter, setResidentFloorFilter] = useState('All');
  const [residentFlatFilter, setResidentFlatFilter] = useState('All');

  const [complaintFilter, setComplaintFilter] = useState<'All' | 'Pending' | 'Process' | 'Done' | 'Rejected'>('All');
  const [bookingFilter, setBookingFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);
  const [showBillForm, setShowBillForm] = useState(false);
  const [showBillSuccessModal, setShowBillSuccessModal] = useState(false);
  const [showAmenityForm, setShowAmenityForm] = useState(false);
  const [showBookingEditModal, setShowBookingEditModal] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [showEditResidentModal, setShowEditResidentModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [complaintToComment, setComplaintToComment] = useState<{ id: string, status: 'Pending' | 'Done' | 'Rejected' | 'Process' } | null>(null);
  const [adminComment, setAdminComment] = useState('');
  const [selectedResidentDetails, setSelectedResidentDetails] = useState<Resident | null>(null);
  const [bookingEditData, setBookingEditData] = useState({
    start_time: '',
    end_time: ''
  });
  const [residentEditData, setResidentEditData] = useState({
    resident_id: '',
    name: '',
    tower: '',
    floor: 0,
    flat: '',
    phone: '',
    email: '',
    password: '',
    role: 'Owner' as 'Owner' | 'Tenant',
    occupancy_type: 'Owner' as 'Owner' | 'Tenant',
    tenant_id: '' as string | null,
    owner_id: '' as string | null,
    status: 'Active' as 'Active' | 'Inactive',
    bhk: '2 BHK',
    flat_type: 'Smart 2 BHK',
    square_feet: 620
  });

  const [calcMethod, setCalcMethod] = useState<'Flat/BHK Maintenance' | 'Square Foot Maintenance'>('Square Foot Maintenance');
  const [flatTypeRates, setFlatTypeRates] = useState<Record<string, number>>({
    'Smart 1 BHK': 2500,
    'Smart 2 BHK': 3200,
    'Premium 2 BHK': 4000,
    'Premium 3 BHK': 5000
  });
  const [sqftRate, setSqftRate] = useState<number>(5);

  const getNextTenantId = () => {
    let maxT = 0;
    (residents || []).forEach(r => {
      const tid = r.tenant_id;
      if (tid && /^T\d+$/i.test(tid)) {
        const num = parseInt(tid.replace(/^T/i, ''), 10);
        if (!isNaN(num) && num > maxT) maxT = num;
      }
    });
    return `T${String(maxT + 1).padStart(3, '0')}`;
  };
  const [billFormData, setBillFormData] = useState({
    resident_id: 'all',
    month: baseDate.toLocaleString('default', { month: 'long' }),
    year: baseDate.getFullYear().toString(),
    amount: 3100,
    due_date: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
    description: 'Monthly Maintenance'
  });
  const [amenityFormData, setAmenityFormData] = useState({
    name: '',
    price: 0,
    description: '',
    base_hours: 4,
    extra_hour_charge: 0,
    facilities: ''
  });

  const fetchAmenities = async () => {
    try {
      const data = await societyService.getAmenities(user.society_id);
      setAmenities(data);
      setDbError(null);
    } catch (error: unknown) {
      // PGRST205: PostgREST error for table not found in schema cache
      // 42P01: Postgres error for table not found
      const errCode = (error as { code?: string })?.code;
      if (errCode === '42P01' || errCode === 'PGRST205') {
        setDbError('The "amenities" table is missing from your database.');
      } else {
        console.error('Error fetching amenities:', error);
      }
    }
  };

  useEffect(() => {
    fetchAmenities();
  }, [user.society_id]);

  // Calculate Statistics for Selected Month
  const maintenanceForMonth = (selectedMonth === 'All' ? maintenance : maintenance.filter(m => m.month === selectedMonth)) || [];
  const totalResidentsCount = residents?.length || 0;
  const paidMaintenanceCount = maintenanceForMonth.filter(m => m.status === 'Paid').length;
  const unpaidMaintenanceCount = maintenanceForMonth.filter(m => m.status === 'Unpaid').length;
  const totalComplaints = complaints?.length || 0;
  const pendingComplaints = (complaints || []).filter(c => c.status === 'Pending').length;
  const doneComplaints = (complaints || []).filter(c => c.status === 'Done' || c.status === 'Resolved').length;
  const rejectedComplaints = (complaints || []).filter(c => c.status === 'Rejected').length;
  
  const totalBookings = bookings?.length || 0;
  const totalCollectionAmount = maintenanceForMonth
    .filter(m => m.status === 'Paid')
    .reduce((sum, m) => sum + m.amount, 0);
  const totalPendingAmount = maintenanceForMonth
    .filter(m => m.status === 'Unpaid')
    .reduce((sum, m) => sum + m.amount, 0);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [adminProfileData, setAdminProfileData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || ''
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isNew = (dateStr?: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return diff < 24 * 60 * 60 * 1000; // 24 hours
  };

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setUpdating('profile');
    try {
      await societyService.updateAdminProfile(user.society_id, user.admin_id!, adminProfileData);
      toast.success('Profile updated successfully');
      setShowEditProfileModal(false);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      toast.error(msg);
    } finally {
      setUpdating(null);
    }
  };

  const stats = [
    { label: 'Total Residents', value: totalResidentsCount, icon: Users, color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-200', trend: '+12%', trendUp: true },
    { label: 'Paid Maintenance', value: paidMaintenanceCount, icon: CheckCircle2, color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-200', trend: '+5%', trendUp: true },
    { label: 'Unpaid Maintenance', value: unpaidMaintenanceCount, icon: AlertCircle, color: 'from-rose-500 to-orange-600', shadow: 'shadow-rose-200', trend: '-2%', trendUp: false },
    { label: 'Total Complaints', value: totalComplaints, icon: MessageSquare, color: 'from-purple-500 to-indigo-600', shadow: 'shadow-purple-200', trend: '+8%', trendUp: true },
    { label: 'Total Bookings', value: totalBookings, icon: Calendar, color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-200', trend: '+15%', trendUp: true },
    { label: 'Total Collection', value: `₹${totalCollectionAmount.toLocaleString()}`, icon: CreditCard, color: 'from-cyan-500 to-blue-600', shadow: 'shadow-cyan-200', trend: '+10%', trendUp: true },
  ];

  const formatTime = (time?: string) => {
    if (!time) return 'N/A';
    try {
      const [hours, minutes] = time.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  const handleUpdateMaintenanceStatus = async (maintenanceId: string, status: 'Paid' | 'Unpaid') => {
    setUpdating(maintenanceId);
    try {
      await societyService.updateMaintenanceStatus(maintenanceId, status);
      onRefresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error('Update failed: ' + msg);
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteMaintenance = async (maintenanceId: string) => {
    if (!globalThis.confirm?.('Are you sure you want to delete this maintenance record?')) return;
    setUpdating(maintenanceId);
    try {
      await societyService.deleteMaintenanceRecord(maintenanceId);
      onRefresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error('Delete failed: ' + msg);
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdateComplaintStatus = async (complaintId: string, status: 'Pending' | 'Done' | 'Rejected' | 'Process', comment?: string) => {
    setUpdating(complaintId);
    try {
      await societyService.updateComplaintStatus(complaintId, status, comment);
      setComplaintToComment(null);
      setAdminComment('');
      onRefresh();
      toast.success(`Complaint marked as ${status}`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error('Update failed: ' + msg);
    } finally {
      setUpdating(null);
    }
  };

  const [bookingToComment, setBookingToComment] = useState<{ id: string, status: 'Approved' | 'Rejected' } | null>(null);
  const [bookingComment, setBookingComment] = useState('');

  const handleUpdateBookingStatus = async (bookingId: string, status: 'Approved' | 'Rejected' | 'Pending', comment?: string) => {
    setUpdating(bookingId);
    try {
      await societyService.updateBookingStatus(bookingId, status, comment);
      onRefresh();
      toast.success(`Booking ${status}`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error('Update failed: ' + msg);
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdateBookingTimes = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;

    setUpdating(editingBooking.booking_id || editingBooking.id!);
    try {
      await societyService.updateBooking(editingBooking.booking_id || editingBooking.id!, {
        start_time: bookingEditData.start_time,
        end_time: bookingEditData.end_time
      });
      toast.success('Booking times updated successfully!');
      setShowBookingEditModal(false);
      onRefresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error('Update failed: ' + msg);
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!globalThis.confirm?.('Are you sure you want to delete this booking?')) return;
    
    setUpdating(id);
    try {
      await societyService.deleteBooking(id);
      toast.success(`Booking ${id} deleted successfully`);
      onRefresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error('Delete failed: ' + msg);
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteResident = async (residentId: string) => {
    if (!globalThis.confirm?.('Are you sure you want to delete this resident?')) return;
    
    setUpdating(residentId);
    try {
      await societyService.deleteResident(residentId);
      toast.success(`Resident ${residentId} deleted successfully`);
      onRefresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error('Delete failed: ' + msg);
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteComplaint = async (id: string) => {
    if (!globalThis.confirm?.('Are you sure you want to delete this complaint?')) return;
    
    setUpdating(id);
    try {
      await societyService.deleteComplaint(id);
      toast.success(`Complaint ${id} deleted successfully`);
      onRefresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error('Delete failed: ' + msg);
    } finally {
      setUpdating(null);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    setUpdating('changing-password');
    try {
      // In a real app, we'd verify old password first. 
      // For this prototype, we'll just update it.
      await societyService.updateAdminProfile(user.society_id!, user.admin_id!, {
        password: passwordData.newPassword
      });
      toast.success('Password changed successfully');
      setShowChangePasswordModal(false);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error('Failed to change password: ' + msg);
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteAllResidents = async () => {
    if (!globalThis.confirm?.('CRITICAL: Are you sure you want to delete ALL residents? This cannot be undone.')) return;
    setUpdating('delete-all');
    try {
      await societyService.deleteAllResidents(user.society_id!);
      toast.success('All residents deleted successfully');
      onRefresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error('Delete failed: ' + msg);
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteAllComplaints = async () => {
    if (!globalThis.confirm?.('CRITICAL: Are you sure you want to delete ALL complaints? This cannot be undone.')) return;
    setUpdating('delete-all');
    try {
      await societyService.deleteAllComplaints(user.society_id!);
      toast.success('All complaints deleted successfully');
      onRefresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error('Delete failed: ' + msg);
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteAllBookings = async () => {
    if (!globalThis.confirm?.('CRITICAL: Are you sure you want to delete ALL bookings? This cannot be undone.')) return;
    setUpdating('delete-all');
    try {
      await societyService.deleteAllBookings(user.society_id!);
      toast.success('All bookings deleted successfully');
      onRefresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error('Delete failed: ' + msg);
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdateResident = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validation
    const role = (residentEditData.role || residentEditData.occupancy_type || 'Owner') as 'Owner' | 'Tenant';
    if (role === 'Tenant' && !residentEditData.owner_id) {
      toast.error('Please select a valid owner for this tenant.');
      return;
    }

    // Do NOT generate a new tenant ID when editing an existing tenant (Requirement 12)
    const assignedTenantId = role === 'Tenant'
      ? (editingResident?.tenant_id || residentEditData.tenant_id || getNextTenantId())
      : null;

    const payload: Partial<Resident> = {
      ...residentEditData,
      role: role,
      occupancy_type: role,
      tenant_id: assignedTenantId,
      owner_id: role === 'Owner' ? null : (residentEditData.owner_id || null),
      status: residentEditData.status || 'Active'
    };

    setUpdating('updating-resident');
    try {
      if (editingResident) {
        await societyService.updateResident(editingResident.resident_id, payload);
        toast.success('Resident profile updated successfully!');
      } else {
        await societyService.addResident({ ...payload, society_id: user.society_id } as any);
        toast.success(`${role} added successfully!`);
      }
      setShowEditResidentModal(false);
      onRefresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error('Operation failed: ' + msg);
    } finally {
      setUpdating(null);
    }
  };

  const handleCreateMaintenanceBill = async (e: FormEvent) => {
    e.preventDefault();
    
    if (residents.length === 0) {
      toast.error('No residents found to generate bills for.');
      return;
    }

    setUpdating('generating-bill');
    try {
      const fullMonth = `${billFormData.month} ${billFormData.year}`;
      
      const getResidentBillAmount = (r: Resident) => {
        const flatType = r.flat_type || (r.bhk ? (r.bhk === '1 BHK' ? 'Smart 1 BHK' : r.bhk === '3 BHK' ? 'Premium 3 BHK' : 'Smart 2 BHK') : 'Smart 2 BHK');
        const sqft = r.square_feet || (flatType === 'Smart 1 BHK' ? 520 : flatType === 'Premium 2 BHK' ? 720 : flatType === 'Premium 3 BHK' ? 920 : 620);
        
        if (calcMethod === 'Square Foot Maintenance') {
          return Math.round(sqft * (sqftRate || 5));
        } else {
          return flatTypeRates[flatType] || flatTypeRates['Smart 2 BHK'] || 3200;
        }
      };

      let targetResidents = [];
      if (billFormData.resident_id === 'all') {
        targetResidents = residents;
      } else if (billFormData.resident_id.startsWith('tower-')) {
        const tower = billFormData.resident_id.split('-')[1];
        targetResidents = residents.filter(r => r.tower === tower);
      }

      if (targetResidents.length > 0) {
        // Generate bills for multiple residents using bulk insert with calculated amounts
        const bills = targetResidents.map(resident => ({
          resident_id: resident.resident_id,
          resident_name: resident.name,
          flat_no: resident.flat,
          tower: resident.tower,
          month: fullMonth,
          amount: getResidentBillAmount(resident),
          status: 'Unpaid' as const,
          due_date: billFormData.due_date,
          society_id: user.society_id,
          admin_id: user.admin_id,
          generated_by: 'Admin'
        }));

        await societyService.createBulkMaintenanceBills(bills);
        toast.success(`Maintenance bills generated successfully for ${targetResidents.length} residents!`);
      } else {
        // Generate bill for a SPECIFIC resident
        const resident = residents.find(r => r.resident_id === billFormData.resident_id);
        if (!resident) throw new Error('Resident not found');

        const finalAmount = billFormData.amount || getResidentBillAmount(resident);

        await societyService.createMaintenanceBill({
          resident_id: resident.resident_id,
          resident_name: resident.name,
          flat_no: resident.flat,
          tower: resident.tower,
          month: fullMonth,
          amount: finalAmount,
          status: 'Unpaid',
          due_date: billFormData.due_date,
          society_id: user.society_id,
          admin_id: user.admin_id,
          generated_by: 'Admin'
        });
        toast.success(`Maintenance bill generated successfully for ${resident.name}!`);
      }
      
      setShowBillForm(false);
      setShowBillSuccessModal(true);
      onRefresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error('Failed to generate bill(s): ' + msg);
    } finally {
      setUpdating(null);
    }
  };

  const handleAddAmenity = async (e: FormEvent) => {
    e.preventDefault();
    setUpdating('adding-amenity');
    try {
      // Check if amenity already exists
      const existingAmenity = amenities.find(a => a.name === amenityFormData.name);
      
      if (existingAmenity) {
        // Update existing amenity
        await societyService.updateAmenity(existingAmenity.amenity_id, {
          price: amenityFormData.price,
          base_hours: amenityFormData.base_hours,
          extra_hour_charge: amenityFormData.extra_hour_charge,
          facilities: amenityFormData.facilities
        });
        toast.success('Amenity updated successfully!');
      } else {
        // Add new amenity
        await societyService.addAmenity({
          name: amenityFormData.name,
          price: amenityFormData.price,
          charges: amenityFormData.price,
          description: amenityFormData.description,
          base_hours: amenityFormData.base_hours,
          extra_hour_charge: amenityFormData.extra_hour_charge,
          facilities: amenityFormData.facilities,
          society_id: user.society_id
        });
        toast.success('Amenity added successfully!');
      }
      
      setShowAmenityForm(false);
      setAmenityFormData({ 
        name: '', 
        price: 0, 
        description: '', 
        base_hours: 4,
        extra_hour_charge: 0,
        facilities: ''
      });
      fetchAmenities();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error('Failed to update amenity: ' + msg);
    } finally {
      setUpdating(null);
    }
  };

  const filteredResidents = (residents || [])
    .filter(r => {
      const matchesSearch = String(r.resident_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          String(r.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTower = residentTowerFilter === 'All' || r.tower === residentTowerFilter;
      const matchesFloor = residentFloorFilter === 'All' || r.floor.toString() === residentFloorFilter;
      const matchesFlat = residentFlatFilter === 'All' || r.flat === residentFlatFilter;
      
      return matchesSearch && matchesTower && matchesFloor && matchesFlat;
    })
    .sort((a, b) => {
      // Sort by Tower primarily
      const towerCompare = String(a.tower || '').localeCompare(String(b.tower || ''));
      if (towerCompare !== 0) return towerCompare;
      
      // Then by Floor
      const floorA = a.floor || 0;
      const floorB = b.floor || 0;
      if (floorA !== floorB) return floorA - floorB;
      
      // Then by Flat
      return String(a.flat || '').localeCompare(String(b.flat || ''), undefined, { numeric: true, sensitivity: 'base' });
    });

  const filteredMaintenance = (maintenance || [])
    .filter(m => {
      const matchesSearch = String(m.resident_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          String(m.resident_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          String(m.flat_no || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMonth = selectedMonth === 'All' || m.month === selectedMonth;
      const matchesStatus = maintenanceFilter === 'All' || m.status === maintenanceFilter;
      const matchesTower = maintenanceTowerFilter === 'All' || m.tower === maintenanceTowerFilter;
      const matchesFlat = maintenanceFlatFilter === 'All' || m.flat_no === maintenanceFlatFilter;
      
      return matchesSearch && matchesMonth && matchesStatus && matchesTower && matchesFlat;
    })
    .sort((a, b) => {
      // Sort by Tower primarily
      const towerA = String(a.tower || '');
      const towerB = String(b.tower || '');
      const towerCompare = towerA.localeCompare(towerB);
      if (towerCompare !== 0) return towerCompare;

      // Then by Flat
      const flatA = String(a.flat_no || '');
      const flatB = String(b.flat_no || '');
      const flatCompare = flatA.localeCompare(flatB, undefined, { numeric: true, sensitivity: 'base' });
      if (flatCompare !== 0) return flatCompare;
      
      // Then by Resident ID
      const resIdA = String(a.resident_id || '');
      const resIdB = String(b.resident_id || '');
      return resIdA.localeCompare(resIdB, undefined, { numeric: true, sensitivity: 'base' });
    });

  const filteredComplaints = (complaints || [])
    .filter(c => {
      const matchesSearch = String(c.resident_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          String(c.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          String(c.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          String(c.complaint_id || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = complaintFilter === 'All' ? true : 
                           (complaintFilter === 'Done' ? (c.status === 'Done' || c.status === 'Resolved') : c.status === complaintFilter);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const idA = String(a.complaint_id || a.id || '');
      const idB = String(b.complaint_id || b.id || '');
      const idCompare = idB.localeCompare(idA, undefined, { numeric: true });
      if (idCompare !== 0) return idCompare;

      const dateA = new Date(a.complaint_date || 0).getTime();
      const dateB = new Date(b.complaint_date || 0).getTime();
      return dateB - dateA;
    });

  const filteredBookings = (bookings || [])
    .filter(b => {
      const matchesSearch = String(b.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          String(b.amenity_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          String(b.event_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          String(b.booking_id || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = bookingFilter === 'All' ? true : b.status === bookingFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const idA = String(a.booking_id || a.id || '');
      const idB = String(b.booking_id || b.id || '');
      const idCompare = idB.localeCompare(idA, undefined, { numeric: true });
      if (idCompare !== 0) return idCompare;

      const dateA = new Date(a.created_at || a.booking_date || 0).getTime();
      const dateB = new Date(b.created_at || b.booking_date || 0).getTime();
      return dateB - dateA;
    });

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileFormData, setProfileFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setProfileFormData(prev => ({
        ...prev,
        name: String(user.name || ''),
        phone: String(user.phone || ''),
        email: String(user.email || ''),
      }));
    }
  }, [user?.name, user?.phone, user?.email, user?.admin_id, user?.id]);

  useEffect(() => {
    globalThis.scrollTo?.(0, 0);
  }, [activeTab]);

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault();
    const nameStr = String(profileFormData.name || '').trim();
    const phoneStr = String(profileFormData.phone || '').trim();
    const emailStr = String(profileFormData.email || '').trim();

    if (!nameStr) {
      toast.error('Name is required');
      return;
    }
    if (profileFormData.password && profileFormData.password !== profileFormData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (profileFormData.password && profileFormData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setUpdating('updating-profile');
    try {
      const updates: Partial<Admin> = {
        name: nameStr,
        phone: phoneStr,
        email: emailStr,
      };
      if (profileFormData.password) {
        updates.password = profileFormData.password;
      }

      const societyId = user.society_id || 'GV2026';
      const adminId = user.admin_id || user.id || 'A001';
      await societyService.updateAdminProfile(societyId, adminId, updates);

      toast.success('Profile updated successfully');
      setShowProfileModal(false);

      if (onUserUpdate) {
        onUserUpdate({
          name: updates.name,
          phone: updates.phone,
          email: updates.email
        });
      }

      onRefresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error('Failed to update profile: ' + msg);
    } finally {
      setUpdating(null);
    }
  };

  // Notification logic removed as per user request
  
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        const stats = [
          { label: 'Residents', value: totalResidentsCount, icon: Users, color: 'bg-blue-600', tab: 'residents' },
          { label: 'Collection', value: `₹${totalCollectionAmount.toLocaleString()}`, icon: CreditCard, color: 'bg-emerald-600', tab: 'maintenance' },
          { label: 'Pending', value: `₹${totalPendingAmount.toLocaleString()}`, icon: AlertCircle, color: 'bg-orange-600', tab: 'maintenance' },
          { label: 'Total Complaints', value: totalComplaints, icon: MessageSquare, color: 'bg-purple-600', tab: 'complaints' },
          { label: 'Total Bookings', value: totalBookings, icon: Calendar, color: 'bg-amber-600', tab: 'bookings' },
        ];

        const recentComplaints = complaints.slice(0, 5);
        const recentBookings = bookings.slice(0, 5);

        return (
          <div className="flex flex-col gap-6">
            {/* Welcome Card */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-700 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div>
                  <h2 className="text-3xl font-black mb-2 tracking-tight">Welcome, {user.name}</h2>
                  <div className="flex flex-wrap gap-x-8 gap-y-3 mt-4">
                    <div className="flex items-center gap-2.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                      <UserIcon className="w-4 h-4 text-indigo-200" />
                      <span className="text-xs font-black uppercase tracking-widest">Admin ID: {user.admin_id || 'A001'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                      <Star className="w-4 h-4 text-indigo-200" />
                      <span className="text-xs font-black uppercase tracking-widest">Role: Chairman</span>
                    </div>
                    <div className="flex items-center gap-2.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                      <Send className="w-4 h-4 text-indigo-200" />
                      <span className="text-xs font-black uppercase tracking-widest">{user.email || 'admin@gvsociety.com'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                      <Building2 className="w-4 h-4 text-indigo-200" />
                      <span className="text-xs font-black uppercase tracking-widest">Green Park Residency</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {stats.map((stat, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(stat.tab)}
                  className={`${stat.color} p-4 rounded-2xl text-white shadow-sm text-left transition-all hover:scale-[1.02] flex flex-col justify-between h-24`}
                >
                  <div className="flex items-center justify-between">
                    <stat.icon className="w-4 h-4 opacity-80" />
                    <ChevronRight className="w-3 h-3 opacity-50" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-0.5">{stat.label}</p>
                    <h3 className="text-lg font-black leading-none">{stat.value}</h3>
                  </div>
                </button>
              ))}
            </div>

            {/* Tables Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Bookings */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Recent Bookings</h3>
                  <button onClick={() => setActiveTab('bookings')} className="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition-all">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Booking ID</th>
                        <th className="px-6 py-4">Amenity</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {recentBookings.map((b, idx) => (
                        <tr key={b.id || idx} className="hover:bg-slate-50/30 transition-colors text-xs">
                          <td className="px-6 py-4 font-black text-indigo-600">{b.booking_id}</td>
                          <td className="px-6 py-4 font-bold text-slate-800">{b.amenity_name}</td>
                          <td className="px-6 py-4 text-slate-500 font-medium">{format(new Date(b.booking_date), 'dd MMM yyyy')}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full font-black text-[9px] uppercase ${
                              b.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 
                              b.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 
                              'bg-rose-100 text-rose-700'
                            }`}>{b.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Complaints */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Recent Complaints</h3>
                  <button onClick={() => setActiveTab('complaints')} className="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition-all">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Complaint ID</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {recentComplaints.map((c, idx) => (
                        <tr key={c.id || idx} className="hover:bg-slate-50/30 transition-colors text-xs">
                          <td className="px-6 py-4 font-black text-indigo-600">{c.complaint_id}</td>
                          <td className="px-6 py-4 font-bold text-slate-800">{c.category}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full font-black text-[9px] uppercase ${
                              c.status === 'Done' ? 'bg-emerald-100 text-emerald-700' : 
                              c.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 
                              c.status === 'Process' ? 'bg-indigo-100 text-indigo-700' :
                              'bg-rose-100 text-rose-700'
                            }`}>{c.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case 'residents': {
        const towers = Array.from(new Set(residents.map(r => r.tower))).sort();
        const floors = Array.from(new Set(residents.map(r => r.floor.toString()))).sort((a, b) => parseInt(a) - parseInt(b));
        const flats = Array.from(new Set(residents.map(r => r.flat))).sort();

        return (
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col w-full">
            <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3 bg-slate-50/50 shrink-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Resident Directory</h3>
                  <p className="text-xs text-slate-500">Manage and view all registered society members.</p>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by ID, Name, or Flat..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all w-full text-xs font-medium bg-white"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tower</span>
                  <select 
                    value={residentTowerFilter}
                    onChange={(e) => setResidentTowerFilter(e.target.value)}
                    className="bg-transparent outline-none text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="All">All</option>
                    {towers.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Floor</span>
                  <select 
                    value={residentFloorFilter}
                    onChange={(e) => setResidentFloorFilter(e.target.value)}
                    className="bg-transparent outline-none text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="All">All</option>
                    {floors.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Flat</span>
                  <select 
                    value={residentFlatFilter}
                    onChange={(e) => setResidentFlatFilter(e.target.value)}
                    className="bg-transparent outline-none text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="All">All</option>
                    {flats.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setEditingResident(null);
                      setResidentEditData({
                        resident_id: '',
                        name: '',
                        tower: 'A',
                        floor: 1,
                        flat: '101',
                        phone: '',
                        email: '',
                        password: 'resident123',
                        role: 'Owner',
                        occupancy_type: 'Owner',
                        tenant_id: null,
                        owner_id: null,
                        status: 'Active',
                        bhk: '2 BHK',
                        flat_type: 'Smart 2 BHK',
                        square_feet: 620
                      });
                      setShowEditResidentModal(true);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-xs flex items-center gap-1.5 uppercase tracking-wider"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Add Resident
                  </button>
                  <button 
                    onClick={handleDeleteAllResidents}
                    className="px-2.5 py-1.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-xl hover:bg-rose-100 transition-all border border-rose-100 flex items-center gap-1 uppercase tracking-wider"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete All
                  </button>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl uppercase tracking-wider border border-indigo-100">
                    Total: {filteredResidents.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-2.5 py-2.5 whitespace-nowrap">Resident ID</th>
                    <th className="px-2.5 py-2.5">Name</th>
                    <th className="px-2.5 py-2.5">Email</th>
                    <th className="px-2 py-2.5 text-center whitespace-nowrap">Tower</th>
                    <th className="px-2 py-2.5 text-center whitespace-nowrap">Floor</th>
                    <th className="px-2 py-2.5 text-center whitespace-nowrap">Flat</th>
                    <th className="px-2.5 py-2.5 whitespace-nowrap">BHK / Flat Type</th>
                    <th className="px-2 py-2.5 whitespace-nowrap">Role</th>
                    <th className="px-2 py-2.5 whitespace-nowrap">Status</th>
                    <th className="px-2.5 py-2.5 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredResidents.map((r) => {
                    const residentRole = (r.role || r.occupancy_type || 'Owner') as 'Owner' | 'Tenant';
                    const isOwner = residentRole === 'Owner';
                    const flatType = r.flat_type || (r.bhk ? (r.bhk === '1 BHK' ? 'Smart 1 BHK' : r.bhk === '3 BHK' ? 'Premium 3 BHK' : 'Smart 2 BHK') : 'Smart 2 BHK');

                    return (
                      <tr 
                        key={r.resident_id} 
                        className={`transition-colors group ${
                          !isOwner 
                            ? 'bg-purple-50/30 hover:bg-purple-50/60' 
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* 1. Resident ID */}
                        <td className="px-2.5 py-2 whitespace-nowrap font-mono font-bold text-slate-800 text-[11px]">
                          {r.resident_id}
                        </td>

                        {/* 2. Name */}
                        <td className="px-2.5 py-2">
                          <div className="flex items-center gap-2">
                            {r.profile_photo || (r as any).avatar ? (
                              <img 
                                src={r.profile_photo || (r as any).avatar} 
                                alt={r.name} 
                                className={`w-6 h-6 rounded-full object-cover border shrink-0 ${!isOwner ? 'border-purple-400' : 'border-amber-400'}`} 
                              />
                            ) : (
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] border shrink-0 ${
                                !isOwner ? 'bg-purple-600 text-white border-purple-700' : 'bg-amber-100 text-amber-800 border-amber-300'
                              }`}>
                                {r.name ? r.name.charAt(0).toUpperCase() : 'R'}
                              </div>
                            )}
                            <span className={`font-bold truncate max-w-[120px] ${!isOwner ? 'text-purple-950' : 'text-slate-800'}`}>{r.name}</span>
                          </div>
                        </td>

                        {/* 3. Email */}
                        <td className="px-2.5 py-2 font-medium text-slate-500 text-[11px] truncate max-w-[140px]">
                          {r.email || '—'}
                        </td>

                        {/* 4. Tower */}
                        <td className="px-2 py-2 text-center whitespace-nowrap font-semibold text-slate-700">{r.tower}</td>

                        {/* 5. Floor */}
                        <td className="px-2 py-2 text-center whitespace-nowrap font-semibold text-slate-700">{r.floor ?? '—'}</td>

                        {/* 6. Flat */}
                        <td className="px-2 py-2 text-center whitespace-nowrap font-bold text-slate-800">{r.flat}</td>

                        {/* 7. BHK / Flat Type */}
                        <td className="px-2.5 py-2 whitespace-nowrap">
                          <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[10px] inline-block border border-slate-200">
                            {flatType}
                          </span>
                        </td>

                        {/* 8. Role */}
                        <td className="px-2 py-2 whitespace-nowrap">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider inline-block ${
                            isOwner
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-purple-600 text-white'
                          }`}>
                            {residentRole}
                          </span>
                        </td>

                        {/* 9. Status */}
                        <td className="px-2 py-2 whitespace-nowrap">
                          <button 
                            onClick={async () => {
                              const newStatus = r.status === 'Inactive' ? 'Active' : 'Inactive';
                              setUpdating(r.resident_id);
                              try {
                                await societyService.updateResident(r.resident_id, { status: newStatus });
                                toast.success(`${isOwner ? 'Owner' : 'Tenant'} marked as ${newStatus}`);
                                onRefresh();
                              } catch (err: unknown) {
                                const msg = err instanceof Error ? err.message : String(err);
                                toast.error('Failed to update status: ' + msg);
                              } finally {
                                setUpdating(null);
                              }
                            }}
                            className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider border transition-colors ${
                              r.status === 'Inactive' 
                                ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' 
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                            title="Click to toggle status"
                          >
                            {r.status || 'Active'}
                          </button>
                        </td>

                        {/* 10. Actions */}
                        <td className="px-2.5 py-2 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedResidentDetails(r)}
                              className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded border border-slate-200 transition-colors"
                              title="View Resident Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => {
                                setEditingResident(r);
                                const rRole = (r.role || r.occupancy_type || 'Owner') as 'Owner' | 'Tenant';
                                const rBhk = r.bhk || '2 BHK';
                                const rFlatType = r.flat_type || (rBhk === '1 BHK' ? 'Smart 1 BHK' : rBhk === '3 BHK' ? 'Premium 3 BHK' : 'Smart 2 BHK');
                                const rSqft = r.square_feet || (rFlatType === 'Smart 1 BHK' ? 520 : rFlatType === 'Premium 2 BHK' ? 720 : rFlatType === 'Premium 3 BHK' ? 920 : 620);
                                setResidentEditData({
                                  resident_id: r.resident_id,
                                  name: r.name,
                                  tower: r.tower,
                                  floor: r.floor,
                                  flat: r.flat,
                                  phone: r.phone,
                                  email: r.email || '',
                                  password: r.password || 'resident123',
                                  role: rRole,
                                  occupancy_type: rRole,
                                  tenant_id: r.tenant_id || (rRole === 'Tenant' ? 'T001' : null),
                                  owner_id: r.owner_id || null,
                                  status: (r.status || 'Active') as 'Active' | 'Inactive',
                                  bhk: rBhk,
                                  flat_type: rFlatType,
                                  square_feet: rSqft
                                });
                                setShowEditResidentModal(true);
                              }}
                              className="p-1 text-indigo-600 hover:bg-indigo-50 rounded border border-indigo-100"
                              title="Edit Profile"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteResident(r.resident_id)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded border border-rose-100"
                              title="Delete Resident"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredResidents.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <Users className="w-12 h-12 mb-3 opacity-20" />
                          <p className="text-sm font-medium">No residents found matching your filters</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case 'maintenance': {
        return (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Maintenance Management
                </h2>
                <p className="text-xs font-bold text-emerald-600 mt-1">{selectedMonth}</p>
              </div>
              <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto no-scrollbar">
                <button 
                  onClick={() => setSelectedMonth(lastMonth)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                    selectedMonth === lastMonth ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-400 hover:text-emerald-600'
                  }`}
                >
                  {lastMonth.split(' ')[0]}
                </button>
                <button 
                  onClick={() => setSelectedMonth(currentMonth)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                    selectedMonth === currentMonth ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-400 hover:text-emerald-600'
                  }`}
                >
                  {currentMonth.split(' ')[0]}
                </button>
                <button 
                  onClick={() => setSelectedMonth(nextMonth)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                    selectedMonth === nextMonth ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-400 hover:text-emerald-600'
                  }`}
                >
                  {nextMonth.split(' ')[0]}
                </button>
                <div className="h-6 w-px bg-slate-200 mx-1"></div>
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent outline-none text-[10px] font-black text-slate-700 cursor-pointer px-2"
                >
                  <option value="All">All Months</option>
                  {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => {
                    const monthWithYear = `${m} ${new Date().getFullYear()}`;
                    return <option key={monthWithYear} value={monthWithYear}>{m}</option>;
                  })}
                </select>
              </div>
            </div>

            {/* ERP Maintenance Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 shrink-0">
              <div className="bg-blue-600 p-3.5 rounded-2xl border border-blue-700 shadow-md shadow-blue-100">
                <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-0.5">Total Residents</p>
                <h3 className="text-xl font-black text-white">{totalResidentsCount}</h3>
              </div>
              <div className="bg-emerald-600 p-3.5 rounded-2xl border border-emerald-700 shadow-md shadow-emerald-100">
                <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-0.5">Total Collection</p>
                <h3 className="text-xl font-black text-white">₹{totalCollectionAmount.toLocaleString()}</h3>
              </div>
              <div className="bg-orange-600 p-3.5 rounded-2xl border border-orange-700 shadow-md shadow-orange-100">
                <p className="text-orange-100 text-[10px] font-black uppercase tracking-widest mb-0.5">Pending Amount</p>
                <h3 className="text-xl font-black text-white">₹{totalPendingAmount.toLocaleString()}</h3>
              </div>
              <div className="bg-teal-600 p-3.5 rounded-2xl border border-teal-700 shadow-md shadow-teal-100">
                <p className="text-teal-100 text-[10px] font-black uppercase tracking-widest mb-0.5">Paid Bills</p>
                <h3 className="text-xl font-black text-white">{paidMaintenanceCount}</h3>
              </div>
              <div className="bg-rose-600 p-3.5 rounded-2xl border border-rose-700 shadow-md shadow-rose-100 col-span-2 sm:col-span-1">
                <p className="text-rose-100 text-[10px] font-black uppercase tracking-widest mb-0.5">Unpaid Bills</p>
                <h3 className="text-xl font-black text-white">{unpaidMaintenanceCount}</h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 flex flex-col w-full">
              <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50 shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative w-full max-w-xs">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search bills..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold w-full bg-white"
                      />
                    </div>
                    <button 
                      onClick={() => setShowBillForm(true)}
                      className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-1.5 uppercase tracking-wider shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Generate Bill
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-xs text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                      <select 
                        value={maintenanceFilter}
                        onChange={(e) => setMaintenanceFilter(e.target.value as 'All' | 'Paid' | 'Unpaid')}
                        className="bg-transparent outline-none text-xs font-bold text-slate-700 cursor-pointer"
                      >
                        <option value="All">All</option>
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-xs text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tower</span>
                      <select 
                        value={maintenanceTowerFilter}
                        onChange={(e) => setMaintenanceTowerFilter(e.target.value)}
                        className="bg-transparent outline-none text-xs font-bold text-slate-700 cursor-pointer"
                      >
                        <option value="All">All</option>
                        {['A', 'B', 'C', 'D', 'E'].map(t => <option key={t} value={t}>Tower {t}</option>)}
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-xs text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Flat</span>
                      <select 
                        value={maintenanceFlatFilter}
                        onChange={(e) => setMaintenanceFlatFilter(e.target.value)}
                        className="bg-transparent outline-none text-xs font-bold text-slate-700 cursor-pointer"
                      >
                        <option value="All">All</option>
                        {Array.from(new Set(residents.map(r => r.flat))).sort().map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2.5 whitespace-nowrap">Bill ID</th>
                      <th className="px-3 py-2.5 whitespace-nowrap">Resident ID</th>
                      <th className="px-3 py-2.5">Resident Name</th>
                      <th className="px-3 py-2.5 whitespace-nowrap">Tower</th>
                      <th className="px-3 py-2.5 whitespace-nowrap">Flat</th>
                      <th className="px-3 py-2.5 whitespace-nowrap">Amount</th>
                      <th className="px-3 py-2.5 whitespace-nowrap">Payment Date</th>
                      <th className="px-3 py-2.5 whitespace-nowrap">Status</th>
                      <th className="px-3 py-2.5 text-center whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredMaintenance.map((m, index) => {
                      const residentObj = residents.find(r => r.resident_id === m.resident_id);
                      const displayResidentName = m.resident_name || residentObj?.name || 'Resident Not Found';

                      return (
                        <tr key={m.id || m.maintenance_id || `m-${index}`} className={`transition-colors group ${
                          m.status === 'Paid' ? 'bg-emerald-50/20' : 'bg-rose-50/20'
                        } hover:bg-slate-50/80`}>
                          <td className="px-3 py-2.5 whitespace-nowrap font-mono font-bold text-indigo-600">
                            {m.maintenance_id}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap font-mono text-slate-500 font-bold">
                            {m.resident_id}
                          </td>
                          <td className="px-3 py-2.5 font-bold text-slate-800 truncate max-w-[130px]">
                            {displayResidentName}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap font-semibold text-slate-700">
                            Tower {m.tower}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap font-semibold text-slate-800">
                            {m.flat_no}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap font-mono font-bold text-slate-900">
                            ₹{m.amount.toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap font-mono text-slate-600">
                            {m.payment_date ? format(new Date(m.payment_date), 'dd MMM yyyy') : '—'}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider inline-flex items-center gap-1 ${
                              m.status === 'Paid' ? 'bg-emerald-600 text-white' : 
                              m.status === 'Unpaid' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                            }`}>
                              {m.status}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button 
                                onClick={() => handleUpdateMaintenanceStatus(m.maintenance_id || m.id!, m.status === 'Paid' ? 'Unpaid' : 'Paid')}
                                disabled={updating === (m.maintenance_id || m.id)}
                                className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all border ${
                                  m.status === 'Paid' ? 'text-rose-600 border-rose-200 hover:bg-rose-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                                }`}
                              >
                                {m.status === 'Paid' ? 'Mark Unpaid' : 'Mark Paid'}
                              </button>
                              <button 
                                onClick={() => handleDeleteMaintenance(m.maintenance_id || m.id!)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition-all border border-rose-100"
                                title="Delete Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      }

      case 'complaints': {
        return (
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Complaint Management</h3>
                  <p className="text-xs font-medium text-slate-500 mt-1">Track and resolve resident issues reported by residents.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-full md:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search complaints..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium w-full bg-white shadow-sm"
                    />
                  </div>
                  <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-3">Filter</span>
                    <select 
                      value={complaintFilter}
                      onChange={(e) => setComplaintFilter(e.target.value as 'All' | 'Pending' | 'Process' | 'Done' | 'Rejected')}
                      className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-slate-50 outline-none text-slate-600 hover:text-indigo-600 cursor-pointer border border-slate-100"
                    >
                      <option value="All">All Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Process">Process</option>
                      <option value="Done">Done</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <button 
                    onClick={handleDeleteAllComplaints}
                    className="px-4 py-2 bg-rose-50 text-rose-600 text-[10px] font-black rounded-xl hover:bg-rose-100 transition-all border border-rose-100 flex items-center gap-2 uppercase tracking-widest"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete All
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                      <th className="px-6 py-4">Complaint ID</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Tower / Flat</th>
                      <th className="px-6 py-4">Resident</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Media</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredComplaints.map((c, idx) => (
                      <tr key={c.id || idx} className="hover:bg-slate-50 transition-colors group text-[11px]">
                        <td className="px-6 py-4">
                          <span className="font-black text-indigo-600 tracking-tight">{c.complaint_id}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{c.category}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-black text-slate-400">T-{c.tower} / {c.flat_no}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{c.resident_name || 'Resident'}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{c.resident_id}</p>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {new Date(c.complaint_date || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                          {c.media && c.media.length > 0 ? (
                            <button 
                              onClick={() => setSelectedImage(c.media![0].file_url)}
                              className="text-indigo-600 text-[10px] font-black hover:underline flex items-center gap-1"
                            >
                              <ImageIcon className="w-3 h-3" />
                              View Media
                            </button>
                          ) : (
                            <span className="text-slate-400 font-bold italic">No Media</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            c.status === 'Done' || c.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 
                            c.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 
                            c.status === 'Process' ? 'bg-indigo-100 text-indigo-700' : 
                            'bg-rose-100 text-rose-700'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => setSelectedComplaint(c)}
                              className="px-3 py-1 rounded-lg border border-slate-200 text-indigo-600 text-[9px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all"
                              title="View Details"
                            >
                              View
                            </button>
                            {(c.status !== 'Done' && c.status !== 'Resolved' && c.status !== 'Rejected') && (
                              <>
                                {c.status !== 'Pending' && (
                                  <button 
                                    onClick={() => setComplaintToComment({ id: c.complaint_id || c.id!, status: 'Pending' })}
                                    className="px-3 py-1 rounded-lg bg-amber-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-sm"
                                  >
                                    Pending
                                  </button>
                                )}
                                {c.status !== 'Process' && (
                                  <button 
                                    onClick={() => setComplaintToComment({ id: c.complaint_id || c.id!, status: 'Process' })}
                                    className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-sm"
                                  >
                                    Process
                                  </button>
                                )}
                                <button 
                                  onClick={() => setComplaintToComment({ id: c.complaint_id || c.id!, status: 'Done' })}
                                  className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-sm"
                                >
                                  Done
                                </button>
                                <button 
                                  onClick={() => setComplaintToComment({ id: c.complaint_id || c.id!, status: 'Rejected' })}
                                  className="px-3 py-1 rounded-lg bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-sm"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <button 
                              onClick={() => handleDeleteComplaint(c.complaint_id || c.id!)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-100"
                              title="Delete Complaint"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredComplaints.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <MessageSquare className="w-16 h-16 mb-4 opacity-10" />
                  <p className="text-lg font-medium">No complaints found</p>
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'bookings': {
        return (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Amenity Bookings</h2>
                <p className="text-xs font-medium text-slate-500 mt-1">Manage and approve resident facility requests.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium w-full bg-white shadow-sm"
                  />
                </div>
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-3">Filter</span>
                  <select 
                    value={bookingFilter}
                    onChange={(e) => setBookingFilter(e.target.value as 'All' | 'Pending' | 'Approved' | 'Rejected')}
                    className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-slate-50 outline-none text-slate-600 hover:text-indigo-600 cursor-pointer border border-slate-100"
                  >
                    <option value="All">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <button 
                  onClick={() => setShowAmenityForm(true)}
                  className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 uppercase tracking-widest"
                >
                  <Plus className="w-4 h-4" />
                  Update Rates
                </button>
                <button 
                  onClick={handleDeleteAllBookings}
                  className="px-4 py-2 bg-rose-50 text-rose-600 text-[10px] font-black rounded-xl hover:bg-rose-100 transition-all border border-rose-100 flex items-center gap-2 uppercase tracking-widest"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete All
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 overflow-x-auto no-scrollbar pb-2 shrink-0">
              {amenities.map(amenity => (
                <div key={amenity.amenity_id} className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Star className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{amenity.name}</p>
                    <p className="text-sm font-black text-slate-900 leading-none">₹{amenity.price}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col">
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-100">
                    <tr className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                      <th className="px-6 py-3">Booking ID</th>
                      <th className="px-6 py-3">Resident</th>
                      <th className="px-6 py-3">Amenity</th>
                      <th className="px-6 py-3">Event</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Program Time</th>
                      <th className="px-6 py-3">Charges</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredBookings.map((b, index) => (
                      <tr key={b.booking_id || b.id || index} className="hover:bg-slate-50/80 transition-colors group text-[11px]">
                        <td className="px-6 py-3">
                          <span className="font-extrabold text-indigo-600 tracking-tight">
                            {b.booking_id}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-800">{b.name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">T-{b.tower} / {b.flat}</p>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <p className="font-bold text-slate-700">{b.amenity_name}</p>
                        </td>
                        <td className="px-6 py-3 font-medium text-slate-600">
                          {b.event_name || 'N/A'}
                        </td>
                        <td className="px-6 py-3 font-bold text-slate-800">
                          {format(new Date(b.booking_date), 'dd MMM yyyy')}
                        </td>
                        <td className="px-6 py-3 text-slate-500">
                          {b.start_time} - {b.end_time}
                        </td>
                        <td className="px-6 py-3">
                          <p className="font-black text-slate-900">₹{b.charges || 0}</p>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                            b.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 
                            b.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 
                            'bg-rose-100 text-rose-700'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button 
                              onClick={() => setSelectedBooking(b)}
                              className="text-indigo-600 hover:text-indigo-800 font-black uppercase text-[9px] px-2 py-1 rounded-lg border border-indigo-100 hover:bg-indigo-50"
                            >
                              View
                            </button>
                            {b.status === 'Pending' && (
                              <>
                                <button 
                                  onClick={() => setBookingToComment({ id: b.booking_id || b.id!, status: 'Approved' })}
                                  disabled={updating === (b.booking_id || b.id)}
                                  className="text-emerald-600 hover:text-emerald-800 font-black uppercase text-[9px] px-2 py-1 rounded-lg border border-emerald-100 hover:bg-emerald-50"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => setBookingToComment({ id: b.booking_id || b.id!, status: 'Rejected' })}
                                  disabled={updating === (b.booking_id || b.id)}
                                  className="text-rose-600 hover:text-rose-800 font-black uppercase text-[9px] px-2 py-1 rounded-lg border border-rose-100 hover:bg-rose-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <button 
                              onClick={() => handleDeleteBooking(b.booking_id || b.id!)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-all border border-rose-100"
                              title="Delete Booking"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredBookings.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <Calendar className="w-16 h-16 mb-4 opacity-10" />
                            <p className="text-lg font-medium">No bookings found matching your filters</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      }

      case 'profile':
        return (
          <div className="pb-8">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-emerald-600 p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative z-10 flex items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-black text-3xl border border-white/30">
                      {profileFormData.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">{profileFormData.name}</h2>
                      <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mt-1">Admin Profile</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleProfileUpdate} className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Name</label>
                      <input 
                        type="text"
                        value={profileFormData.name}
                        onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin ID</label>
                      <input 
                        type="text"
                        disabled
                        value={user.admin_id || 'A001'}
                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-sm cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role</label>
                      <input 
                        type="text"
                        disabled
                        value="Chairman"
                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-sm cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                      <input 
                        type="tel"
                        value={profileFormData.phone}
                        onChange={(e) => setProfileFormData({ ...profileFormData, phone: e.target.value })}
                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm transition-all"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                      <input 
                        type="email"
                        value={profileFormData.email}
                        onChange={(e) => setProfileFormData({ ...profileFormData, email: e.target.value })}
                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                    <button 
                      type="button"
                      onClick={() => setShowChangePasswordModal(true)}
                      className="w-full bg-slate-100 text-slate-600 font-black py-3 rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]"
                    >
                      Change Password
                    </button>
                    <button 
                      type="submit"
                      className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                    >
                      <Check className="w-4 h-4" />
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        );

      case 'notices':
        return (
          <NoticeBoard 
            user={user}
            onSwitchTab={(tab) => setActiveTab(tab)}
            onRefresh={onRefresh}
          />
        );

      case 'communication':
        return (
          <CommunicationCenter 
            user={user}
            onSwitchTab={(tab) => setActiveTab(tab)}
            onRefresh={onRefresh}
          />
        );

      case 'financial':
        return (
          <FinanceDashboard 
            user={user}
            residents={residents}
            maintenance={maintenance}
            onRefresh={onRefresh}
          />
        );

      default:
        return <div className="p-12 text-center text-gray-400">Section coming soon...</div>;
    }
  };

  const renderProfileModal = () => (
    <div>
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Admin Profile</h3>
                <p className="text-indigo-100 text-xs font-black uppercase tracking-widest mt-1">Edit your personal details</p>
              </div>
              <button onClick={() => setShowProfileModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleProfileUpdate} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin ID</label>
                <input 
                  type="text" 
                  value={user.admin_id || 'A001'} 
                  disabled 
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 font-black cursor-not-allowed" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                <input 
                  type="text" 
                  value={profileFormData.name} 
                  onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                <input 
                  type="tel" 
                  value={profileFormData.phone} 
                  onChange={(e) => setProfileFormData({ ...profileFormData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                <input 
                  type="email" 
                  value={profileFormData.email} 
                  onChange={(e) => setProfileFormData({ ...profileFormData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold" 
                />
              </div>
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    setShowProfileModal(false);
                    setShowChangePasswordModal(true);
                  }}
                  className="w-full bg-slate-100 text-slate-600 font-black py-3 rounded-xl hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]"
                >
                  Change Password
                </button>
              </div>
              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest text-xs"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col max-w-7xl mx-auto w-full">
      <div className="">
        {renderContent()}
      </div>
      {renderProfileModal()}

      {/* Maintenance Bill Form Modal */}
      {showBillForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 bg-blue-600 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-black">Generate Maintenance Bill</h3>
                <p className="text-blue-100 text-xs font-medium uppercase tracking-wider">Select calculation method & generate bills</p>
              </div>
              <button onClick={() => setShowBillForm(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateMaintenanceBill} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
              {/* Calculation Method Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Calculation Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCalcMethod('Flat/BHK Maintenance');
                      const selRes = residents.find(r => r.resident_id === billFormData.resident_id);
                      if (selRes) {
                        const ft = selRes.flat_type || (selRes.bhk === '1 BHK' ? 'Smart 1 BHK' : selRes.bhk === '3 BHK' ? 'Premium 3 BHK' : 'Smart 2 BHK');
                        setBillFormData(prev => ({ ...prev, amount: flatTypeRates[ft] || 3200 }));
                      }
                    }}
                    className={`p-3 rounded-2xl border text-xs font-black transition-all text-left flex flex-col gap-1 ${
                      calcMethod === 'Flat/BHK Maintenance'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <span className="uppercase tracking-wider">1. Flat / BHK Maintenance</span>
                    <span className={`text-[10px] font-normal ${calcMethod === 'Flat/BHK Maintenance' ? 'text-blue-100' : 'text-gray-500'}`}>
                      Fixed amount per Flat Type
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCalcMethod('Square Foot Maintenance');
                      const selRes = residents.find(r => r.resident_id === billFormData.resident_id);
                      if (selRes) {
                        const ft = selRes.flat_type || (selRes.bhk === '1 BHK' ? 'Smart 1 BHK' : selRes.bhk === '3 BHK' ? 'Premium 3 BHK' : 'Smart 2 BHK');
                        const sqft = selRes.square_feet || (ft === 'Smart 1 BHK' ? 520 : ft === 'Premium 2 BHK' ? 720 : ft === 'Premium 3 BHK' ? 920 : 620);
                        setBillFormData(prev => ({ ...prev, amount: Math.round(sqft * sqftRate) }));
                      }
                    }}
                    className={`p-3 rounded-2xl border text-xs font-black transition-all text-left flex flex-col gap-1 ${
                      calcMethod === 'Square Foot Maintenance'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <span className="uppercase tracking-wider">2. Square Foot Maintenance</span>
                    <span className={`text-[10px] font-normal ${calcMethod === 'Square Foot Maintenance' ? 'text-blue-100' : 'text-gray-500'}`}>
                      Area × Rate per sq.ft
                    </span>
                  </button>
                </div>
              </div>

              {/* Maintenance Rate Configuration */}
              {calcMethod === 'Flat/BHK Maintenance' ? (
                <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 space-y-3">
                  <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">
                    Flat/BHK Maintenance Amounts Configuration (₹)
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Smart 1 BHK</label>
                      <input 
                        type="number"
                        min="0"
                        value={flatTypeRates['Smart 1 BHK'] || 2500}
                        onChange={(e) => setFlatTypeRates({ ...flatTypeRates, 'Smart 1 BHK': parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 rounded-xl border border-indigo-200 font-bold bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Smart 2 BHK</label>
                      <input 
                        type="number"
                        min="0"
                        value={flatTypeRates['Smart 2 BHK'] || 3200}
                        onChange={(e) => setFlatTypeRates({ ...flatTypeRates, 'Smart 2 BHK': parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 rounded-xl border border-indigo-200 font-bold bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Premium 2 BHK</label>
                      <input 
                        type="number"
                        min="0"
                        value={flatTypeRates['Premium 2 BHK'] || 4000}
                        onChange={(e) => setFlatTypeRates({ ...flatTypeRates, 'Premium 2 BHK': parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 rounded-xl border border-indigo-200 font-bold bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Premium 3 BHK</label>
                      <input 
                        type="number"
                        min="0"
                        value={flatTypeRates['Premium 3 BHK'] || 5000}
                        onChange={(e) => setFlatTypeRates({ ...flatTypeRates, 'Premium 3 BHK': parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 rounded-xl border border-indigo-200 font-bold bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 space-y-2">
                  <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest block">
                    Square Foot Maintenance Rate (₹ per sq.ft)
                  </label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number"
                      min="1"
                      step="0.5"
                      value={sqftRate}
                      onChange={(e) => {
                        const newRate = parseFloat(e.target.value) || 0;
                        setSqftRate(newRate);
                        const selRes = residents.find(r => r.resident_id === billFormData.resident_id);
                        if (selRes) {
                          const ft = selRes.flat_type || (selRes.bhk === '1 BHK' ? 'Smart 1 BHK' : selRes.bhk === '3 BHK' ? 'Premium 3 BHK' : 'Smart 2 BHK');
                          const sqft = selRes.square_feet || (ft === 'Smart 1 BHK' ? 520 : ft === 'Premium 2 BHK' ? 720 : ft === 'Premium 3 BHK' ? 920 : 620);
                          setBillFormData(prev => ({ ...prev, amount: Math.round(sqft * newRate) }));
                        }
                      }}
                      className="w-32 px-3 py-2 rounded-xl border border-indigo-200 font-bold bg-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                    <span className="text-xs font-bold text-indigo-700">₹{sqftRate} / sq.ft</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Resident / Group / Tower</label>
                <select 
                  required
                  value={billFormData.resident_id}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const selRes = residents.find(r => r.resident_id === selId);
                    let newAmount = billFormData.amount;
                    if (selRes) {
                      const ft = selRes.flat_type || (selRes.bhk === '1 BHK' ? 'Smart 1 BHK' : selRes.bhk === '3 BHK' ? 'Premium 3 BHK' : 'Smart 2 BHK');
                      const sqft = selRes.square_feet || (ft === 'Smart 1 BHK' ? 520 : ft === 'Premium 2 BHK' ? 720 : ft === 'Premium 3 BHK' ? 920 : 620);
                      if (calcMethod === 'Square Foot Maintenance') {
                        newAmount = Math.round(sqft * sqftRate);
                      } else {
                        newAmount = flatTypeRates[ft] || 3200;
                      }
                    }
                    setBillFormData({ ...billFormData, resident_id: selId, amount: newAmount });
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                >
                  <option value="all">All Residents ({residents.length})</option>
                  <optgroup label="Towers">
                    <option value="tower-A">All Tower A Residents</option>
                    <option value="tower-B">All Tower B Residents</option>
                    <option value="tower-C">All Tower C Residents</option>
                    <option value="tower-D">All Tower D Residents</option>
                    <option value="tower-E">All Tower E Residents</option>
                  </optgroup>
                  {Array.from(new Set(residents.map(r => r.tower))).sort().map(tower => (
                    <optgroup key={tower} label={`Tower ${tower}`}>
                      <option value={`tower-${tower}`}>All Tower {tower} Residents</option>
                      {residents.filter(r => r.tower === tower).map(r => (
                        <option key={r.resident_id} value={r.resident_id}>
                          {r.resident_id} - {r.name} (Flat {r.flat} • {r.flat_type || 'Smart 2 BHK'})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Resident Calculation Live Preview */}
              {billFormData.resident_id !== 'all' && !billFormData.resident_id.startsWith('tower-') && (() => {
                const selRes = residents.find(r => r.resident_id === billFormData.resident_id);
                if (!selRes) return null;
                const ft = selRes.flat_type || (selRes.bhk === '1 BHK' ? 'Smart 1 BHK' : selRes.bhk === '3 BHK' ? 'Premium 3 BHK' : 'Smart 2 BHK');
                const sqft = selRes.square_feet || (ft === 'Smart 1 BHK' ? 520 : ft === 'Premium 2 BHK' ? 720 : ft === 'Premium 3 BHK' ? 920 : 620);
                const calcAmt = calcMethod === 'Square Foot Maintenance' ? Math.round(sqft * sqftRate) : (flatTypeRates[ft] || 3200);

                return (
                  <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 text-emerald-950 space-y-1">
                    <div className="flex justify-between items-center text-xs font-black">
                      <span>Resident: {selRes.resident_id} — {selRes.name}</span>
                      <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-mono text-[10px]">Flat {selRes.flat}</span>
                    </div>
                    <div className="text-[11px] font-bold text-emerald-800 flex flex-wrap justify-between gap-2 pt-1 border-t border-emerald-200/80">
                      <span>Flat Type: {ft}</span>
                      <span>
                        Calculation: {calcMethod === 'Square Foot Maintenance' ? `₹${sqftRate}/sq.ft rate applied = ₹${calcAmt.toLocaleString()}` : `Configured Amount = ₹${calcAmt.toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Month</label>
                  <select 
                    required
                    value={billFormData.month}
                    onChange={(e) => setBillFormData({ ...billFormData, month: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  >
                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Year</label>
                  <select 
                    required
                    value={billFormData.year}
                    onChange={(e) => setBillFormData({ ...billFormData, year: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  >
                    {[new Date().getFullYear(), new Date().getFullYear() + 1].map(y => (
                      <option key={y} value={y.toString()}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {billFormData.resident_id === 'all' || billFormData.resident_id.startsWith('tower-') 
                      ? 'Base / Default Amount (₹)' 
                      : 'Bill Amount (₹)'}
                  </label>
                  <input 
                    type="number"
                    required
                    min="1"
                    value={isNaN(billFormData.amount) || billFormData.amount === 0 ? '' : billFormData.amount}
                    onChange={(e) => setBillFormData({ ...billFormData, amount: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Due Date</label>
                  <input 
                    type="date"
                    required
                    value={billFormData.due_date}
                    onChange={(e) => setBillFormData({ ...billFormData, due_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</label>
                <textarea 
                  rows={2}
                  value={billFormData.description}
                  onChange={(e) => setBillFormData({ ...billFormData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm"
                />
              </div>

              <button 
                type="submit"
                disabled={updating === 'generating-bill'}
                className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-xs mt-2"
              >
                {updating === 'generating-bill' ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Generate Maintenance Bill ({calcMethod})
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Booking Edit Modal */}
      {showBookingEditModal && editingBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black">Update Booking Times</h3>
                <p className="text-blue-100 text-xs font-medium uppercase tracking-wider">
                  {editingBooking.amenity_name} - {format(new Date(editingBooking.booking_date), 'dd MMM yyyy')}
                </p>
              </div>
              <button onClick={() => setShowBookingEditModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateBookingTimes} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Start Time</label>
                  <input 
                    type="time"
                    required
                    value={bookingEditData.start_time}
                    onChange={(e) => setBookingEditData({ ...bookingEditData, start_time: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">End Time</label>
                  <input 
                    type="time"
                    required
                    value={bookingEditData.end_time}
                    onChange={(e) => setBookingEditData({ ...bookingEditData, end_time: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    const modal = document.querySelector('.overflow-hidden');
                    if (modal) modal.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3 rotate-180" />
                  Scroll Up
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    const modal = document.querySelector('.overflow-hidden');
                    if (modal) modal.scrollTo({ top: modal.scrollHeight, behavior: 'smooth' });
                  }}
                  className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Scroll Down
                </button>
              </div>

              <button 
                type="submit"
                disabled={updating === (editingBooking.booking_id || editingBooking.id)}
                className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
              >
                {updating === (editingBooking.booking_id || editingBooking.id) ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Update Times
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Amenity Price Management Modal */}
      {showAmenityForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black">Amenity Price Management</h3>
                <p className="text-blue-100 text-xs font-medium uppercase tracking-wider">Set and update booking amounts</p>
              </div>
              <button onClick={() => setShowAmenityForm(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] scroll-container">
              {dbError && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-rose-700 font-black uppercase text-xs">
                    <AlertCircle className="w-4 h-4" />
                    Database Setup Required
                  </div>
                  <p className="text-xs text-rose-600 font-medium">{dbError}</p>
                  <p className="text-[10px] text-rose-500">Please run the SQL script in your Supabase SQL Editor to create the necessary tables.</p>
                  <button 
                    onClick={() => setShowSqlModal(true)}
                    className="mt-2 bg-rose-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg hover:bg-rose-700 transition-colors uppercase tracking-widest w-fit"
                  >
                    View SQL Fix
                  </button>
                </div>
              )}
              {/* Add New Amenity Form */}
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <h4 className="text-sm font-black text-blue-800 uppercase tracking-widest mb-4">Manage Amenity</h4>
                <form onSubmit={handleAddAmenity} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amenity Name</label>
                      <input 
                        list="amenity-suggestions"
                        required
                        placeholder="Enter or select amenity"
                        value={amenityFormData.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          const existing = amenities.find(a => a.name === name);
                          
                          if (existing) {
                            setAmenityFormData({ 
                              ...amenityFormData, 
                              name,
                              price: existing.price,
                              base_hours: existing.base_hours || 4,
                              extra_hour_charge: existing.extra_hour_charge || 0,
                              description: existing.description || '',
                              facilities: existing.facilities || ''
                            });
                          } else {
                            // Predefined pricing for new entries if they match standard names
                            let defaults = { price: 0, base_hours: 4, extra_hour_charge: 0, description: '', facilities: '' };
                            if (name === 'Clubhouse Hall') {
                              defaults = { 
                                price: 2500, 
                                base_hours: 4, 
                                extra_hour_charge: 500, 
                                description: 'Indoor hall with AC, chairs, and lighting for events like birthdays and meetings.',
                                facilities: 'Indoor seating, AC, lighting, sound system, tables and chairs'
                              };
                            } else if (name === 'Garden Area') {
                              defaults = { 
                                price: 1500, 
                                base_hours: 4, 
                                extra_hour_charge: 300, 
                                description: 'Outdoor space for family gatherings and small celebrations.',
                                facilities: 'Open lawn space, seating benches, decorative lights, walking area'
                              };
                            } else if (name === 'Community Hall') {
                              defaults = { 
                                price: 3000, 
                                base_hours: 5, 
                                extra_hour_charge: 600, 
                                description: 'Large hall for society functions, cultural events, and meetings.',
                                facilities: 'Large hall for events, stage, fans/AC, power supply, seating arrangement'
                              };
                            }
                            setAmenityFormData({ ...amenityFormData, name, ...defaults });
                          }
                        }}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                      />
                      <datalist id="amenity-suggestions">
                        <option value="Clubhouse Hall" />
                        <option value="Garden Area" />
                        <option value="Community Hall" />
                      </datalist>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Price (₹)</label>
                      <input 
                        type="number"
                        required
                        placeholder="Price (₹)"
                        value={isNaN(amenityFormData.price) || amenityFormData.price === 0 ? '' : amenityFormData.price}
                        onChange={(e) => setAmenityFormData({ ...amenityFormData, price: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base Hours</label>
                      <input 
                        type="number"
                        required
                        min="1"
                        value={isNaN(amenityFormData.base_hours) || amenityFormData.base_hours === 0 ? '' : amenityFormData.base_hours}
                        onChange={(e) => setAmenityFormData({ ...amenityFormData, base_hours: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Extra Hour Charge (₹)</label>
                      <input 
                        type="number"
                        required
                        min="0"
                        value={isNaN(amenityFormData.extra_hour_charge) || amenityFormData.extra_hour_charge === 0 ? '' : amenityFormData.extra_hour_charge}
                        onChange={(e) => setAmenityFormData({ ...amenityFormData, extra_hour_charge: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Facilities (Comma separated)</label>
                    <textarea 
                      rows={2}
                      value={amenityFormData.facilities}
                      onChange={(e) => setAmenityFormData({ ...amenityFormData, facilities: e.target.value })}
                      placeholder="e.g. AC Hall, 30 Chairs, Tables"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={updating === 'adding-amenity'}
                    className="w-full bg-blue-600 text-white font-black py-3 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 text-xs uppercase tracking-widest shadow-lg shadow-blue-100"
                  >
                    {amenities.find(a => a.name === amenityFormData.name) ? 'Update Amenity Price' : 'Save Amenity Price'}
                  </button>
                </form>
              </div>

              {/* Existing Amenities Table */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Existing Amenities</h4>
                  <button 
                    onClick={async () => {
                      if (globalThis.confirm?.('This will remove all current amenities and set the default ones (Clubhouse, Garden, Community Halls). Continue?')) {
                        setUpdating('resetting-amenities');
                        try {
                          // 1. Delete all current amenities
                          for (const a of amenities) {
                            await societyService.deleteAmenity(a.amenity_id);
                          }
                          
                          // 2. Add default amenities
                          const defaults = [
                            { name: 'Clubhouse Hall', price: 2500, charges: 2500, base_hours: 4, extra_hour_charge: 500, description: 'Indoor hall with AC, chairs, and lighting for events like birthdays and meetings.', facilities: 'Indoor seating, AC, lighting, sound system, tables and chairs', society_id: user.society_id },
                            { name: 'Garden Area', price: 1500, charges: 1500, base_hours: 4, extra_hour_charge: 300, description: 'Outdoor space for family gatherings and small celebrations.', facilities: 'Open lawn space, seating benches, decorative lights, walking area', society_id: user.society_id },
                            { name: 'Community Hall', price: 3000, charges: 3000, base_hours: 5, extra_hour_charge: 600, description: 'Large hall for society functions, cultural events, and meetings.', facilities: 'Large hall for events, stage, fans/AC, power supply, seating arrangement', society_id: user.society_id }
                          ];
                          
                          for (const d of defaults) {
                            await societyService.addAmenity(d);
                          }
                          
                          await fetchAmenities();
                          toast.success('Amenities reset to defaults successfully!');
                        } catch (error: unknown) {
                          const msg = error instanceof Error ? error.message : String(error);
                          toast.error('Reset failed: ' + msg);
                        } finally {
                          setUpdating(null);
                        }
                      }
                    }}
                    disabled={updating === 'resetting-amenities'}
                    className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1 disabled:opacity-50"
                  >
                    {updating === 'resetting-amenities' ? 'Resetting...' : 'Reset to Defaults'}
                  </button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-100 max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-[10px]">
                    <thead className="bg-gray-50 text-gray-400 font-black uppercase tracking-widest sticky top-0">
                      <tr>
                        <th className="px-4 py-3">Amenity Name</th>
                        <th className="px-4 py-3">Base Price (₹)</th>
                        <th className="px-4 py-3">Base Hours</th>
                        <th className="px-4 py-3">Extra Hour Charge (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {amenities.map((a) => (
                        <tr key={a.amenity_id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 font-bold text-gray-800">{a.name}</td>
                          <td className="px-4 py-3 font-black text-blue-600">₹{a.price}</td>
                          <td className="px-4 py-3 text-gray-500">{a.base_hours}</td>
                          <td className="px-4 py-3 text-gray-500">₹{a.extra_hour_charge}</td>
                        </tr>
                      ))}
                      {amenities.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic">No amenities configured.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SQL Fix Modal */}
      {/* Image Preview Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img 
            src={selectedImage} 
            alt="Full Preview" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            referrerPolicy="no-referrer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {showSqlModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 bg-rose-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black">SQL Database Fix</h3>
                <p className="text-rose-100 text-xs font-medium uppercase tracking-wider">Run this in your Supabase SQL Editor</p>
              </div>
              <button onClick={() => setShowSqlModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
                <pre className="text-green-400 text-xs font-mono leading-relaxed">
{`-- 1. Create or Fix the amenities table
CREATE TABLE IF NOT EXISTS public.amenities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amenity_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    society_id TEXT NOT NULL,
    description TEXT,
    base_hours NUMERIC DEFAULT 4,
    extra_hour_charge NUMERIC DEFAULT 0,
    facilities TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Fix existing tables for NOT NULL id constraint
-- For maintenance table
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='maintenance' AND column_name='id' AND is_nullable='NO' AND column_default IS NULL) THEN
        ALTER TABLE public.maintenance ALTER COLUMN id SET DEFAULT gen_random_uuid();
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- If id is not UUID, try to make it serial if it's an integer
    NULL;
END $$;

-- For booking table
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='booking' AND column_name='id' AND is_nullable='NO' AND column_default IS NULL) THEN
        ALTER TABLE public.booking ALTER COLUMN id SET DEFAULT gen_random_uuid();
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 3. Add missing columns to existing tables
ALTER TABLE public.complaint ADD COLUMN IF NOT EXISTS society_id TEXT;
ALTER TABLE public.complaint ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.complaint ADD COLUMN IF NOT EXISTS complaint_id TEXT;
ALTER TABLE public.complaint ADD COLUMN IF NOT EXISTS admin_comment TEXT;
ALTER TABLE public.maintenance ADD COLUMN IF NOT EXISTS resident_id TEXT;
ALTER TABLE public.maintenance ADD COLUMN IF NOT EXISTS resident_name TEXT;
ALTER TABLE public.maintenance ADD COLUMN IF NOT EXISTS generated_by TEXT;
ALTER TABLE public.maintenance ADD COLUMN IF NOT EXISTS society_id TEXT;
ALTER TABLE public.maintenance ADD COLUMN IF NOT EXISTS admin_id TEXT;

-- 4. Create or Fix the booking table
CREATE TABLE IF NOT EXISTS public.booking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id TEXT UNIQUE,
    resident_id TEXT NOT NULL,
    name TEXT NOT NULL,
    tower TEXT NOT NULL,
    flat TEXT NOT NULL,
    amenity_name TEXT NOT NULL,
    amenity_type TEXT,
    event_name TEXT NOT NULL,
    booking_date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    charges NUMERIC NOT NULL,
    status TEXT DEFAULT 'Pending',
    society_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure missing columns in booking if it already existed
ALTER TABLE public.booking ADD COLUMN IF NOT EXISTS society_id TEXT;
ALTER TABLE public.booking ADD COLUMN IF NOT EXISTS resident_id TEXT;
ALTER TABLE public.booking ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.booking ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking ENABLE ROW LEVEL SECURITY;

-- 6. Create basic policies
DROP POLICY IF EXISTS "Allow all on amenities" ON public.amenities;
CREATE POLICY "Allow all on amenities" ON public.amenities FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow all on booking" ON public.booking;
CREATE POLICY "Allow all on booking" ON public.booking FOR ALL USING (true);

-- 7. Refresh schema cache (IMPORTANT)
NOTIFY pgrst, 'reload schema';

-- 8. Create Media table for complaint attachments
CREATE TABLE IF NOT EXISTS public.media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id TEXT UNIQUE NOT NULL,
    complaint_id TEXT NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT now(),
    uploaded_by TEXT,
    society_id TEXT
);

-- 9. Storage Policies for 'media' bucket (Run this in SQL Editor)
-- Note: Make sure to create a public bucket named 'media' first in Storage section
-- CREATE POLICY "Allow public upload" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'media');
-- CREATE POLICY "Allow public view" ON storage.objects FOR SELECT TO public USING (bucket_id = 'media');
`}
                </pre>
              </div>
              <div className="flex justify-between items-center bg-rose-50 p-4 rounded-xl border border-rose-100">
                <div className="flex items-center gap-3 text-rose-700">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-xs font-medium">Copy this script and run it in your Supabase SQL Editor to fix the "PGRST205" error.</p>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`-- 1. Create or Fix the amenities table
CREATE TABLE IF NOT EXISTS public.amenities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amenity_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    society_id TEXT NOT NULL,
    description TEXT,
    base_hours NUMERIC DEFAULT 4,
    extra_hour_charge NUMERIC DEFAULT 0,
    facilities TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Fix existing tables for NOT NULL id constraint
-- For maintenance table
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='maintenance' AND column_name='id' AND is_nullable='NO' AND column_default IS NULL) THEN
        ALTER TABLE public.maintenance ALTER COLUMN id SET DEFAULT gen_random_uuid();
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- For booking table
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='booking' AND column_name='id' AND is_nullable='NO' AND column_default IS NULL) THEN
        ALTER TABLE public.booking ALTER COLUMN id SET DEFAULT gen_random_uuid();
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 3. Add missing columns to existing tables
ALTER TABLE public.complaint ADD COLUMN IF NOT EXISTS society_id TEXT;
ALTER TABLE public.complaint ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.complaint ADD COLUMN IF NOT EXISTS complaint_id TEXT;
ALTER TABLE public.complaint ADD COLUMN IF NOT EXISTS admin_comment TEXT;
ALTER TABLE public.maintenance ADD COLUMN IF NOT EXISTS resident_id TEXT;
ALTER TABLE public.maintenance ADD COLUMN IF NOT EXISTS resident_name TEXT;
ALTER TABLE public.maintenance ADD COLUMN IF NOT EXISTS generated_by TEXT;
ALTER TABLE public.maintenance ADD COLUMN IF NOT EXISTS society_id TEXT;
ALTER TABLE public.maintenance ADD COLUMN IF NOT EXISTS admin_id TEXT;

-- 4. Create or Fix the booking table
CREATE TABLE IF NOT EXISTS public.booking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id TEXT UNIQUE,
    resident_id TEXT NOT NULL,
    name TEXT NOT NULL,
    tower TEXT NOT NULL,
    flat TEXT NOT NULL,
    amenity_name TEXT NOT NULL,
    amenity_type TEXT,
    event_name TEXT NOT NULL,
    booking_date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    charges NUMERIC NOT NULL,
    status TEXT DEFAULT 'Pending',
    society_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure missing columns in booking if it already existed
ALTER TABLE public.booking ADD COLUMN IF NOT EXISTS society_id TEXT;
ALTER TABLE public.booking ADD COLUMN IF NOT EXISTS resident_id TEXT;
ALTER TABLE public.booking ADD COLUMN IF NOT EXISTS name TEXT;

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking ENABLE ROW LEVEL SECURITY;

-- 6. Create basic policies
DROP POLICY IF EXISTS "Allow all on amenities" ON public.amenities;
CREATE POLICY "Allow all on amenities" ON public.amenities FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow all on booking" ON public.booking;
CREATE POLICY "Allow all on booking" ON public.booking FOR ALL USING (true);

-- 7. Refresh schema cache
NOTIFY pgrst, 'reload schema';`);
                    toast.success('SQL script copied to clipboard!');
                  }}
                  className="bg-rose-600 text-white font-black px-4 py-2 rounded-lg hover:bg-rose-700 transition-all text-xs uppercase tracking-widest"
                >
                  Copy SQL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add Resident Modal */}
      {showEditResidentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white w-full max-w-[530px] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="px-5 py-3 bg-blue-600 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-base font-black leading-tight">{editingResident ? 'Edit Resident Profile' : 'Add New Resident'}</h3>
                <p className="text-blue-100 text-[10px] font-bold uppercase tracking-wider">{editingResident ? 'Update resident credentials & unit details' : 'Register a new member'}</p>
              </div>
              <button onClick={() => setShowEditResidentModal(false)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateResident} className="px-5 py-3.5 space-y-2.5 text-xs">
              {/* Row 1: Full Name & Password */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-7 space-y-0.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Full Name</label>
                  <input 
                    type="text"
                    required
                    value={residentEditData.name}
                    onChange={(e) => setResidentEditData({ ...residentEditData, name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 outline-none focus:ring-1 focus:ring-blue-500 font-bold text-xs bg-slate-50/70"
                    placeholder="Resident Name"
                  />
                </div>
                <div className="col-span-5 space-y-0.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      required
                      value={residentEditData.password}
                      onChange={(e) => setResidentEditData({ ...residentEditData, password: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 outline-none focus:ring-1 focus:ring-blue-500 font-bold text-xs bg-slate-50/70 pr-8"
                      placeholder="Password"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Tower, Floor & Flat */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Tower</label>
                  <input 
                    type="text"
                    required
                    value={residentEditData.tower}
                    onChange={(e) => setResidentEditData({ ...residentEditData, tower: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 outline-none focus:ring-1 focus:ring-blue-500 font-bold text-xs bg-slate-50/70"
                    placeholder="Tower A"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Floor</label>
                  <input 
                    type="number"
                    required
                    value={isNaN(residentEditData.floor) || residentEditData.floor === 0 ? '' : residentEditData.floor}
                    onChange={(e) => setResidentEditData({ ...residentEditData, floor: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 outline-none focus:ring-1 focus:ring-blue-500 font-bold text-xs bg-slate-50/70"
                    placeholder="1"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Flat No</label>
                  <input 
                    type="text"
                    required
                    value={residentEditData.flat}
                    onChange={(e) => setResidentEditData({ ...residentEditData, flat: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 outline-none focus:ring-1 focus:ring-blue-500 font-bold text-xs bg-slate-50/70"
                    placeholder="101"
                  />
                </div>
              </div>

              {/* Row 3: BHK, Flat Type & Square Feet Configuration */}
              <div className="grid grid-cols-3 gap-2 bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100">
                <div className="space-y-0.5">
                  <label className="text-[9px] font-black text-indigo-900 uppercase tracking-wider">BHK</label>
                  <select 
                    value={residentEditData.bhk}
                    onChange={(e) => {
                      const selectedBhk = e.target.value;
                      const isPremium = residentEditData.flat_type?.includes('Premium');
                      let newType = isPremium ? `Premium ${selectedBhk}` : `Smart ${selectedBhk}`;
                      let newSqft = 620;
                      if (selectedBhk === '1 BHK') {
                        newSqft = isPremium ? 580 : 520;
                      } else if (selectedBhk === '2 BHK') {
                        newSqft = isPremium ? 720 : 620;
                      } else if (selectedBhk === '3 BHK') {
                        newSqft = isPremium ? 920 : 850;
                      }
                      setResidentEditData({ 
                        ...residentEditData, 
                        bhk: selectedBhk,
                        flat_type: newType,
                        square_feet: newSqft
                      });
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-xs bg-white text-slate-800"
                  >
                    <option value="1 BHK">1 BHK</option>
                    <option value="2 BHK">2 BHK</option>
                    <option value="3 BHK">3 BHK</option>
                  </select>
                </div>

                <div className="space-y-0.5">
                  <label className="text-[9px] font-black text-indigo-900 uppercase tracking-wider">Flat Type</label>
                  <select 
                    value={residentEditData.flat_type}
                    onChange={(e) => {
                      const selectedType = e.target.value;
                      let newSqft = residentEditData.square_feet;
                      if (selectedType === 'Smart' || selectedType === 'Smart 2 BHK') newSqft = 620;
                      else if (selectedType === 'Premium' || selectedType === 'Premium 2 BHK') newSqft = 720;
                      else if (selectedType === 'Smart 1 BHK') newSqft = 520;
                      else if (selectedType === 'Premium 1 BHK') newSqft = 580;
                      else if (selectedType === 'Smart 3 BHK') newSqft = 850;
                      else if (selectedType === 'Premium 3 BHK') newSqft = 920;

                      // Synchronize BHK if specific BHK type is chosen
                      let updatedBhk = residentEditData.bhk;
                      if (selectedType.includes('1 BHK')) updatedBhk = '1 BHK';
                      else if (selectedType.includes('2 BHK')) updatedBhk = '2 BHK';
                      else if (selectedType.includes('3 BHK')) updatedBhk = '3 BHK';

                      setResidentEditData({
                        ...residentEditData,
                        bhk: updatedBhk,
                        flat_type: selectedType,
                        square_feet: newSqft
                      });
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-xs bg-white text-slate-800"
                  >
                    <optgroup label="Standard Types">
                      <option value="Smart">Smart</option>
                      <option value="Premium">Premium</option>
                    </optgroup>
                    <optgroup label={`${residentEditData.bhk || '1 BHK'} Options`}>
                      <option value={`Smart ${residentEditData.bhk || '1 BHK'}`}>Smart {residentEditData.bhk || '1 BHK'}</option>
                      <option value={`Premium ${residentEditData.bhk || '1 BHK'}`}>Premium {residentEditData.bhk || '1 BHK'}</option>
                    </optgroup>
                    <optgroup label="All BHK Options">
                      <option value="Smart 1 BHK">Smart 1 BHK (520 sq.ft)</option>
                      <option value="Premium 1 BHK">Premium 1 BHK (580 sq.ft)</option>
                      <option value="Smart 2 BHK">Smart 2 BHK (620 sq.ft)</option>
                      <option value="Premium 2 BHK">Premium 2 BHK (720 sq.ft)</option>
                      <option value="Smart 3 BHK">Smart 3 BHK (850 sq.ft)</option>
                      <option value="Premium 3 BHK">Premium 3 BHK (920 sq.ft)</option>
                    </optgroup>
                  </select>
                </div>

                <div className="space-y-0.5">
                  <label className="text-[9px] font-black text-indigo-900 uppercase tracking-wider">Sq. Ft</label>
                  <input 
                    type="number"
                    required
                    min="100"
                    value={isNaN(residentEditData.square_feet) || residentEditData.square_feet === 0 ? '' : residentEditData.square_feet}
                    onChange={(e) => setResidentEditData({ ...residentEditData, square_feet: parseInt(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-xs bg-white text-slate-800"
                  />
                </div>
              </div>

              {/* Row 4: Phone & Email */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Phone</label>
                  <input 
                    type="text"
                    required
                    value={residentEditData.phone}
                    onChange={(e) => setResidentEditData({ ...residentEditData, phone: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 outline-none focus:ring-1 focus:ring-blue-500 font-bold text-xs bg-slate-50/70"
                    placeholder="Mobile Number"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Email</label>
                  <input 
                    type="email"
                    required
                    value={residentEditData.email}
                    onChange={(e) => setResidentEditData({ ...residentEditData, email: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 outline-none focus:ring-1 focus:ring-blue-500 font-bold text-xs bg-slate-50/70"
                    placeholder="Email Address"
                  />
                </div>
              </div>

              {/* Row 5: Resident Role & Status */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Resident Type</label>
                  <select 
                    value={residentEditData.role || residentEditData.occupancy_type || 'Owner'}
                    onChange={(e) => {
                      const newRole = e.target.value as 'Owner' | 'Tenant';
                      if (newRole === 'Tenant') {
                        const assignedTid = editingResident?.tenant_id || residentEditData.tenant_id || getNextTenantId();
                        setResidentEditData({ 
                          ...residentEditData, 
                          role: 'Tenant',
                          occupancy_type: 'Tenant',
                          tenant_id: assignedTid
                        });
                      } else {
                        setResidentEditData({ 
                          ...residentEditData, 
                          role: 'Owner',
                          occupancy_type: 'Owner',
                          tenant_id: null,
                          owner_id: null
                        });
                      }
                    }}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 outline-none focus:ring-1 focus:ring-blue-500 font-bold text-xs bg-white"
                  >
                    <option value="Owner">Owner</option>
                    <option value="Tenant">Tenant</option>
                  </select>
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Account Status</label>
                  <select 
                    value={residentEditData.status}
                    onChange={(e) => setResidentEditData({ ...residentEditData, status: e.target.value as 'Active' | 'Inactive' })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 outline-none focus:ring-1 focus:ring-blue-500 font-bold text-xs bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Owner Selection & Tenant ID (Conditional: ONLY for Tenant) */}
              {(residentEditData.role === 'Tenant' || residentEditData.occupancy_type === 'Tenant') && (() => {
                const currentTenantId = editingResident?.tenant_id || residentEditData.tenant_id || getNextTenantId();
                const validOwners = residents.filter(r => 
                  (r.role === 'Owner' || r.occupancy_type === 'Owner' || (!r.role && !r.occupancy_type)) &&
                  r.resident_id !== residentEditData.resident_id
                );

                return (
                  <div className="grid grid-cols-12 gap-2 p-2 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs">
                    <div className="col-span-5 space-y-0.5">
                      <label className="text-[8px] font-black text-indigo-700 uppercase tracking-wider">Tenant ID</label>
                      <input 
                        type="text"
                        disabled
                        value={currentTenantId}
                        className="w-full px-2.5 py-1 rounded-lg border border-indigo-200 bg-white font-mono font-black text-[11px] text-indigo-700 cursor-not-allowed"
                      />
                    </div>
                    <div className="col-span-7 space-y-0.5">
                      <label className="text-[8px] font-black text-indigo-700 uppercase tracking-wider">Assigned Owner</label>
                      <select 
                        required
                        value={residentEditData.owner_id || ''}
                        onChange={(e) => setResidentEditData({ ...residentEditData, owner_id: e.target.value })}
                        className="w-full px-2.5 py-1 rounded-lg border border-indigo-200 outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-[11px] bg-white text-slate-800"
                      >
                        <option value="">-- Choose Owner --</option>
                        {validOwners.map(owner => (
                          <option key={owner.resident_id} value={owner.resident_id}>
                            {owner.name} ({owner.resident_id} • Flat {owner.flat})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })()}

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={updating === 'updating-resident'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 rounded-xl shadow-md shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-xs cursor-pointer transition-all mt-1"
              >
                {updating === 'updating-resident' ? (
                  <>
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    {editingResident ? 'UPDATING...' : 'ADDING...'}
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    {editingResident ? 'Update Profile' : 'Add Resident'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Resident Details Modal (Requirement 10) */}
      {selectedResidentDetails && (() => {
        const r = selectedResidentDetails;
        const residentRole = (r.role || r.occupancy_type || 'Owner') as 'Owner' | 'Tenant';
        const isOwner = residentRole === 'Owner';
        const linkedOwner = !isOwner ? residents.find(o => o.resident_id === r.owner_id) : null;
        const linkedTenant = isOwner ? residents.find(t => (t.role === 'Tenant' || t.occupancy_type === 'Tenant' || !!t.tenant_id) && t.owner_id === r.resident_id) : null;

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className={`p-8 text-white flex justify-between items-center ${isOwner ? 'bg-amber-600' : 'bg-indigo-600'}`}>
                <div>
                  <h3 className="text-2xl font-black">Resident Details</h3>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-1">
                    {isOwner ? 'Owner Profile' : 'Tenant Profile'} • {r.resident_id} {!isOwner && r.tenant_id ? `(${r.tenant_id})` : ''}
                  </p>
                </div>
                <button onClick={() => setSelectedResidentDetails(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-6">
                {isOwner ? (
                  <>
                    {/* Owner Resident Details */}
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Resident Details</h4>
                        <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-800">
                          Role: Owner
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resident ID</p>
                          <p className="text-sm font-black text-blue-600 font-mono mt-0.5">{r.resident_id}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</p>
                          <p className="text-sm font-black text-slate-800 mt-0.5">{r.name}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tower</p>
                          <p className="text-sm font-black text-slate-800 mt-0.5">{r.tower}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Floor</p>
                          <p className="text-sm font-black text-slate-800 mt-0.5">{r.floor ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Flat</p>
                          <p className="text-sm font-black text-slate-800 mt-0.5">{r.flat}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Flat Type</p>
                          <p className="text-sm font-black text-indigo-600 mt-0.5">{r.flat_type || (r.bhk ? `${r.bhk}` : 'Smart 2 BHK')}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                          <p className={`text-sm font-black mt-0.5 ${r.status === 'Active' ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {r.status || 'Active'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tenant Details (below Owner Information, Requirement 4 & 5) */}
                    {linkedTenant ? (
                      <div className="bg-indigo-50/60 p-6 rounded-3xl border border-indigo-100 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-indigo-200">
                          <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest">Tenant Details</h4>
                          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-200 text-indigo-800">
                            Tenant Present
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Tenant ID</p>
                            <p className="text-sm font-black text-indigo-700 font-mono mt-0.5">{linkedTenant.tenant_id || 'T001'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Name</p>
                            <p className="text-sm font-black text-slate-800 mt-0.5">{linkedTenant.name}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Flat</p>
                            <p className="text-sm font-black text-slate-800 mt-0.5">{linkedTenant.tower}-{linkedTenant.flat}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Status</p>
                            <p className={`text-sm font-black mt-0.5 ${linkedTenant.status === 'Active' ? 'text-emerald-600' : 'text-slate-500'}`}>
                              {linkedTenant.status || 'Active'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Tenant Present: No</span>
                        <span className="text-[10px] text-slate-400 font-medium">No tenant is linked to this owner</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* For Tenant: Owner Details ABOVE Tenant Details (Requirement 7 & 10) */}
                    <div className="bg-amber-50/60 p-6 rounded-3xl border border-amber-100 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-amber-200">
                        <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest">Owner Details</h4>
                        <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-200 text-amber-800">
                          Linked Owner
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Owner ID</p>
                          <p className="text-sm font-black text-blue-600 font-mono mt-0.5">{linkedOwner?.resident_id || r.owner_id || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Owner Name</p>
                          <p className="text-sm font-black text-slate-800 mt-0.5">{linkedOwner?.name || 'Owner Not Assigned'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Flat</p>
                          <p className="text-sm font-black text-slate-800 mt-0.5">{linkedOwner ? `${linkedOwner.tower}-${linkedOwner.flat}` : `${r.tower}-${r.flat}`}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Status</p>
                          <p className={`text-sm font-black mt-0.5 ${linkedOwner?.status === 'Active' ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {linkedOwner?.status || 'Inactive'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tenant Details */}
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Resident Details</h4>
                        <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-100 text-indigo-800">
                          Role: Tenant
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tenant ID</p>
                          <p className="text-sm font-black text-indigo-600 font-mono mt-0.5">{r.tenant_id || 'T001'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</p>
                          <p className="text-sm font-black text-slate-800 mt-0.5">{r.name}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tower</p>
                          <p className="text-sm font-black text-slate-800 mt-0.5">{r.tower}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Floor</p>
                          <p className="text-sm font-black text-slate-800 mt-0.5">{r.floor ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Flat</p>
                          <p className="text-sm font-black text-slate-800 mt-0.5">{r.flat}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                          <p className={`text-sm font-black mt-0.5 ${r.status === 'Active' ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {r.status || 'Active'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedResidentDetails(null)}
                  className="px-8 py-3 bg-white border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {selectedBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black">Booking Details</h3>
                <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mt-1">{selectedBooking.booking_id || 'PENDING'}</p>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Resident</p>
                  <p className="text-sm font-black text-slate-800">{selectedBooking.name}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tower / Flat</p>
                  <p className="text-sm font-black text-slate-800">T-{selectedBooking.tower} / {selectedBooking.flat}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Amenity</p>
                  <p className="text-sm font-black text-slate-800">{selectedBooking.amenity_name}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                  <p className={`text-sm font-black ${
                    selectedBooking.status === 'Approved' ? 'text-emerald-600' : 
                    selectedBooking.status === 'Pending' ? 'text-amber-600' : 'text-rose-600'
                  }`}>{selectedBooking.status}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Event Information</h4>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Event Name</p>
                      <p className="text-sm font-bold text-slate-800">{selectedBooking.event_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Booking Date</p>
                      <p className="text-sm font-bold text-slate-800">{format(new Date(selectedBooking.booking_date), 'dd MMM yyyy')}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Time & Charges</h4>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time Slot</p>
                      <p className="text-sm font-bold text-slate-800">{selectedBooking.start_time} - {selectedBooking.end_time}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Charges</p>
                      <p className="text-lg font-black text-indigo-600">₹{selectedBooking.charges}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedBooking(null)}
                className="px-8 py-3 bg-white border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complaint Details Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black">Complaint Details</h3>
                <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mt-1">{selectedComplaint.complaint_id}</p>
              </div>
              <button onClick={() => setSelectedComplaint(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Complaint ID</p>
                  <p className="text-sm font-black text-slate-800">{selectedComplaint.complaint_id}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Category</p>
                  <p className="text-sm font-black text-slate-800">{selectedComplaint.category}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tower</p>
                  <p className="text-sm font-black text-slate-800">{selectedComplaint.tower}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Flat Number</p>
                  <p className="text-sm font-black text-slate-800">{selectedComplaint.flat_no}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Resident ID</p>
                  <p className="text-sm font-black text-slate-800">{selectedComplaint.resident_id}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</p>
                  <p className="text-sm font-black text-slate-800">
                    {new Date(selectedComplaint.complaint_date || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Description</h4>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-slate-600 font-medium leading-relaxed">{selectedComplaint.description}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Media Attachment</h4>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  {selectedComplaint.media && selectedComplaint.media.length > 0 ? (
                    <div className="relative group overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <img 
                        src={selectedComplaint.media[0].file_url} 
                        alt="Complaint Media" 
                        className="w-full h-auto max-h-96 object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                      <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                      <p className="text-xs font-bold uppercase tracking-widest">No Media Uploaded</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedComplaint(null)}
                className="px-8 py-3 bg-white border border-slate-200 text-slate-600 text-xs font-black rounded-2xl hover:bg-slate-100 transition-all uppercase tracking-widest"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complaint Comment Modal */}
      {complaintToComment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden">
            <div className={`p-8 text-white relative overflow-hidden ${
              complaintToComment.status === 'Done' ? 'bg-emerald-600' : 
              complaintToComment.status === 'Process' ? 'bg-indigo-600' :
              complaintToComment.status === 'Pending' ? 'bg-amber-600' :
              'bg-rose-600'
            }`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                  {complaintToComment.status === 'Done' ? <CheckCircle2 className="w-7 h-7" /> : 
                   complaintToComment.status === 'Process' ? <RefreshCw className="w-7 h-7" /> :
                   complaintToComment.status === 'Pending' ? <Clock className="w-7 h-7" /> :
                   <Ban className="w-7 h-7" />}
                  {complaintToComment.status === 'Done' ? 'Resolve Complaint' : 
                   complaintToComment.status === 'Process' ? 'Process Complaint' :
                   complaintToComment.status === 'Pending' ? 'Mark as Pending' :
                   'Reject Complaint'}
                </h3>
                <p className="text-white/80 text-xs font-bold mt-2 uppercase tracking-widest">Add a comment for the resident</p>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Comment / Resolution</label>
                <textarea
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder="Enter resolution details or reason for rejection..."
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium min-h-[120px] resize-none bg-slate-50"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setComplaintToComment(null);
                    setAdminComment('');
                  }}
                  className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateComplaintStatus(complaintToComment.id, complaintToComment.status, adminComment)}
                  disabled={updating === complaintToComment.id}
                  className={`flex-[2] px-6 py-4 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${
                    complaintToComment.status === 'Done' 
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' 
                      : complaintToComment.status === 'Process'
                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                      : complaintToComment.status === 'Pending'
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-100'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'
                  }`}
                >
                  {updating === complaintToComment.id ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Change Password</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Secure your admin account</p>
              </div>
              <button onClick={() => setShowChangePasswordModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Old Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                    className="w-full px-5 py-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-900 transition-all font-bold text-sm" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-5 py-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-900 transition-all font-bold text-sm" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-5 py-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-900 transition-all font-bold text-sm" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="flex-1 px-6 py-4 rounded-xl border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating === 'changing-password'}
                  className="flex-[2] px-6 py-4 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  {updating === 'changing-password' ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Update Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBillSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Bills Generated!</h3>
                <p className="text-slate-500 font-medium mt-2">Maintenance bills have been generated and sent to the selected residents successfully.</p>
              </div>
              <button 
                onClick={() => setShowBillSuccessModal(false)}
                className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 uppercase tracking-widest text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Booking Comment Modal */}
      {bookingToComment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden">
            <div className={`p-8 text-white relative overflow-hidden ${
              bookingToComment.status === 'Approved' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                  {bookingToComment.status === 'Approved' ? <CheckCircle2 className="w-7 h-7" /> : <Ban className="w-7 h-7" />}
                  {bookingToComment.status === 'Approved' ? 'Approve Booking' : 'Reject Booking'}
                </h3>
                <p className="text-white/80 text-xs font-bold mt-2 uppercase tracking-widest">Add a comment for the resident</p>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Comment / Reason</label>
                <textarea
                  value={bookingComment}
                  onChange={(e) => setBookingComment(e.target.value)}
                  placeholder="Enter details or reason for rejection..."
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium min-h-[120px] resize-none bg-slate-50"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setBookingToComment(null);
                    setBookingComment('');
                  }}
                  className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleUpdateBookingStatus(bookingToComment.id, bookingToComment.status, bookingComment);
                    setBookingToComment(null);
                    setBookingComment('');
                  }}
                  disabled={updating === bookingToComment.id}
                  className={`flex-[2] px-6 py-4 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${
                    bookingToComment.status === 'Approved' 
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' 
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'
                  }`}
                >
                  {updating === bookingToComment.id ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
