import { useState, useEffect, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { 
  Users,
  CreditCard, 
  MessageSquare, 
  Calendar,
  CheckCircle2, 
  Clock,
  Send,
  Upload,
  ChevronRight,
  Plus,
  Eye,
  X,
  Image as ImageIcon,
  User as UserIcon,
  LogOut,
  Edit,
  EyeOff,
  Building,
  Building2,
  Lock,
  ArrowLeft,
  Home,
  Key,
  ShieldCheck,
  Check,
  Copy,
  Receipt,
  Printer,
  Download,
  AlertCircle,
  FileText,
  Search,
  CheckCircle,
  Megaphone,
  Sparkles,
  DollarSign,
  IndianRupee
} from 'lucide-react';
import AmenityBooking from './AmenityBooking';
import { Resident, MaintenanceRecord, Complaint, Booking } from '../types';
import { societyService } from '../lib/societyService';
import { toast } from 'sonner';
import { format } from 'date-fns';
import NoticeBoard from './NoticeBoard';
import CommunicationCenter from './CommunicationCenter';
import SecurityDashboard from './SecurityDashboard';
import ResidentDocumentsSection from './ResidentDocumentsSection';
import { 
  ViewBillWorkspace, 
  MarkBillPaidWorkspace, 
  BillReceiptWorkspace 
} from './workspaces/MaintenanceWorkspaces';

interface ResidentDashboardProps {
  activeTab: string;
  resident: Resident;
  residents?: Resident[];
  maintenance: MaintenanceRecord[];
  complaints: Complaint[];
  bookings: Booking[];
  onRefresh: () => void;
  onLogout: () => void;
  onUserUpdate?: (updatedUser: Partial<Resident>) => void;
}

export default function ResidentDashboard({ 
  activeTab, 
  resident, 
  residents,
  maintenance, 
  complaints, 
  bookings,
  onRefresh,
  onLogout,
  setActiveTab,
  onUserUpdate
}: ResidentDashboardProps & { setActiveTab: (tab: string) => void }) {
  const societyBookingsSorted = (bookings || [])
    .filter(b => {
      if (!resident.society_id) return true;
      return !b.society_id || b.society_id === resident.society_id;
    })
    .sort((a, b) => {
      const idA = String(a.booking_id || a.id || '');
      const idB = String(b.booking_id || b.id || '');
      const idCompare = idB.localeCompare(idA, undefined, { numeric: true });
      if (idCompare !== 0) return idCompare;

      const dateA = new Date(a.booking_date || a.created_at || 0).getTime();
      const dateB = new Date(b.booking_date || b.created_at || 0).getTime();
      return dateB - dateA;
    });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    name: resident?.name ? String(resident.name) : '',
    phone: resident?.phone ? String(resident.phone) : '',
    email: resident?.email ? String(resident.email) : '',
    profile_photo: resident?.profile_photo || (resident as any)?.avatar || '',
    occupancy_type: ((resident?.role || resident?.occupancy_type || 'Owner') as 'Owner' | 'Tenant'),
    owner_id: resident?.owner_id || null,
    password: resident?.password || 'resident123',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    if (resident) {
      setProfileData(prev => ({
        ...prev,
        name: String(resident.name || ''),
        phone: String(resident.phone || ''),
        email: String(resident.email || ''),
        profile_photo: resident.profile_photo || (resident as any)?.avatar || prev.profile_photo || '',
        occupancy_type: ((resident.role || resident.occupancy_type || 'Owner') as 'Owner' | 'Tenant'),
        owner_id: resident.owner_id || null,
        password: resident.password || prev.password || 'resident123'
      }));
    }
  }, [resident?.name, resident?.phone, resident?.email, resident?.profile_photo, resident?.resident_id, resident?.role, resident?.occupancy_type, resident?.owner_id, resident?.password]);

  // Determine role, status, and linked owner/tenant
  const residentRole: 'Owner' | 'Tenant' = (resident.role || resident.occupancy_type || profileData.occupancy_type || 'Owner') as 'Owner' | 'Tenant';
  const isOwner = residentRole === 'Owner';
  const residentStatus: 'Active' | 'Inactive' = (resident.status ? (resident.status.toLowerCase() === 'active' ? 'Active' : 'Inactive') : 'Active') as 'Active' | 'Inactive';

  // For Tenant: find owner strictly using owner_id
  const linkedOwner = !isOwner ? (
    (residents || []).find(r => r.resident_id === (profileData.owner_id || resident.owner_id)) || null
  ) : null;

  // For Owner: find tenant linked through tenant.owner_id === owner.resident_id
  const linkedTenant = isOwner ? (
    (residents || []).find(r => 
      (r.role === 'Tenant' || r.occupancy_type === 'Tenant' || !!r.tenant_id) &&
      r.owner_id === resident.resident_id
    ) || null
  ) : null;

  // Available valid owners for tenant selection
  const availableOwners = (residents || []).filter(r => 
    (r.role === 'Owner' || r.occupancy_type === 'Owner' || !r.role) &&
    r.resident_id !== resident.resident_id
  );

  const [maintenanceFilter, setMaintenanceFilter] = useState({
    month: 'All',
    year: 'All',
    status: 'All'
  });
  const [billSearchTerm, setBillSearchTerm] = useState('');
  const [billsViewMode, setBillsViewMode] = useState<'both' | 'cards' | 'table'>('both');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Escape key handler to easily exit all modals including View Bill
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedBill(null);
        setPayingBill(null);
        setViewingPayment(null);
        setShowEditProfile(false);
        setShowChangePassword(false);
        setShowComplaintSuccessModal(false);
        setSelectedImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [complaintCategory, setComplaintCategory] = useState('');
  const [description, setDescription] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showComplaintSuccessModal, setShowComplaintSuccessModal] = useState(false);
  const [viewAllComplaints, setViewAllComplaints] = useState(false);
  const [viewAllBookings, setViewAllBookings] = useState(false);
  const [selectedBill, setSelectedBill] = useState<MaintenanceRecord | null>(null);

  // Pay Bill & View Payment States
  const [payingBill, setPayingBill] = useState<MaintenanceRecord | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Bank'>('UPI');
  const [demoPin, setDemoPin] = useState('');
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success'>('form');
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    transactionId: string;
    paymentDate: string;
    amount: number;
    method: string;
    lateFee: number;
  } | null>(null);
  const [viewingPayment, setViewingPayment] = useState<MaintenanceRecord | null>(null);

  const handleOpenPayBill = (bill: MaintenanceRecord) => {
    setPayingBill(bill);
    setPaymentMethod('UPI');
    setDemoPin('');
    setPaymentStep('form');
    setPaymentSuccessData(null);
  };

  const handleOpenViewPayment = (bill: MaintenanceRecord) => {
    setViewingPayment(bill);
  };

  const handleProcessPayment = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!payingBill || paymentStep === 'processing') return;
    if (demoPin.length !== 4) {
      toast.error('Please enter a valid 4-digit demo PIN');
      return;
    }

    setPaymentStep('processing');

    const originalAmount = payingBill.amount || 0;
    const isOverdue = new Date(payingBill.due_date).getTime() < new Date().setHours(0, 0, 0, 0);
    const lateFee = payingBill.late_fee !== undefined ? payingBill.late_fee : (isOverdue ? 100 : 0);
    const totalPayable = originalAmount + lateFee;
    const methodName = paymentMethod === 'UPI' ? 'UPI' : 'Account / Bank Transfer';
    const txnDate = new Date();
    const txnId = `TXN${format(txnDate, 'yyyyMMdd')}${Math.floor(1000 + Math.random() * 9000)}`;
    const formattedDate = format(txnDate, 'dd MMMM yyyy, HH:mm');

    setTimeout(async () => {
      try {
        await societyService.updateMaintenanceStatus(payingBill.maintenance_id, 'Paid', {
          payment_method: methodName,
          transaction_id: txnId,
          late_fee: lateFee,
          total_paid: totalPayable,
          payment_date: txnDate.toISOString()
        });

        // Update optimistic state instantly
        setOptimisticPayments(prev => ({
          ...prev,
          [payingBill.maintenance_id]: {
            status: 'Paid',
            payment_date: txnDate.toISOString(),
            payment_method: methodName,
            transaction_id: txnId,
            late_fee: lateFee,
            total_paid: totalPayable
          }
        }));

        setPaymentSuccessData({
          transactionId: txnId,
          paymentDate: formattedDate,
          amount: totalPayable,
          method: methodName,
          lateFee
        });
        setPaymentStep('success');
        toast.success(`Payment of ₹${totalPayable.toLocaleString('en-IN')} successful!`);
        onRefresh();
      } catch (err) {
        console.error('Payment error:', err);
        setOptimisticPayments(prev => ({
          ...prev,
          [payingBill.maintenance_id]: {
            status: 'Paid',
            payment_date: txnDate.toISOString(),
            payment_method: methodName,
            transaction_id: txnId,
            late_fee: lateFee,
            total_paid: totalPayable
          }
        }));
        setPaymentSuccessData({
          transactionId: txnId,
          paymentDate: formattedDate,
          amount: totalPayable,
          method: methodName,
          lateFee
        });
        setPaymentStep('success');
        toast.success(`Payment of ₹${totalPayable.toLocaleString('en-IN')} successful!`);
        onRefresh();
      }
    }, 1200);
  };

  const [optimisticPayments, setOptimisticPayments] = useState<Record<string, Partial<MaintenanceRecord>>>({});

  // Use props directly with memoization instead of re-fetching from the database on every tab click
  const residentMaintenance = useMemo(() => {
    return (maintenance || [])
      .filter(m => m.resident_id === resident.resident_id)
      .map(m => optimisticPayments[m.maintenance_id] ? { ...m, ...optimisticPayments[m.maintenance_id] } : m);
  }, [maintenance, resident.resident_id, optimisticPayments]);

  const myComplaints = useMemo(() => {
    return (complaints || []).filter(c => c.resident_id === resident.resident_id);
  }, [complaints, resident.resident_id]);

  const residentBookings = useMemo(() => {
    return (bookings || []).filter(b => b.resident_id === resident.resident_id);
  }, [bookings, resident.resident_id]);

  // Filter society-wide data (excluding PII for complaints)
  const societyComplaints = (complaints || [])
    .filter(c => {
      // If resident has no society_id, show all (prototype mode)
      if (!resident.society_id) return true;
      // Show if it matches society_id or if complaint has no society_id (legacy)
      return !c.society_id || c.society_id === resident.society_id;
    })
    .map(c => ({
      ...c,
      resident_name: c.resident_name || 'Resident',
      flat_no: c.flat_no || 'N/A',
      tower: c.tower || 'N/A',
      complaint_date: c.complaint_date || new Date().toISOString().split('T')[0]
    }))
    .sort((a, b) => {
      const idA = String(a.complaint_id || a.id || '');
      const idB = String(b.complaint_id || b.id || '');
      const idCompare = idB.localeCompare(idA, undefined, { numeric: true });
      if (idCompare !== 0) return idCompare;

      const dateA = new Date(a.complaint_date || 0).getTime();
      const dateB = new Date(b.complaint_date || 0).getTime();
      return dateB - dateA;
    });

  const myComplaintsSorted = (myComplaints || [])
    .sort((a, b) => {
      const idA = String(a.complaint_id || a.id || '');
      const idB = String(b.complaint_id || b.id || '');
      const idCompare = idB.localeCompare(idA, undefined, { numeric: true });
      if (idCompare !== 0) return idCompare;

      const dateA = new Date(a.complaint_date || 0).getTime();
      const dateB = new Date(b.complaint_date || 0).getTime();
      return dateB - dateA;
    });

  const residentBookingsSorted = (residentBookings || [])
    .sort((a, b) => {
      const idA = String(a.booking_id || a.id || '');
      const idB = String(b.booking_id || b.id || '');
      const idCompare = idB.localeCompare(idA, undefined, { numeric: true });
      if (idCompare !== 0) return idCompare;

      const dateA = new Date(a.booking_date || a.created_at || 0).getTime();
      const dateB = new Date(b.booking_date || b.created_at || 0).getTime();
      return dateB - dateA;
    });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMediaFile(e.target.files[0]);
    }
  };

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleSubmitComplaint = async () => {
    if (submitting) return;
    if (!description.trim() || !complaintCategory.trim()) {
      toast.error('Please provide a category and description.');
      return;
    }
    setSubmitting(true);
    try {
      // Fetch latest resident data to ensure all fields are present
      let residentData = resident;
      if (resident.email) {
        const latestResident = await societyService.getResidentByEmail(resident.email);
        if (latestResident) {
          residentData = latestResident;
        }
      }

      let mediaUrl = '';
      if (mediaFile) {
        try {
          mediaUrl = await societyService.uploadMedia(mediaFile);
        } catch (uploadError: unknown) {
          const uploadMsg = uploadError instanceof Error ? uploadError.message : String(uploadError);
          console.error('Media upload failed, proceeding without media:', uploadError);
          toast.error('Media upload failed: ' + uploadMsg + '. Submitting complaint without attachment.');
          // We continue the execution to allow the complaint to be submitted even if media fails
        }
      }

      const flatNoValue = residentData.flat || residentData.flat_number || '';
      const towerValue = residentData.tower || '';
      const residentIdValue = residentData.resident_id || residentData.id || '';
      const residentName = residentData.name || '';

      if (!residentIdValue || !towerValue || !flatNoValue) {
        toast.error('Your profile is missing required details (Tower/Flat). Please update your profile before submitting a complaint.');
        setSubmitting(false);
        return;
      }

      // Handle flat_no as number if possible for int8 columns
      let finalFlatNo: string | number = flatNoValue;
      if (typeof flatNoValue === 'string' && /^\d+$/.test(flatNoValue)) {
        finalFlatNo = parseInt(flatNoValue, 10);
      }

      await societyService.addComplaint({
        resident_id: residentIdValue,
        resident_name: residentName,
        flat_no: finalFlatNo,
        tower: towerValue,
        category: complaintCategory,
        description,
        status: 'Pending',
        complaint_date: new Date().toISOString().split('T')[0],
        media: mediaUrl ? [{
          media_id: `M_${Date.now()}`,
          complaint_id: '',
          file_url: mediaUrl,
          uploaded_by: residentIdValue,
          society_id: residentData.society_id || ''
        }] : [],
        society_id: residentData.society_id || ''
      });
      
      setComplaintCategory('');
      setDescription('');
      setMediaFile(null);
      setShowComplaintSuccessModal(true);
      toast.success('Complaint submitted successfully!');
      onRefresh();
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error submitting complaint:', error);
      toast.error('Failed to submit complaint: ' + errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const currentBalance = residentMaintenance
    .filter(m => m.status === 'Unpaid')
    .reduce((sum, m) => sum + m.amount, 0);

  const [generatingBill, setGeneratingBill] = useState(false);

  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear().toString();
  const fullMonth = `${currentMonth} ${currentYear}`;

  const hasBillForCurrentMonth = residentMaintenance.find(m => m.month === fullMonth);
  const isPaidForCurrentMonth = hasBillForCurrentMonth?.status === 'Paid';

  const handleGenerateResidentBill = async () => {
    if (hasBillForCurrentMonth) {
      if (isPaidForCurrentMonth) {
        toast.error('Maintenance already paid for this month');
      } else {
        toast.error('Maintenance bill already generated for this month');
      }
      return;
    }

    setGeneratingBill(true);
    try {
      await societyService.createMaintenanceBill({
        resident_id: resident.resident_id,
        resident_name: resident.name,
        flat_no: resident.flat,
        tower: resident.tower,
        month: fullMonth,
        amount: 2500, // Default amount, could be dynamic
        status: 'Unpaid',
        due_date: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
        society_id: resident.society_id,
        generated_by: 'Resident'
      });
      toast.success('Maintenance bill generated successfully!');
      onRefresh();
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      toast.error('Failed to generate bill: ' + errorMsg);
    } finally {
      setGeneratingBill(false);
    }
  };

  const handleProfilePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Profile photo size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setProfileData(prev => ({ ...prev, profile_photo: base64 }));
        try {
          await societyService.updateResident(resident.resident_id, { profile_photo: base64 });
          toast.success('Profile photo updated successfully!');
          if (onUserUpdate) {
            onUserUpdate({ profile_photo: base64 });
          }
          onRefresh();
        } catch {
          toast.error('Failed to update profile photo');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    
    const nameStr = String(profileData.name || '').trim();
    const phoneStr = String(profileData.phone || '').trim();
    const emailStr = String(profileData.email || '').trim();

    if (!nameStr) {
      toast.error('Please enter your full name');
      return;
    }

    if (profileData.newPassword) {
      if (profileData.newPassword !== profileData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      if (profileData.newPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
    }

    setUpdatingProfile(true);
    try {
      const roleValue = (profileData.occupancy_type || 'Owner') as 'Owner' | 'Tenant';
      const updatePayload: Partial<Resident> = {
        name: nameStr,
        phone: phoneStr,
        email: emailStr,
        profile_photo: profileData.profile_photo || resident.profile_photo || null,
        role: roleValue,
        occupancy_type: roleValue,
        owner_id: roleValue === 'Owner' ? null : (profileData.owner_id || resident.owner_id || null)
      };
      if (profileData.newPassword) {
        updatePayload.password = profileData.newPassword;
      }
      
      await societyService.updateResident(resident.resident_id, updatePayload);
      toast.success('Profile updated successfully');
      setShowEditProfile(false);
      if (onUserUpdate) {
        onUserUpdate({
          name: updatePayload.name,
          phone: updatePayload.phone,
          email: updatePayload.email,
          profile_photo: updatePayload.profile_photo || undefined,
          role: updatePayload.role,
          occupancy_type: updatePayload.occupancy_type,
          owner_id: updatePayload.owner_id,
          password: updatePayload.password || resident.password
        });
      }
      onRefresh();
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      toast.error('Failed to update profile: ' + errorMsg);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!profileData.oldPassword) {
      toast.error('Please enter your old password');
      return;
    }
    if (profileData.newPassword !== profileData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (profileData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setUpdatingProfile(true);
    try {
      await societyService.updateResident(resident.resident_id, {
        password: profileData.newPassword
      });
      toast.success('Password updated successfully');
      setShowChangePassword(false);
      
      // Update local state and clear password entry fields
      setProfileData(prev => ({
        ...prev,
        password: profileData.newPassword,
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      if (onUserUpdate) {
        onUserUpdate({
          password: profileData.newPassword
        });
      }
      
      onRefresh();
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      toast.error('Failed to update password: ' + errorMsg);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const renderHeader = () => {
    const isOwner = (profileData.occupancy_type || resident.occupancy_type || 'Owner') === 'Owner';

    return (
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-blue-800 to-indigo-900 p-8 rounded-[2.5rem] shadow-xl shadow-blue-100 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full -ml-24 -mb-24 blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/10">
              <Users className="w-5 h-5 text-blue-300" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">TowerTech-Society</h1>
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-4xl font-black tracking-tight">
                Hello, <span className="text-white drop-shadow-sm">{resident.name}!</span>
              </h2>
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border flex items-center gap-1.5 shadow-sm ${
                isOwner 
                  ? 'bg-amber-400/20 text-amber-200 border-amber-300/40' 
                  : 'bg-emerald-400/20 text-emerald-200 border-emerald-300/40'
              }`}>
                {isOwner ? <Home className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
                {isOwner ? 'Owner' : 'Tenant'}
              </span>
            </div>
            <p className="text-blue-100/80 text-lg font-medium max-w-2xl leading-relaxed">
              Welcome to your TowerTech Resident Dashboard. Here you can manage your maintenance, bookings, and complaints.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-blue-200 font-medium pt-2">
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                <span className="text-[10px] font-black uppercase tracking-tighter opacity-40">Flat:</span>
                <span className="text-xs font-black uppercase tracking-widest">{resident.flat} (T-{resident.tower})</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                <span className="text-[10px] font-black uppercase tracking-tighter opacity-40">Resident Type:</span>
                <span className="text-xs font-black uppercase tracking-widest">{residentRole}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                <span className="text-[10px] font-black uppercase tracking-tighter opacity-40">Status:</span>
                <span className={`text-xs font-black uppercase tracking-widest flex items-center gap-1 ${
                  residentStatus === 'Active' ? 'text-emerald-300' : 'text-rose-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${residentStatus === 'Active' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                  {residentStatus}
                </span>
              </div>
              {!isOwner && linkedOwner && (
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg border border-white/10 text-amber-200">
                  <span className="text-[10px] font-black uppercase tracking-tighter opacity-70">Owner:</span>
                  <span className="text-xs font-black uppercase tracking-widest">{linkedOwner.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                <span className="text-[10px] font-black uppercase tracking-tighter opacity-40">Resident ID:</span>
                <span className="text-xs font-black uppercase tracking-widest">{resident.resident_id}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-end gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowEditProfile(true)}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 transition-all group"
              title="Edit Profile"
            >
              <Edit className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={onLogout}
              className="p-3 bg-rose-500/20 hover:bg-rose-500/30 rounded-2xl border border-rose-500/20 transition-all group"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-rose-300 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </header>
    );
  };

  const renderEditProfileModal = () => {
    const currentPass = profileData.password || resident.password || 'resident123';

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-3 sm:p-4">
        <div className="bg-white w-full max-w-[500px] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200">
          <div className="px-5 py-3 bg-blue-600 text-white flex justify-between items-center shrink-0">
            <div>
              <h3 className="text-base font-black leading-tight">Edit Resident Profile</h3>
              <p className="text-blue-100 text-[10px] font-bold uppercase tracking-wider">Update personal details & credentials</p>
            </div>
            <button onClick={() => setShowEditProfile(false)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleUpdateProfile} className="px-5 py-3.5 space-y-2.5 text-xs">
            {/* Full Name */}
            <div className="space-y-0.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Full Name</label>
              <input 
                type="text"
                required
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 focus:ring-1 focus:ring-blue-500 outline-none font-bold text-xs bg-slate-50/70"
                placeholder="Enter your name"
              />
            </div>

            {/* Residency Role: Owner or Tenant */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Residency Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProfileData({ ...profileData, occupancy_type: 'Owner', owner_id: null })}
                  className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                    profileData.occupancy_type === 'Owner'
                      ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    profileData.occupancy_type === 'Owner' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Home className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-black">Owner</p>
                    <p className="text-[9px] text-slate-500 font-semibold">Flat Owner</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setProfileData({ ...profileData, occupancy_type: 'Tenant', owner_id: profileData.owner_id || availableOwners[0]?.resident_id || 'R001' })}
                  className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                    profileData.occupancy_type === 'Tenant'
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    profileData.occupancy_type === 'Tenant' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Key className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-black">Tenant</p>
                    <p className="text-[9px] text-slate-500 font-semibold">Rental Resident</p>
                  </div>
                </button>
              </div>

              {profileData.occupancy_type === 'Tenant' && (
                <div className="pt-1 space-y-0.5">
                  <label className="text-[8px] font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                    <span>Select Owner</span>
                    <span className="text-slate-400 font-normal lowercase">(flat {resident.flat})</span>
                  </label>
                  <select
                    value={profileData.owner_id || ''}
                    onChange={(e) => setProfileData({ ...profileData, owner_id: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/30 focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-xs text-slate-800"
                    required
                  >
                    <option value="">-- Choose Flat Owner --</option>
                    {availableOwners.map(o => (
                      <option key={o.resident_id} value={o.resident_id}>
                        {o.name} (Flat {o.flat}) - {o.phone}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Phone Number</label>
                <input 
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 focus:ring-1 focus:ring-blue-500 outline-none font-bold text-xs bg-slate-50/70"
                  placeholder="e.g. 9876543210"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 focus:ring-1 focus:ring-blue-500 outline-none font-bold text-xs bg-slate-50/70"
                  placeholder="e.g. resident@tower.com"
                />
              </div>
            </div>

            {/* Password Display Box */}
            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">Account Password</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="p-1 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showCurrentPassword ? "Hide" : "Check"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(currentPass);
                      setCopiedPassword(true);
                      toast.success('Password copied!');
                      setTimeout(() => setCopiedPassword(false), 2000);
                    }}
                    className="p-1 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg text-[10px] font-bold transition-colors"
                    title="Copy password"
                  >
                    {copiedPassword ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-xs">
                <span className="font-bold text-slate-800">
                  {showCurrentPassword ? currentPass : "••••••••••••"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditProfile(false);
                    setShowChangePassword(true);
                  }}
                  className="text-[9px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider cursor-pointer"
                >
                  Change
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={updatingProfile}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 rounded-xl shadow-md shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-xs cursor-pointer transition-all mt-1"
            >
              {updatingProfile ? (
                <>
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  UPDATING...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Save Profile Changes
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  };

  const renderChangePasswordModal = () => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden">
        <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black tracking-tight">Change Password</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Check & secure your resident account</p>
          </div>
          <button onClick={() => setShowChangePassword(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleChangePassword} className="p-8 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
            <div className="relative">
              <input 
                type={showOldPassword ? "text" : "password"} 
                required
                value={profileData.oldPassword}
                onChange={(e) => setProfileData({ ...profileData, oldPassword: e.target.value })}
                className="w-full px-5 py-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-900 transition-all font-bold text-sm pr-10" 
                placeholder="Enter your current password"
              />
              <button 
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title={showOldPassword ? "Hide password" : "Check password"}
              >
                {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
            <div className="relative">
              <input 
                type={showNewPassword ? "text" : "password"} 
                required
                value={profileData.newPassword}
                onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                className="w-full px-5 py-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-900 transition-all font-bold text-sm pr-10" 
                placeholder="At least 6 characters"
              />
              <button 
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title={showNewPassword ? "Hide password" : "Check password"}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                required
                value={profileData.confirmPassword}
                onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                className="w-full px-5 py-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-900 transition-all font-bold text-sm pr-10" 
                placeholder="Re-enter new password"
              />
              <button 
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title={showConfirmPassword ? "Hide password" : "Check password"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={() => setShowChangePassword(false)}
              className="flex-1 px-6 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updatingProfile}
              className="flex-[2] px-6 py-3.5 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {updatingProfile ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderBillModal = () => {
    if (!selectedBill) return null;

    const isPaid = selectedBill.status === 'Paid';
    const isOverdue = !isPaid && new Date(selectedBill.due_date).getTime() < new Date().setHours(0, 0, 0, 0);
    const lateFee = selectedBill.late_fee !== undefined ? selectedBill.late_fee : (isOverdue ? 100 : 0);
    const baseMaintenance = selectedBill.amount ? Math.round(selectedBill.amount * 0.8) : 2000;
    const commonServices = selectedBill.amount ? Math.round(selectedBill.amount * 0.12) : 300;
    const securityFacility = (selectedBill.amount || 2500) - baseMaintenance - commonServices;
    const totalPayable = (selectedBill.amount || 0) + lateFee;
    const totalPaid = selectedBill.total_paid || ((selectedBill.amount || 0) + (selectedBill.late_fee || 0));

    return (
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-[120] p-3 sm:p-6 animate-in fade-in duration-200 overflow-y-auto"
        onClick={() => setSelectedBill(null)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bill-modal-title"
      >
        <div 
          className="bg-white w-full max-w-2xl rounded-3xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 my-auto max-h-[94vh] flex flex-col animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="p-6 sm:p-7 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative shrink-0 border-b border-white/10">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex justify-between items-start relative z-10 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-white/10 rounded-lg text-indigo-300">
                    <Receipt className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">
                    Official Society Maintenance Bill
                  </span>
                </div>
                <h3 id="bill-modal-title" className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-3">
                  <span>{selectedBill.month} Bill</span>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    isPaid ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {isPaid ? 'PAID & SETTLED' : (isOverdue ? 'OVERDUE' : 'PAYMENT DUE')}
                  </span>
                </h3>
                <p className="text-slate-300 text-xs font-medium">
                  Invoice ID: <span className="font-mono text-indigo-300 font-bold">{selectedBill.maintenance_id}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.print()}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition-colors"
                  title="Print Invoice"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button 
                  onClick={() => setSelectedBill(null)} 
                  className="p-2.5 hover:bg-white/15 bg-white/5 text-slate-300 hover:text-white rounded-2xl transition-all border border-white/10 group flex items-center gap-1"
                  title="Close (Press Esc to exit)"
                  aria-label="Close Bill Dialog"
                >
                  <span className="text-[11px] font-black uppercase tracking-wider hidden sm:inline text-slate-300 group-hover:text-white mr-1">Exit</span>
                  <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>
            </div>
          </div>

          {/* Modal Body - Scrollable content */}
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6 custom-scrollbar flex-1 bg-slate-50/40">
            {/* Society & Resident Header Info */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-wider">
                  <Building2 className="w-4 h-4" />
                  <span>TowerTech Society</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Cooperative Housing Society Ltd.</p>
                <p className="text-[11px] text-slate-400">Green Park Residency, TowerTech Avenue</p>
                <p className="text-[11px] text-slate-400">GSTIN / Reg No: TWR-2026-CHSL-8841</p>
              </div>

              <div className="space-y-1 sm:border-l sm:border-slate-100 sm:pl-5">
                <div className="flex items-center gap-2 text-slate-700 font-black text-xs uppercase tracking-wider">
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  <span>Billed To Resident</span>
                </div>
                <p className="text-sm font-black text-slate-900">{selectedBill.resident_name || resident.name}</p>
                <p className="text-xs font-bold text-slate-600">Tower {selectedBill.tower} • Flat {selectedBill.flat_no}</p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 font-medium">
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-black uppercase text-slate-600">
                    {profileData.occupancy_type || resident.occupancy_type || 'Owner'}
                  </span>
                  <span>ID: {selectedBill.resident_id || resident.resident_id}</span>
                </div>
              </div>
            </div>

            {/* Bill Schedule & Timing Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Billing Period</p>
                <p className="font-black text-slate-800 text-sm mt-0.5">{selectedBill.month}</p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Due Date</p>
                <p className={`font-bold text-sm mt-0.5 ${isOverdue ? 'text-rose-600 font-black' : 'text-slate-800'}`}>
                  {format(new Date(selectedBill.due_date), 'dd MMM yyyy')}
                </p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Payment Status</p>
                <p className={`font-black text-sm mt-0.5 ${isPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedBill.status}
                </p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  {isPaid ? 'Amount Paid' : 'Total Due'}
                </p>
                <p className="font-black text-slate-900 text-sm mt-0.5">
                  ₹{(isPaid ? totalPaid : totalPayable).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Itemized Line Items Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-100/70 border-b border-slate-200/70 flex justify-between items-center">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Itemized Charge Breakdown</h4>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Tariff Schedule 2026</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="p-3.5 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-800">Flat Base Maintenance Charge</p>
                    <p className="text-[11px] text-slate-400">Regular upkeep, building structure, painting & gardening</p>
                  </div>
                  <span className="font-mono font-bold text-slate-800 text-sm">₹{baseMaintenance.toLocaleString('en-IN')}.00</span>
                </div>
                <div className="p-3.5 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-800">Common Area Electricity & Lift Operations</p>
                    <p className="text-[11px] text-slate-400">Corridor lighting, automatic lifts & DG generator backup</p>
                  </div>
                  <span className="font-mono font-bold text-slate-800 text-sm">₹{commonServices.toLocaleString('en-IN')}.00</span>
                </div>
                <div className="p-3.5 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-800">24/7 Security & Water Sanitation Facility</p>
                    <p className="text-[11px] text-slate-400">Gate security personnel, CCTV surveillance & pump maintenance</p>
                  </div>
                  <span className="font-mono font-bold text-slate-800 text-sm">₹{securityFacility.toLocaleString('en-IN')}.00</span>
                </div>
                {lateFee > 0 && (
                  <div className="p-3.5 flex justify-between items-center bg-amber-50/50">
                    <div>
                      <p className="font-bold text-amber-900 flex items-center gap-1.5">
                        <span>Late Payment Surcharge</span>
                        <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-black uppercase">Overdue Fee</span>
                      </p>
                      <p className="text-[11px] text-amber-700">Applied for settlement past due date ({format(new Date(selectedBill.due_date), 'dd MMM yyyy')})</p>
                    </div>
                    <span className="font-mono font-black text-amber-700 text-sm">+₹{lateFee.toLocaleString('en-IN')}.00</span>
                  </div>
                )}
                <div className="p-4 bg-slate-50 flex justify-between items-center border-t-2 border-slate-200">
                  <div>
                    <p className="text-xs font-black text-slate-900 uppercase tracking-wider">Total {isPaid ? 'Settled' : 'Payable'} Amount</p>
                    <p className="text-[10px] text-slate-500 font-medium">All municipal & society dues inclusive</p>
                  </div>
                  <span className="text-xl font-black text-indigo-700 font-mono">
                    ₹{(isPaid ? totalPaid : totalPayable).toLocaleString('en-IN')}.00
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Audit Record if Paid */}
            {isPaid && selectedBill.payment_date && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-black text-emerald-900 uppercase text-[10px] tracking-wider">Payment Verified & Settled</p>
                    <p className="text-emerald-800 font-medium text-xs">
                      Paid on {format(new Date(selectedBill.payment_date), 'dd MMMM yyyy, HH:mm')}
                    </p>
                    {selectedBill.transaction_id && (
                      <p className="text-[10px] font-mono font-bold text-emerald-700 mt-0.5">
                        Txn ID: {selectedBill.transaction_id}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    const billToView = selectedBill;
                    setSelectedBill(null);
                    handleOpenViewPayment(billToView);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm shrink-0 flex items-center justify-center gap-1.5"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  View Full Receipt
                </button>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="p-5 sm:p-6 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <button 
              onClick={() => setSelectedBill(null)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Exit Bill View
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {isPaid ? (
                <button 
                  onClick={() => {
                    const billToView = selectedBill;
                    setSelectedBill(null);
                    handleOpenViewPayment(billToView);
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  View Payment Receipt
                </button>
              ) : (
                <button 
                  onClick={() => {
                    const billToPay = selectedBill;
                    setSelectedBill(null);
                    handleOpenPayBill(billToPay);
                  }}
                  className="w-full sm:w-auto px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Pay Bill Now (₹{totalPayable.toLocaleString('en-IN')})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPayBillModal = () => {
    if (!payingBill) return null;

    const originalAmount = payingBill.amount || 0;
    const isOverdue = new Date(payingBill.due_date).getTime() < new Date().setHours(0, 0, 0, 0);
    const lateFee = payingBill.late_fee !== undefined ? payingBill.late_fee : (isOverdue ? 100 : 0);
    const totalPayable = originalAmount + lateFee;

    return (
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-[150] p-3 sm:p-6 animate-in fade-in duration-200 overflow-y-auto"
        onClick={() => {
          if (paymentStep !== 'processing') {
            setPayingBill(null);
            setPaymentSuccessData(null);
            setPaymentStep('form');
          }
        }}
        role="dialog"
        aria-modal="true"
      >
        <div 
          className="bg-white w-full max-w-xl rounded-3xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[94vh] my-auto animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="p-6 sm:p-7 bg-gradient-to-r from-indigo-700 via-indigo-800 to-violet-900 text-white relative shrink-0 border-b border-indigo-600/30">
            <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
            <div className="flex justify-between items-start relative z-10 gap-3">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-indigo-100 mb-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-white" />
                  TowerTech Payment Gateway
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">Pay Maintenance Bill</h3>
                <p className="text-indigo-100 text-xs font-medium mt-0.5 opacity-90">
                  {payingBill.month} • Tower {payingBill.tower} - Flat {payingBill.flat_no}
                </p>
              </div>
              {paymentStep !== 'processing' && (
                <button 
                  onClick={() => {
                    setPayingBill(null);
                    setPaymentSuccessData(null);
                    setPaymentStep('form');
                  }} 
                  className="p-2.5 hover:bg-white/15 bg-white/5 rounded-2xl transition-colors text-white border border-white/10"
                  title="Close payment window (Esc)"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/40">
            {paymentStep === 'form' && (
              <form onSubmit={handleProcessPayment} className="space-y-6">
                {/* 1. Bill Summary */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill Summary</span>
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                      ID: {payingBill.maintenance_id}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing Month</p>
                      <p className="font-bold text-slate-800">{payingBill.month}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Flat Number</p>
                      <p className="font-bold text-slate-800">Tower {payingBill.tower} - Flat {payingBill.flat_no}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</p>
                      <p className="font-bold text-slate-800">{format(new Date(payingBill.due_date), 'dd MMM yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Amount</p>
                      <p className="font-bold text-slate-800">₹{originalAmount.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                    {lateFee > 0 && (
                      <div className="flex justify-between items-center text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg">
                        <span className="font-bold flex items-center gap-1.5 text-xs">
                          Late Fee (Overdue):
                        </span>
                        <span className="font-black font-mono">
                          +₹{lateFee.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Total Payable Amount:</span>
                      <span className="text-2xl font-black text-indigo-600 font-mono">₹{totalPayable.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Payment Method Options */}
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Select Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('UPI')}
                      className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                        paymentMethod === 'UPI'
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-600/20 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        paymentMethod === 'UPI' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black">UPI Gateway</p>
                        <p className="text-[10px] text-slate-400 font-medium">Demo Instant UPI</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Bank')}
                      className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                        paymentMethod === 'Bank'
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-600/20 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        paymentMethod === 'Bank' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Building className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black">Net Banking</p>
                        <p className="text-[10px] text-slate-400 font-medium">Demo Bank Transfer</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 3. Method Specific Flow */}
                {paymentMethod === 'UPI' ? (
                  <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Virtual Payment Address</p>
                        <p className="font-bold text-slate-800">towertech.society@bank</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payee</p>
                        <p className="font-bold text-slate-800">TowerTech Housing Society</p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                        Enter 4-Digit Demo UPI PIN
                      </label>
                      <input 
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        required
                        placeholder="••••"
                        value={demoPin}
                        onChange={(e) => setDemoPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-white font-black text-center tracking-[0.6em] text-xl outline-none focus:ring-2 focus:ring-indigo-600 transition-all placeholder:text-sm placeholder:tracking-normal placeholder:font-medium"
                      />
                      <p className="text-[10px] text-slate-400 font-medium mt-1.5 ml-1">
                        Demo PIN: Enter any 4 numbers (e.g. <span className="font-bold text-indigo-600">1234</span>)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Society Bank</p>
                        <p className="font-bold text-slate-800">State Bank of India</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IFSC Code</p>
                        <p className="font-mono font-bold text-slate-800">SBIN0004921</p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                        Enter 4-Digit Transaction PIN
                      </label>
                      <input 
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        required
                        placeholder="••••"
                        value={demoPin}
                        onChange={(e) => setDemoPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-white font-black text-center tracking-[0.6em] text-xl outline-none focus:ring-2 focus:ring-indigo-600 transition-all placeholder:text-sm placeholder:tracking-normal placeholder:font-medium"
                      />
                      <p className="text-[10px] text-slate-400 font-medium mt-1.5 ml-1">
                        Demo PIN: Enter any 4 numbers (e.g. <span className="font-bold text-indigo-600">1234</span>)
                      </p>
                    </div>
                  </div>
                )}

                {/* Form Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPayingBill(null);
                      setPaymentSuccessData(null);
                      setPaymentStep('form');
                    }}
                    className="flex-1 px-6 py-4 rounded-xl border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={demoPin.length !== 4}
                    className="flex-[2] px-6 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Pay Now • ₹{totalPayable.toLocaleString('en-IN')}
                  </button>
                </div>
              </form>
            )}

            {paymentStep === 'processing' && (
              <div className="py-12 px-4 text-center space-y-6">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                  <Lock className="w-7 h-7 text-indigo-600 absolute" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-black text-slate-900">Processing Payment...</h4>
                  <p className="text-slate-500 text-xs font-medium max-w-xs mx-auto">
                    Authorizing demo transaction with payment gateway.
                  </p>
                </div>
                <div className="w-48 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
                  <div className="w-full h-full bg-indigo-600 rounded-full animate-pulse" />
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Please do not refresh or close this window
                </p>
              </div>
            )}

            {paymentStep === 'success' && paymentSuccessData && (
              <div className="space-y-6 animate-in zoom-in-95 duration-200">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 tracking-tight">Payment Successful!</h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Your maintenance bill has been marked as <span className="text-emerald-600 font-black">PAID</span>.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3.5 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Transaction ID</span>
                    <span className="font-mono font-black text-indigo-600">{paymentSuccessData.transactionId}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Bill ID</span>
                    <span className="font-black text-slate-800">{payingBill.maintenance_id}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Flat Details</span>
                    <span className="font-bold text-slate-800">Tower {payingBill.tower} - Flat {payingBill.flat_no}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Payment Date</span>
                    <span className="font-bold text-slate-800">{paymentSuccessData.paymentDate}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Payment Amount</span>
                    <span className="font-black text-emerald-600 text-sm">₹{paymentSuccessData.amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setPayingBill(null);
                    setPaymentSuccessData(null);
                    setPaymentStep('form');
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
                >
                  Close & Back to Bills
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderViewPaymentModal = () => {
    if (!viewingPayment) return null;

    const originalAmount = viewingPayment.amount || 0;
    const lateFee = viewingPayment.late_fee || 0;
    const totalPaid = viewingPayment.total_paid || (originalAmount + lateFee);
    const txnId = viewingPayment.transaction_id || `TXN${viewingPayment.maintenance_id.replace(/\D/g, '') || '20260925'}1234`;
    const paymentDateStr = viewingPayment.payment_date 
      ? format(new Date(viewingPayment.payment_date), 'dd MMMM yyyy, HH:mm') 
      : '25 September 2026';

    return (
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-[150] p-3 sm:p-6 animate-in fade-in duration-200 overflow-y-auto"
        onClick={() => setViewingPayment(null)}
        role="dialog"
        aria-modal="true"
      >
        <div 
          className="bg-white w-full max-w-xl rounded-3xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col my-auto max-h-[94vh] animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 sm:p-7 bg-gradient-to-r from-emerald-700 via-teal-800 to-emerald-900 text-white relative shrink-0 border-b border-emerald-600/30">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
            <div className="flex justify-between items-start relative z-10 gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/20 text-[10px] font-black uppercase tracking-widest text-white mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified Society Payment Receipt
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">Payment Receipt</h3>
                <p className="text-emerald-100 text-xs font-medium mt-0.5">
                  {viewingPayment.month} Maintenance • T-{viewingPayment.tower} / {viewingPayment.flat_no}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold text-white transition-colors"
                  title="Print receipt"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button 
                  onClick={() => setViewingPayment(null)}
                  className="p-2.5 hover:bg-white/20 bg-white/10 rounded-2xl transition-colors text-white border border-white/15"
                  title="Close receipt (Esc)"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Receipt Body */}
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/40">
            <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800">Settlement Status</p>
                  <p className="text-sm font-black text-emerald-900">PAID & VERIFIED</p>
                </div>
              </div>
              <span className="text-base font-black text-emerald-800 bg-white px-3.5 py-1.5 rounded-xl border border-emerald-200 font-mono shadow-2xs">
                ₹{totalPaid.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Bill Reference ID</span>
                <span className="font-black text-slate-800 font-mono">{viewingPayment.maintenance_id}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Billing Month</span>
                <span className="font-bold text-slate-800">{viewingPayment.month}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Resident Name</span>
                <span className="font-bold text-slate-800">{viewingPayment.resident_name || resident.name}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Flat Details</span>
                <span className="font-bold text-slate-800">Tower {viewingPayment.tower} - Flat {viewingPayment.flat_no}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Transaction Reference</span>
                <span className="font-mono font-black text-indigo-600">{txnId}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Payment Method</span>
                <span className="font-bold text-slate-800">{viewingPayment.payment_method || 'UPI / Bank Transfer'}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Payment Timestamp</span>
                <span className="font-bold text-slate-800">{paymentDateStr}</span>
              </div>
              {lateFee > 0 && (
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Late Fee</span>
                  <span className="font-bold text-amber-600">₹{lateFee.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-900 font-black uppercase text-xs tracking-wider">Total Amount Settled</span>
                <span className="text-xl font-black text-slate-900 font-mono">₹{totalPaid.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewingPayment(null)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-slate-200"
              >
                Exit Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': {
        if (!isOwner) {
          // Dedicated Tenant Dashboard View
          return (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              {/* Tenant Hero Welcome Banner */}
              <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden border border-purple-900/50">
                <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-purple-500/30 text-purple-200 border border-purple-400/40 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-2xs">
                        <Key className="w-3.5 h-3.5 text-purple-300" />
                        Dedicated Tenant Portal
                      </span>
                      <span className="bg-white/10 text-white font-mono font-black px-3 py-1 rounded-full text-xs border border-white/10">
                        Tenant ID: {resident.tenant_id || 'T001'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                        residentStatus === 'Active' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                      }`}>
                        Tenant Status: {residentStatus}
                      </span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                      <span>Hello, {resident.name}</span>
                    </h2>
                    <p className="text-purple-200 text-sm max-w-xl font-medium leading-relaxed">
                      Welcome to your custom Tenant Portal. View your rental occupancy details, settle maintenance dues, manage complaints, and contact your property landlord.
                    </p>

                    <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
                      <span className="bg-white/10 px-3 py-1.5 rounded-xl text-purple-100 font-bold flex items-center gap-1.5 border border-white/5">
                        <Home className="w-3.5 h-3.5 text-purple-300" />
                        Tower {resident.tower} • Flat {resident.flat}
                      </span>
                      <span className="bg-white/10 px-3 py-1.5 rounded-xl text-purple-100 font-bold border border-white/5">
                        Resident ID: {resident.resident_id}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                    <button
                      onClick={() => setActiveTab('maintenance')}
                      className="px-5 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-purple-950/50 flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      Pay Maintenance Dues
                    </button>
                    <button
                      onClick={() => setActiveTab('complaints')}
                      className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider transition-all border border-white/20 flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Lodge Complaint
                    </button>
                  </div>
                </div>
              </div>

              {/* Dedicated Landlord / Property Owner Card */}
              <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-200 shrink-0 shadow-2xs">
                      <Home className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                          Property Owner / Landlord
                        </span>
                        <span className={`text-xs font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md border ${
                          linkedOwner?.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          Owner Status: {linkedOwner?.status || 'Active'}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                        {linkedOwner ? linkedOwner.name : (resident.owner_name || 'Deepak Yadav')}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        Owner ID: <span className="font-mono font-bold text-slate-700">{linkedOwner?.resident_id || resident.owner_id || 'R021'}</span> • Flat: <span className="font-bold text-slate-700">{linkedOwner?.tower || resident.tower}-{linkedOwner?.flat || resident.flat}</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto">
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Landlord Contact</p>
                        <p className="text-xs font-black text-slate-800">{linkedOwner?.phone || '9000000021'}</p>
                      </div>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-800 shrink-0">
                        <Send className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                        <p className="text-xs font-black text-slate-800 truncate max-w-[140px]">{linkedOwner?.email || 'deepak201@gvsociety.com'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Tenant Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button 
                  onClick={() => setActiveTab('maintenance')}
                  className="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 rounded-[2rem] text-white shadow-xl shadow-purple-100 text-left relative overflow-hidden group transition-all hover:scale-[1.02]"
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-purple-600">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Maintenance & Dues</p>
                    <h3 className="text-2xl font-black">
                      {residentMaintenance.some(m => m.status === 'Unpaid') ? 'Payment Pending' : 'All Dues Paid'}
                    </h3>
                  </div>
                </button>

                <button 
                  onClick={() => setActiveTab('complaints')}
                  className="bg-gradient-to-br from-teal-500 to-emerald-600 p-6 rounded-[2rem] text-white shadow-xl shadow-teal-100 text-left relative overflow-hidden group transition-all hover:scale-[1.02]"
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-teal-600">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">My Tenant Complaints</p>
                    <h3 className="text-2xl font-black">{myComplaints.length} Raised</h3>
                  </div>
                </button>

                <button 
                  onClick={() => setActiveTab('bookings')}
                  className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-[2rem] text-white shadow-xl shadow-amber-100 text-left relative overflow-hidden group transition-all hover:scale-[1.02]"
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-amber-600">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Facility Bookings</p>
                    <h3 className="text-2xl font-black">{residentBookings.length} Active</h3>
                  </div>
                </button>
              </div>

              {/* Tenant Detailed Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tenant Occupancy Record */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                        <Key className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Tenant Profile</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{resident.name}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                      Tenant
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tenant ID</span>
                      <span className="font-mono font-black text-purple-600">{resident.tenant_id || 'T001'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resident ID</span>
                      <span className="font-mono font-black text-blue-600">{resident.resident_id}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tenant Status</span>
                      <span className={`font-black flex items-center gap-1.5 ${residentStatus === 'Active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${residentStatus === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        {residentStatus}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Flat & Tower</span>
                      <span className="font-bold text-slate-900">Tower {resident.tower} • Flat {resident.flat}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Property Owner</span>
                      <span className="font-bold text-amber-700">{linkedOwner ? linkedOwner.name : 'Deepak Yadav'} ({resident.owner_id || 'R021'})</span>
                    </div>
                  </div>
                </div>

                {/* Tenant Maintenance Bills */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Recent Dues</h3>
                    <button onClick={() => setActiveTab('maintenance')} className="text-purple-600 text-[10px] font-black uppercase tracking-widest hover:underline">View All</button>
                  </div>
                  <div className="space-y-3">
                    {residentMaintenance.slice(0, 3).map((m, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900">{m.month}</p>
                            <p className="text-[10px] font-bold text-slate-400">₹{m.amount.toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                        {m.status === 'Paid' ? (
                          <button onClick={() => handleOpenViewPayment(m)} className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">Paid</button>
                        ) : (
                          <button onClick={() => handleOpenPayBill(m)} className="text-[9px] font-black uppercase text-white bg-purple-600 hover:bg-purple-700 px-2.5 py-1 rounded-lg">Pay Dues</button>
                        )}
                      </div>
                    ))}
                    {residentMaintenance.length === 0 && <p className="text-center text-slate-400 text-xs py-4">No records found.</p>}
                  </div>
                </div>

                {/* Tenant Facility Bookings */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Facility Bookings</h3>
                    <button onClick={() => setActiveTab('bookings')} className="text-amber-600 text-[10px] font-black uppercase tracking-widest hover:underline">View All</button>
                  </div>
                  <div className="space-y-3">
                    {residentBookings.slice(0, 3).map((b, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 truncate w-24">{b.amenity_name}</p>
                            <p className="text-[10px] font-bold text-slate-400">{format(new Date(b.booking_date), 'dd MMM yyyy')}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-black uppercase ${b.status === 'Approved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {b.status}
                        </span>
                      </div>
                    ))}
                    {residentBookings.length === 0 && <p className="text-center text-slate-400 text-xs py-4">No bookings yet.</p>}
                  </div>
                </div>
              </div>
            </div>
          );
        }

        const flatType = resident.flat_type || (resident.bhk ? (resident.bhk === '1 BHK' ? 'Smart 1 BHK' : resident.bhk === '3 BHK' ? 'Premium 3 BHK' : 'Smart 2 BHK') : 'Smart 2 BHK');
        const sqft = resident.square_feet || (flatType.includes('1 BHK') ? 520 : flatType.includes('3 BHK') ? 920 : flatType.includes('Premium') ? 720 : 620);
        const bhk = resident.bhk || (flatType.includes('1 BHK') ? '1 BHK' : flatType.includes('3 BHK') ? '3 BHK' : '2 BHK');
        const wing = resident.wing || resident.tower;

        return (
          <div className="flex flex-col gap-5">
            {/* Professional Welcome Banner & Occupancy Distinction */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    isOwner 
                      ? 'bg-amber-400/20 text-amber-200 border-amber-400/30' 
                      : 'bg-purple-400/20 text-purple-200 border-purple-400/30'
                  }`}>
                    {isOwner ? 'OWNER OCCUPIED' : 'TENANT OCCUPIED'}
                  </span>
                  <span className="text-slate-400 text-xs">•</span>
                  <span className="text-slate-200 text-xs font-bold">
                    Flat {resident.flat} (Tower {resident.tower} / Wing {wing})
                  </span>
                  <span className="text-slate-400 text-xs">•</span>
                  <span className="text-indigo-300 text-xs font-mono font-bold">
                    {flatType} • {sqft} sq.ft.
                  </span>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-white">
                  Welcome back, {resident.name}
                </h2>
                {!isOwner && (
                  <p className="text-xs text-slate-400 font-medium">
                    Owner: <span className="font-bold text-amber-300">{linkedOwner?.name || resident.owner_name || 'Deepak Yadav'}</span>
                  </p>
                )}
                <p className="text-slate-400 text-xs font-medium">
                  Green Park Residency • Resident Management Portal
                </p>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActiveTab('documents')}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Upload Documents</span>
                </button>
                <button
                  onClick={() => setActiveTab('maintenance')}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Pay Maintenance</span>
                </button>
                <button
                  onClick={() => setActiveTab('complaints')}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Raise Complaint</span>
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Quick Summary Cards (Solid Vibrant Colors) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button 
                  onClick={() => setActiveTab('maintenance')}
                  className="bg-[#2563EB] p-5 rounded-2xl shadow-lg shadow-blue-500/20 text-white text-left transition-transform hover:-translate-y-0.5 cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center font-black backdrop-blur-xs">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                      residentMaintenance.some(m => m.status === 'Unpaid') ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
                    }`}>
                      {residentMaintenance.some(m => m.status === 'Unpaid') ? 'DUE' : 'CLEARED'}
                    </span>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-white/90 mb-0.5">Maintenance Status</p>
                  <h3 className="text-2xl font-black text-white font-mono tracking-tight">
                    {residentMaintenance.some(m => m.status === 'Unpaid') ? 'Payment Due' : 'All Settled'}
                  </h3>
                  <p className="text-xs text-white/80 font-bold mt-1">
                    {residentMaintenance.filter(m => m.status === 'Unpaid').length} pending bills
                  </p>
                </button>

                <button 
                  onClick={() => setActiveTab('complaints')}
                  className="bg-[#EA580C] p-5 rounded-2xl shadow-lg shadow-orange-500/20 text-white text-left transition-transform hover:-translate-y-0.5 cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center font-black backdrop-blur-xs">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-white/90 mb-0.5">My Complaints</p>
                  <h3 className="text-2xl font-black text-white font-mono tracking-tight">{myComplaints.length} Tickets</h3>
                  <p className="text-xs text-white/80 font-bold mt-1">
                    {myComplaints.filter(c => c.status === 'Pending').length} active in progress
                  </p>
                </button>

                <button 
                  onClick={() => setActiveTab('bookings')}
                  className="bg-[#059669] p-5 rounded-2xl shadow-lg shadow-emerald-500/20 text-white text-left transition-transform hover:-translate-y-0.5 cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center font-black backdrop-blur-xs">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-white/90 mb-0.5">Amenity Bookings</p>
                  <h3 className="text-2xl font-black text-white font-mono tracking-tight">{residentBookings.length} Reservations</h3>
                  <p className="text-xs text-white/80 font-bold mt-1">
                    {residentBookings.filter(b => b.status === 'Approved').length} approved bookings
                  </p>
                </button>
              </div>

              {/* Owner Documents Section on Dashboard (Requirement 3) */}
              <ResidentDocumentsSection 
                resident={resident} 
                isOwner={isOwner} 
                onRefresh={onRefresh} 
              />

            {/* Detailed Info Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Summary Box */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isOwner ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      {isOwner ? <Home className="w-5 h-5" /> : <Key className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 tracking-tight">
                        {isOwner ? 'Owner Profile' : 'Tenant Profile'}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{resident.name}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    isOwner ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}>
                    {isOwner ? 'OWNER OCCUPIED' : 'TENANT OCCUPIED'}
                  </span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Flat Number</span>
                    <span className="font-black text-slate-900">Flat {resident.flat} (Tower {resident.tower})</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">BHK / Type</span>
                    <span className="font-bold text-indigo-600">{flatType} ({sqft} sq.ft.)</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile Number</span>
                    <span className="font-mono font-bold text-slate-800">{resident.phone}</span>
                  </div>
                  {!isOwner && (
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100 bg-purple-50/50 px-2 rounded-lg">
                      <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Owner Name</span>
                      <span className="font-bold text-purple-950">{linkedOwner?.name || resident.owner_name || 'Deepak Yadav'}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resident Status</span>
                    <span className="font-bold text-emerald-600">{residentStatus}</span>
                  </div>
                </div>
              </div>

              {/* Recent Maintenance */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-black text-slate-900 tracking-tight">Recent Bills</h3>
                  <button onClick={() => setActiveTab('maintenance')} className="text-indigo-600 text-[10px] font-bold uppercase tracking-wider hover:underline">View All</button>
                </div>
                <div className="space-y-2.5">
                  {residentMaintenance.slice(0, 3).map((m, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${m.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          <CreditCard className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{m.month}</p>
                          <p className="text-[10px] font-mono text-slate-400">₹{m.amount.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.status === 'Paid' ? (
                          <button
                            onClick={() => handleOpenViewPayment(m)}
                            className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Paid
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenPayBill(m)}
                            className="text-[9px] font-black uppercase text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-0.5 rounded-md transition-colors shadow-2xs flex items-center gap-1"
                          >
                            <CreditCard className="w-3 h-3" />
                            Pay
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {residentMaintenance.length === 0 && <p className="text-center text-slate-400 text-xs py-4">No records found.</p>}
                </div>
              </div>

              {/* Recent Bookings */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-black text-slate-900 tracking-tight">Recent Bookings</h3>
                  <button onClick={() => setActiveTab('bookings')} className="text-amber-600 text-[10px] font-bold uppercase tracking-wider hover:underline">View All</button>
                </div>
                <div className="space-y-2.5">
                  {residentBookings.slice(0, 3).map((b, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 truncate max-w-[100px]">{b.amenity_name}</p>
                          <p className="text-[10px] text-slate-400">{format(new Date(b.booking_date), 'dd MMM yyyy')}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase ${
                        b.status === 'Approved' ? 'text-emerald-600' : 
                        b.status === 'Pending' ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                  {residentBookings.length === 0 && <p className="text-center text-slate-400 text-xs py-4">No bookings yet.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    case 'maintenance': {
        const filteredMaintenance = residentMaintenance.filter(m => {
          const matchesMonth = maintenanceFilter.month === 'All' || m.month.includes(maintenanceFilter.month);
          const matchesYear = maintenanceFilter.year === 'All' || m.month.includes(maintenanceFilter.year);
          const matchesStatus = maintenanceFilter.status === 'All' || m.status === maintenanceFilter.status;
          const searchLower = billSearchTerm.toLowerCase().trim();
          const matchesSearch = !searchLower || 
            (m.maintenance_id && m.maintenance_id.toLowerCase().includes(searchLower)) ||
            (m.month && m.month.toLowerCase().includes(searchLower)) ||
            (m.status && m.status.toLowerCase().includes(searchLower)) ||
            String(m.amount).includes(searchLower);

          return matchesMonth && matchesYear && matchesStatus && matchesSearch;
        });

        const unpaidCount = residentMaintenance.filter(m => m.status === 'Unpaid').length;
        const totalDueAmount = residentMaintenance
          .filter(m => m.status === 'Unpaid')
          .reduce((sum, m) => sum + (m.amount || 0), 0);
        
        const paidCount = residentMaintenance.filter(m => m.status === 'Paid').length;
        const totalPaidAmount = residentMaintenance
          .filter(m => m.status === 'Paid')
          .reduce((sum, m) => sum + (m.total_paid || m.amount || 0), 0);

        return (
          <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
            {/* Top Hero Banner & Resident Summary */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-indigo-300">
                    <Building2 className="w-3.5 h-3.5" />
                    TowerTech Resident Billing Portal
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    My Maintenance & Dues Ledger
                  </h2>
                  <p className="text-slate-300 text-sm max-w-xl font-medium">
                    Review and settle your monthly society maintenance fees, download official tax receipts, and view payment histories.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                    <span className="bg-white/10 px-3 py-1.5 rounded-xl text-slate-200 font-bold flex items-center gap-1.5 border border-white/5">
                      <Home className="w-3.5 h-3.5 text-indigo-300" />
                      Tower {resident.tower} • Flat {resident.flat}
                    </span>
                    <span className="bg-white/10 px-3 py-1.5 rounded-xl text-slate-200 font-bold flex items-center gap-1.5 border border-white/5">
                      <UserIcon className="w-3.5 h-3.5 text-indigo-300" />
                      {profileData.occupancy_type || resident.occupancy_type || 'Owner'}
                    </span>
                    <span className="bg-white/10 px-3 py-1.5 rounded-xl text-slate-200 font-bold font-mono border border-white/5">
                      ID: {resident.resident_id}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-stretch gap-3 w-full lg:w-auto">
                  {!hasBillForCurrentMonth && (
                    <button
                      onClick={handleGenerateResidentBill}
                      disabled={generatingBill}
                      className="px-5 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                    >
                      {generatingBill ? (
                        <>
                          <Clock className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Generate {currentMonth} Bill
                        </>
                      )}
                    </button>
                  )}
                  {unpaidCount > 0 && filteredMaintenance.find(m => m.status === 'Unpaid') && (
                    <button
                      onClick={() => {
                        const firstUnpaid = filteredMaintenance.find(m => m.status === 'Unpaid');
                        if (firstUnpaid) handleOpenPayBill(firstUnpaid);
                      }}
                      className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 shrink-0"
                    >
                      <CreditCard className="w-4 h-4" />
                      Pay Current Dues
                    </button>
                  )}
                </div>
              </div>

              {/* Stat Metric Cards inside hero banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-white/10">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 opacity-80">Total Outstanding</p>
                  <h4 className="text-xl sm:text-2xl font-black text-white mt-1 font-mono">
                    ₹{totalDueAmount.toLocaleString('en-IN')}
                  </h4>
                  <span className={`text-[10px] font-bold mt-1 inline-block ${unpaidCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {unpaidCount > 0 ? `${unpaidCount} bill(s) pending` : 'All cleared'}
                  </span>
                </div>

                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 opacity-80">Total Settled</p>
                  <h4 className="text-xl sm:text-2xl font-black text-white mt-1 font-mono">
                    ₹{totalPaidAmount.toLocaleString('en-IN')}
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-bold mt-1 inline-block">
                    {paidCount} bill(s) paid
                  </span>
                </div>

                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 opacity-80">Total Bills Recorded</p>
                  <h4 className="text-xl sm:text-2xl font-black text-white mt-1">
                    {residentMaintenance.length}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-bold mt-1 inline-block">
                    Lifetime ledger
                  </span>
                </div>

                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 opacity-80">Society Clearance</p>
                  <h4 className="text-base sm:text-lg font-black text-white mt-1 flex items-center gap-1.5">
                    {unpaidCount === 0 ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Good Standing
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> Action Needed
                      </span>
                    )}
                  </h4>
                  <span className="text-[10px] text-slate-300 font-bold mt-1 inline-block">
                    {unpaidCount === 0 ? 'No penalties' : 'Pending settlement'}
                  </span>
                </div>
              </div>
            </div>

            {/* Filter and View Controls Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={billSearchTerm}
                    onChange={(e) => setBillSearchTerm(e.target.value)}
                    placeholder="Search by Bill ID, Month, or Status..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                  {billSearchTerm && (
                    <button 
                      onClick={() => setBillSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <select 
                  value={maintenanceFilter.month}
                  onChange={(e) => setMaintenanceFilter({ ...maintenanceFilter, month: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 cursor-pointer"
                >
                  <option value="All">All Months</option>
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                <select 
                  value={maintenanceFilter.year}
                  onChange={(e) => setMaintenanceFilter({ ...maintenanceFilter, year: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 cursor-pointer"
                >
                  <option value="All">All Years</option>
                  {['2024', '2025', '2026', '2027'].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                <select 
                  value={maintenanceFilter.status}
                  onChange={(e) => setMaintenanceFilter({ ...maintenanceFilter, status: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Paid">Paid Only</option>
                  <option value="Unpaid">Unpaid Only</option>
                </select>

                <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 ml-1">
                  <button
                    onClick={() => setBillsViewMode('both')}
                    className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
                      billsViewMode === 'both' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All Views
                  </button>
                  <button
                    onClick={() => setBillsViewMode('cards')}
                    className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
                      billsViewMode === 'cards' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Cards
                  </button>
                  <button
                    onClick={() => setBillsViewMode('table')}
                    className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
                      billsViewMode === 'table' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Ledger
                  </button>
                </div>
              </div>
            </div>

            {/* View 1: Bill Cards Grid */}
            {(billsViewMode === 'both' || billsViewMode === 'cards') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-base font-black text-slate-900">Maintenance Invoices</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-bold">
                    {filteredMaintenance.length} Invoice{filteredMaintenance.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredMaintenance.map((m, index) => {
                    const isPaid = m.status === 'Paid';
                    const isOverdue = !isPaid && new Date(m.due_date).getTime() < new Date().setHours(0, 0, 0, 0);
                    const lateFee = m.late_fee !== undefined ? m.late_fee : (isOverdue ? 100 : 0);
                    const totalPayable = (m.amount || 0) + lateFee;
                    const totalPaid = m.total_paid || ((m.amount || 0) + (m.late_fee || 0));

                    return (
                      <div 
                        key={`bill-card-item-${m.maintenance_id || index}`}
                        className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between group"
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                                {m.maintenance_id}
                              </span>
                              <h4 className="text-lg font-black text-slate-900 mt-2 tracking-tight">{m.month} Maintenance</h4>
                              <p className="text-xs text-slate-500 font-medium">Tower {m.tower} • Flat {m.flat_no}</p>
                            </div>
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shrink-0 ${
                              isPaid ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                              {isPaid ? 'PAID' : (isOverdue ? 'OVERDUE' : 'UNPAID')}
                            </span>
                          </div>

                          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-baseline justify-between">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {isPaid ? 'Amount Settled' : 'Payable Total'}
                              </p>
                              <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                                ₹{(isPaid ? totalPaid : totalPayable).toLocaleString('en-IN')}
                              </p>
                            </div>
                            {lateFee > 0 && !isPaid && (
                              <div className="text-right">
                                <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md uppercase">
                                  +₹{lateFee} Late Fee
                                </span>
                                <p className="text-[11px] font-bold text-slate-500 mt-0.5">Base: ₹{(m.amount || 0).toLocaleString('en-IN')}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-1">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>Due: {format(new Date(m.due_date), 'dd MMM yyyy')}</span>
                            </div>
                            {isPaid && m.payment_date && (
                              <span className="text-emerald-700 font-bold text-[11px]">
                                Paid: {format(new Date(m.payment_date), 'dd MMM')}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="pt-5 mt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setSelectedBill(m)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-3 px-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                            title="Open detailed invoice modal"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Bill
                          </button>

                          {isPaid ? (
                            <button
                              onClick={() => handleOpenViewPayment(m)}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-black py-3 px-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Receipt
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenPayBill(m)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-100"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Pay Now
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {filteredMaintenance.length === 0 && (
                    <div className="col-span-full bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
                      <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
                      <p className="text-sm font-black text-slate-700">No maintenance bills found matching your search or filters.</p>
                      <button 
                        onClick={() => {
                          setBillSearchTerm('');
                          setMaintenanceFilter({ month: 'All', year: 'All', status: 'All' });
                        }}
                        className="text-xs font-black text-indigo-600 hover:underline"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* View 2: Detailed Full-Screen Ledger Table */}
            {(billsViewMode === 'both' || billsViewMode === 'table') && (
              <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden flex flex-col">
                <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="text-base font-black text-slate-900">Official Society Maintenance Ledger</h3>
                    <p className="text-xs text-slate-500 font-medium">Complete audited record of charges, payments, and receipt vouchers</p>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    Showing {filteredMaintenance.length} of {residentMaintenance.length} Records
                  </span>
                </div>

                <div className="w-full overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/80 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-3 py-3">Bill ID</th>
                        <th className="px-3 py-3">Billing Month</th>
                        <th className="px-3 py-3">Flat Info</th>
                        <th className="px-3 py-3">Amount</th>
                        <th className="px-3 py-3">Due Date</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredMaintenance.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold">
                            No maintenance records found for the selected query.
                          </td>
                        </tr>
                      ) : (
                        filteredMaintenance.map((m, index) => {
                          const isPaid = m.status === 'Paid';
                          const isOverdue = !isPaid && new Date(m.due_date).getTime() < new Date().setHours(0, 0, 0, 0);
                          const lateFee = m.late_fee !== undefined ? m.late_fee : (isOverdue ? 100 : 0);
                          const totalPayable = (m.amount || 0) + lateFee;
                          const totalPaid = m.total_paid || ((m.amount || 0) + (m.late_fee || 0));

                          return (
                            <tr key={m.id || m.maintenance_id || index} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-3 py-3 font-black font-mono text-indigo-600">
                                {m.maintenance_id}
                              </td>
                              <td className="px-3 py-3 font-bold text-slate-900">
                                {m.month}
                              </td>
                              <td className="px-3 py-3 font-medium text-slate-600">
                                Tower {m.tower} • Flat {m.flat_no}
                              </td>
                              <td className="px-3 py-3 font-black font-mono text-slate-900">
                                ₹{(isPaid ? totalPaid : totalPayable).toLocaleString('en-IN')}
                                {lateFee > 0 && !isPaid && (
                                  <span className="text-[9px] block text-amber-600 font-sans font-bold">+₹{lateFee} late fee</span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-slate-600 font-mono">
                                {format(new Date(m.due_date), 'dd MMM yyyy')}
                              </td>
                              <td className="px-3 py-3">
                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase inline-flex items-center gap-1 ${
                                  isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                                  {isPaid ? 'PAID' : (isOverdue ? 'OVERDUE' : 'UNPAID')}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => setSelectedBill(m)}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all font-black text-[10px] uppercase tracking-wider flex items-center gap-1"
                                    title="View Bill Details (Invoice Modal)"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>View</span>
                                  </button>

                                  {isPaid ? (
                                    <button 
                                      onClick={() => handleOpenViewPayment(m)}
                                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl transition-all font-black text-[10px] uppercase tracking-wider flex items-center gap-1 border border-emerald-200"
                                      title="View Payment Receipt"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Receipt</span>
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => handleOpenPayBill(m)}
                                      className="px-3.5 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-all font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-xs"
                                      title="Pay Maintenance Bill"
                                    >
                                      <CreditCard className="w-3.5 h-3.5" />
                                      <span>Pay</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'complaints':
        return (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Raise Complaint Form */}
              <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                  <Plus className="w-6 h-6 text-indigo-600" />
                  Raise a New Complaint
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Complaint Category</label>
                    <select 
                      value={complaintCategory}
                      onChange={(e) => setComplaintCategory(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-sm bg-slate-50 transition-all"
                    >
                      <option value="">Select Category</option>
                      <option value="Electricity Issue">Electricity Issue</option>
                      <option value="Water Supply Issue">Water Supply Issue</option>
                      <option value="Lift Issue">Lift Issue</option>
                      <option value="Cleanliness Issue">Cleanliness Issue</option>
                      <option value="Security Issue">Security Issue</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Description</label>
                    <textarea 
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your issue in detail..."
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none resize-none font-medium text-sm bg-slate-50 transition-all"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Attach Media (Image/Video)</label>
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                        className="hidden" 
                        id="media-upload"
                      />
                      <label 
                        htmlFor="media-upload"
                        className="flex flex-col items-center justify-center gap-3 w-full px-6 py-8 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 cursor-pointer transition-all text-slate-500 font-bold text-sm bg-slate-50/50"
                      >
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600">
                          <Upload className="w-6 h-6" />
                        </div>
                        <span className="truncate max-w-[200px]">{mediaFile ? mediaFile.name : 'Click to upload media'}</span>
                        <p className="text-[10px] text-slate-400 font-medium">Max size: 10MB</p>
                      </label>
                    </div>
                  </div>
                  <button 
                    onClick={handleSubmitComplaint}
                    disabled={submitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-indigo-100 mt-4 uppercase tracking-widest text-xs"
                  >
                    <Send className="w-5 h-5" />
                    {submitting ? 'Submitting...' : 'Submit Complaint'}
                  </button>
                </div>
              </div>

              {/* Complaint History */}
              <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Complaint History</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">Track and view all society complaints</p>
                  </div>
                  <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                    <button 
                      onClick={() => setViewAllComplaints(false)}
                      className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${!viewAllComplaints ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}
                    >
                      My List
                    </button>
                    <button 
                      onClick={() => setViewAllComplaints(true)}
                      className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewAllComplaints ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}
                    >
                      Society
                    </button>
                  </div>
                </div>
                <div className="space-y-6">
                  {(viewAllComplaints ? societyComplaints : myComplaintsSorted).map((c, index) => (
                    <div key={c.complaint_id || c.id || `complaint-${index}`} className="bg-slate-50/50 rounded-3xl border border-slate-100 p-6 hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all group">
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest">
                              {c.complaint_id}
                            </span>
                            <span className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-[10px] font-black rounded-lg uppercase tracking-widest">
                              T-{c.tower} / {c.flat_no}
                            </span>
                            <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black rounded-lg uppercase tracking-widest">
                              {c.resident_name || c.name}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {format(new Date(c.complaint_date || new Date()), 'dd MMM yyyy')}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-slate-800 mb-2">{c.category}</h4>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">{c.description}</p>
                          </div>
                          {c.media && c.media.length > 0 ? (
                            <div className="pt-2">
                              <button 
                                onClick={() => setSelectedImage(c.media![0].file_url)}
                                className="flex items-center gap-2 text-indigo-600 text-[10px] font-black hover:underline group/btn"
                              >
                                <ImageIcon className="w-3 h-3 transition-transform group-hover/btn:scale-110" />
                                VIEW ATTACHMENT
                              </button>
                            </div>
                          ) : (
                            <p className="text-[10px] font-bold text-slate-400 italic pt-2">No Media Uploaded</p>
                          )}
                          {c.admin_comment && (c.resident_id === resident.resident_id) && (
                            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                              <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">Admin Response</p>
                              <p className="text-xs font-bold text-slate-700">{c.admin_comment}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end justify-between gap-4">
                          <span className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-sm flex items-center gap-1.5 ${
                            c.status === 'Done' || c.status === 'Resolved' ? 'bg-emerald-600 text-white' : 
                            c.status === 'Pending' ? 'bg-amber-500 text-white' : 
                            c.status === 'Process' ? 'bg-indigo-600 text-white' :
                            'bg-rose-600 text-white'
                          }`}>
                            {c.status === 'Done' || c.status === 'Resolved' ? 'DONE' : 
                             c.status === 'Pending' ? 'PENDING' : 
                             c.status === 'Process' ? 'PROCESS' : 'REJECT'}
                          </span>
                          {c.media && c.media.length > 0 && (
                            <button 
                              onClick={() => setSelectedImage(c.media![0].file_url)}
                              className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all shadow-sm"
                            >
                              <ImageIcon className="w-6 h-6" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(viewAllComplaints ? societyComplaints : myComplaintsSorted).length === 0 && (
                    <div className="text-center py-20 bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200">
                      <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No complaints found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 'bookings':
        return (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Amenity Booking</h3>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Book facilities and view schedules</p>
                </div>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setViewAllBookings(false)}
                  className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${!viewAllBookings ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Book & My List
                </button>
                <button 
                  onClick={() => setViewAllBookings(true)}
                  className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${viewAllBookings ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Society Schedule
                </button>
              </div>
            </div>

            <div className="min-h-0">
              {viewAllBookings ? (
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
                  <div className="p-6 border-b border-slate-50 shrink-0">
                    <h3 className="text-lg font-black text-slate-900">Society-wide Booking Schedule</h3>
                    <p className="text-xs text-slate-500 font-medium">View all upcoming events and amenity availability</p>
                  </div>
                  <div className="overflow-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest sticky top-0">
                        <tr>
                          <th className="px-8 py-4">Booking ID</th>
                          <th className="px-8 py-4">Amenity</th>
                          <th className="px-8 py-4">Description</th>
                          <th className="px-8 py-4">Date</th>
                          <th className="px-8 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {societyBookingsSorted.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-bold">
                              No bookings found in the society.
                            </td>
                          </tr>
                        ) : (
                          societyBookingsSorted.map((b, index) => (
                            <tr key={b.booking_id || b.id || `booking-all-${index}`} className="hover:bg-slate-50 transition-colors text-xs">
                              <td className="px-8 py-6 font-black text-indigo-600">{b.booking_id}</td>
                              <td className="px-8 py-6">
                                <p className="font-bold text-slate-800">{b.amenity_name}</p>
                                <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">{b.amenity_type}</p>
                              </td>
                              <td className="px-8 py-6 font-medium text-slate-600 max-w-xs truncate">{b.event_name}</td>
                              <td className="px-8 py-6">
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-2 text-slate-800 font-bold">
                                    <Calendar className="w-3 h-3 text-indigo-600" />
                                    {format(new Date(b.booking_date), 'dd MMM yyyy')}
                                  </div>
                                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                                    <Clock className="w-3 h-3" />
                                    {b.time_slot || `${b.start_time} - ${b.end_time}`}
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1.5 w-fit ${
                                  b.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 
                                  b.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                }`}>
                                  {b.status === 'Approved' ? 'APPROVED' : 
                                   b.status === 'Pending' ? 'PENDING' : 'REJECTED'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <AmenityBooking 
                  resident={resident} 
                  onRefresh={onRefresh} 
                />
              )}
            </div>
          </div>
        );

      case 'documents': {
        return (
          <div className="space-y-6 max-w-5xl mx-auto w-full">
            <ResidentDocumentsSection 
              resident={resident} 
              isOwner={isOwner} 
              onRefresh={onRefresh} 
            />
          </div>
        );
      }

      case 'profile': {
        const isOwner = residentRole === 'Owner';
        const flatType = resident.flat_type || (resident.bhk ? (resident.bhk === '1 BHK' ? 'Smart 1 BHK' : resident.bhk === '3 BHK' ? 'Premium 3 BHK' : 'Smart 2 BHK') : 'Smart 2 BHK');
        const sqft = resident.square_feet || (flatType.includes('1 BHK') ? 520 : flatType.includes('3 BHK') ? 920 : flatType.includes('Premium') ? 720 : 620);
        const bhk = resident.bhk || (flatType.includes('1 BHK') ? '1 BHK' : flatType.includes('3 BHK') ? '3 BHK' : '2 BHK');
        const wing = resident.wing || resident.tower;
        const currentPass = profileData.password || resident.password || 'resident123';

        return (
          <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full font-sans">
            {/* Top Profile Hero Card */}
            <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden shrink-0">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-600/30 rounded-2xl flex items-center justify-center border border-indigo-500/30 shrink-0">
                    <UserIcon className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-400" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isOwner ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-purple-400/20 text-purple-300 border border-purple-400/30'
                      }`}>
                        {isOwner ? 'OWNER OCCUPIED' : 'TENANT OCCUPIED'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {residentStatus}
                      </span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white mt-1.5">{resident.name}</h3>
                    <p className="text-slate-400 text-xs font-medium mt-0.5">
                      Flat {resident.flat} (Tower {resident.tower} / Wing {wing}) • {flatType} • {sqft} sq.ft.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowEditProfile(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center gap-2"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={() => setShowChangePassword(true)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-slate-700 flex items-center gap-2"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Password</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Detail Box / Card (Requirement 1) */}
            {isOwner ? (
              <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 font-bold">
                      <Home className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900 tracking-tight">Owner Profile Details</h4>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Property Owner Record & Unit Information</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                    OWNER OCCUPIED
                  </span>
                </div>

                {/* 11 Required Fields for Owner */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Owner Name</p>
                    <p className="font-black text-slate-900 mt-1 text-sm">{resident.name}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Flat Number</p>
                    <p className="font-black text-slate-900 mt-1 text-sm">{resident.flat}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Building / Wing</p>
                    <p className="font-bold text-slate-800 mt-1 text-sm">Tower {resident.tower} / Wing {wing}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Mobile Number</p>
                    <p className="font-mono font-bold text-slate-800 mt-1 text-sm">{resident.phone}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email</p>
                    <p className="font-medium text-slate-700 truncate mt-1">{resident.email || '—'}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Date of Possession</p>
                    <p className="font-bold text-slate-800 mt-1">{resident.possession_date || '15 Jan 2024'}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Resident Status</p>
                    <p className={`font-bold mt-1 ${residentStatus === 'Active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {residentStatus}
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Family Members</p>
                    <p className="font-bold text-slate-800 mt-1">{resident.family_members ? `${resident.family_members} Members` : '3 Members'}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">BHK</p>
                    <p className="font-bold text-slate-800 mt-1">{bhk}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Flat Type</p>
                    <p className="font-bold text-indigo-600 mt-1">{flatType}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Square Feet</p>
                    <p className="font-mono font-bold text-slate-800 mt-1">{sqft} sq.ft.</p>
                  </div>
                </div>

                {/* Embedded Owner Documents Section */}
                <div className="pt-4 border-t border-slate-100">
                  <ResidentDocumentsSection 
                    resident={resident} 
                    isOwner={true} 
                    onRefresh={onRefresh} 
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold">
                      <Key className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900 tracking-tight">Tenant Profile Details</h4>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Your Tenancy & Lease Documentation</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                    TENANT OCCUPIED
                  </span>
                </div>

                {/* 13 Required Fields for Tenant */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tenant Name</p>
                    <p className="font-black text-slate-900 mt-1 text-sm">{resident.name}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Flat Number</p>
                    <p className="font-black text-slate-900 mt-1 text-sm">{resident.flat}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Building / Wing</p>
                    <p className="font-bold text-slate-800 mt-1 text-sm">Tower {resident.tower} / Wing {wing}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Mobile Number</p>
                    <p className="font-mono font-bold text-slate-800 mt-1 text-sm">{resident.phone}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email</p>
                    <p className="font-medium text-slate-700 truncate mt-1">{resident.email || '—'}</p>
                  </div>
                  <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-100">
                    <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Owner Name</p>
                    <p className="font-black text-amber-950 mt-1">{linkedOwner?.name || resident.owner_name || 'Deepak Yadav'}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tenant Status</p>
                    <p className={`font-bold mt-1 ${residentStatus === 'Active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {residentStatus}
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Move-in Date</p>
                    <p className="font-bold text-slate-800 mt-1">{resident.move_in_date || '01 Mar 2025'}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Expected Move-out</p>
                    <p className="font-bold text-slate-800 mt-1">{resident.expected_move_out_date || '28 Feb 2027'}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">BHK</p>
                    <p className="font-bold text-slate-800 mt-1">{bhk}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Flat Type</p>
                    <p className="font-bold text-indigo-600 mt-1">{flatType}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Square Feet</p>
                    <p className="font-mono font-bold text-slate-800 mt-1">{sqft} sq.ft.</p>
                  </div>
                  <div className="col-span-2 sm:col-span-3 md:col-span-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Permanent Address</p>
                    <p className="font-medium text-slate-800 mt-1">{resident.permanent_address || '402, Shivam Enclave, Main Road, Pune, Maharashtra 411038'}</p>
                  </div>
                </div>

                {/* Embedded Tenant Documents Section */}
                <div className="pt-4 border-t border-slate-100">
                  <ResidentDocumentsSection 
                    resident={resident} 
                    isOwner={false} 
                    onRefresh={onRefresh} 
                  />
                </div>
              </div>
            )}

            {/* Profile Form & Settings */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-600" />
                Edit Profile Information
              </h4>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                {/* Profile Picture Upload Card */}
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80 flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative group shrink-0">
                    {profileData.profile_photo || resident.profile_photo || (resident as any).avatar ? (
                      <img 
                        src={profileData.profile_photo || resident.profile_photo || (resident as any).avatar} 
                        alt={resident.name} 
                        className={`w-24 h-24 rounded-3xl object-cover border-4 ${!isOwner ? 'border-purple-500 shadow-lg shadow-purple-100' : 'border-amber-400 shadow-lg shadow-amber-100'}`}
                      />
                    ) : (
                      <div className={`w-24 h-24 rounded-3xl flex items-center justify-center font-black text-3xl border-4 ${
                        !isOwner ? 'bg-purple-600 text-white border-purple-700 shadow-lg shadow-purple-100' : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}>
                        {resident.name.charAt(0)}
                      </div>
                    )}
                    <label className="absolute -bottom-2 -right-2 p-2.5 bg-indigo-600 text-white rounded-2xl cursor-pointer hover:bg-indigo-700 transition-all shadow-md">
                      <Upload className="w-4 h-4" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleProfilePhotoChange} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                  <div className="flex-1 text-center sm:text-left space-y-1">
                    <h5 className="text-sm font-black text-slate-900 uppercase tracking-tight">Upload Profile Photo</h5>
                    <p className="text-xs text-slate-500 font-medium">Personalize your profile across the TowerTech resident portal. Supports JPG, PNG, GIF up to 5MB.</p>
                    <div className="pt-2">
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border border-indigo-200 transition-all shadow-2xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Choose Profile Image</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleProfilePhotoChange} 
                          className="hidden" 
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    type="text"
                    required
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm transition-all"
                    placeholder="Enter your name"
                  />
                </div>

                {/* Residency Role Selection: Owner vs Tenant */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Resident Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setProfileData({ ...profileData, occupancy_type: 'Owner', owner_id: null })}
                      className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 ${
                        profileData.occupancy_type === 'Owner'
                          ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-sm ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${
                        profileData.occupancy_type === 'Owner' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <Home className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black">Owner</p>
                        <p className="text-xs text-slate-500 font-medium">Flat Owner & Permanent Resident</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProfileData({ ...profileData, occupancy_type: 'Tenant', owner_id: profileData.owner_id || availableOwners[0]?.resident_id || 'R001' })}
                      className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 ${
                        profileData.occupancy_type === 'Tenant'
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${
                        profileData.occupancy_type === 'Tenant' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <Key className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black">Tenant</p>
                        <p className="text-xs text-slate-500 font-medium">Rental Resident / Tenant</p>
                      </div>
                    </button>
                  </div>

                  {/* Owner Selection for Tenant */}
                  {profileData.occupancy_type === 'Tenant' && (
                    <div className="pt-2 space-y-1.5 animate-in fade-in">
                      <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                        <span>Select Owner</span>
                        <span className="text-[9px] text-slate-400 font-medium lowercase">(flat {resident.flat})</span>
                      </label>
                      <select
                        value={profileData.owner_id || ''}
                        onChange={(e) => setProfileData({ ...profileData, owner_id: e.target.value })}
                        className="w-full px-5 py-3.5 rounded-2xl border border-indigo-200 bg-indigo-50/30 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm text-slate-800"
                        required
                      >
                        <option value="">-- Choose Flat Owner --</option>
                        {availableOwners.map(o => (
                          <option key={o.resident_id} value={o.resident_id}>
                            {o.name} (Flat {o.flat}) - {o.phone}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 ml-1">
                        Tenants are automatically linked to the registered owner of Flat {resident.flat}.
                      </p>
                    </div>
                  )}
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <input 
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm transition-all"
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm transition-all"
                      placeholder="e.g. resident@tower.com"
                    />
                  </div>
                </div>

                {/* Account Password / Check Password Card */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-slate-600" />
                      <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Account Password</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-slate-100 transition-colors shadow-sm"
                        title={showCurrentPassword ? "Hide password" : "Check / Reveal password"}
                      >
                        {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-indigo-600" />}
                        <span>{showCurrentPassword ? "Hide Password" : "Check Password"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(currentPass);
                          setCopiedPassword(true);
                          toast.success('Password copied to clipboard!');
                          setTimeout(() => setCopiedPassword(false), 2000);
                        }}
                        className="p-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
                        title="Copy password"
                      >
                        {copiedPassword ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 font-mono text-sm">
                    <span className="font-bold text-slate-900 tracking-wider">
                      {showCurrentPassword ? currentPass : "••••••••••••"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowChangePassword(true)}
                      className="text-xs font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-wider"
                    >
                      Change Password
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowChangePassword(true)}
                    className="flex-1 bg-slate-100 text-slate-600 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
                  >
                    Change Password
                  </button>
                  <button 
                    type="submit"
                    disabled={updatingProfile}
                    className="flex-[2] bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                  >
                    {updatingProfile ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      }

      case 'notices':
        return (
          <NoticeBoard 
            user={resident}
            onSwitchTab={(tab) => setActiveTab(tab)}
            onRefresh={onRefresh}
          />
        );

      case 'communication':
        return (
          <CommunicationCenter 
            user={resident}
            onSwitchTab={(tab) => setActiveTab(tab)}
            onRefresh={onRefresh}
          />
        );

      case 'security':
        return (
          <SecurityDashboard 
            user={resident as unknown as User}
            residents={residents || []}
            onLogout={onLogout}
          />
        );

      default:
        return <div className="p-12 text-center text-gray-400">Section coming soon...</div>;
    }
  };

  return (
    <div className="flex flex-col max-w-7xl mx-auto w-full">
      <div className="">
        {renderContent()}
      </div>

      {showEditProfile && renderEditProfileModal()}
      {showComplaintSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Complaint Raised!</h3>
                <p className="text-slate-500 font-medium mt-2">Your complaint has been submitted successfully. Our team will look into it shortly.</p>
              </div>
              <button 
                onClick={() => setShowComplaintSuccessModal(false)}
                className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 uppercase tracking-widest text-xs"
              >
                Got it, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      {showChangePassword && renderChangePasswordModal()}

      {selectedBill && (
        <ViewBillWorkspace
          bill={selectedBill}
          resident={resident}
          onBack={() => setSelectedBill(null)}
          onMarkPaid={(b) => {
            setSelectedBill(null);
            setPayingBill(b);
          }}
          onPrintReceipt={(b) => {
            setSelectedBill(null);
            setViewingPayment(b);
          }}
        />
      )}
      {payingBill && (
        <MarkBillPaidWorkspace
          bill={payingBill}
          resident={resident}
          onBack={() => setPayingBill(null)}
          onConfirm={async (payData) => {
            try {
              const billId = payingBill.maintenance_id || payingBill.id!;
              await societyService.updateMaintenanceStatus(billId, 'Paid');
              toast.success(`Payment of ₹${payData.amount.toLocaleString()} recorded successfully!`);
              setPayingBill(null);
              onRefresh();
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Error';
              toast.error('Failed to record payment: ' + msg);
            }
          }}
        />
      )}
      {viewingPayment && (
        <BillReceiptWorkspace
          bill={viewingPayment}
          resident={resident}
          onBack={() => setViewingPayment(null)}
        />
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          <div className="max-w-full max-h-full flex items-center justify-center">
            <img 
              src={selectedImage} 
              alt="Full view" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
