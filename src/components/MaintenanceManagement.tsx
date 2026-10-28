import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Eye, 
  Printer, 
  Trash2, 
  RefreshCw, 
  X, 
  Users, 
  IndianRupee, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Building2, 
  Layers, 
  ArrowUpRight,
  ShieldCheck,
  FileText,
  User as UserIcon,
  Sparkles,
  LayoutGrid,
  List
} from 'lucide-react';
import { MaintenanceRecord, Resident, User } from '../types';
import { societyService } from '../lib/societyService';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface MaintenanceManagementProps {
  user: User;
  residents: Resident[];
  maintenance: MaintenanceRecord[];
  onRefresh: () => void;
}

export default function MaintenanceManagement({
  user,
  residents,
  maintenance,
  onRefresh
}: MaintenanceManagementProps) {
  // Current date and dynamic months calculation
  const now = new Date();
  const currentMonthName = format(now, 'MMMM yyyy');
  const lastMonthName = format(new Date(now.getFullYear(), now.getMonth() - 1, 1), 'MMMM yyyy');
  const nextMonthName = format(new Date(now.getFullYear(), now.getMonth() + 1, 1), 'MMMM yyyy');

  // Month & Year Filter state
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthName);
  const [selectedYear, setSelectedYear] = useState<string>(String(now.getFullYear()));

  // Search & Filter controls
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Unpaid' | 'Overdue' | 'Partial'>('All');
  const [towerFilter, setTowerFilter] = useState<string>('All');
  const [flatFilter, setFlatFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [selectedBillDetails, setSelectedBillDetails] = useState<MaintenanceRecord | null>(null);
  const [paymentBill, setPaymentBill] = useState<MaintenanceRecord | null>(null);
  const [receiptBill, setReceiptBill] = useState<MaintenanceRecord | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showBulkGenerateModal, setShowBulkGenerateModal] = useState(false);
  const [deletingBillId, setDeletingBillId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Single Bill Form State
  const [billFormData, setBillFormData] = useState({
    resident_id: '',
    tower: 'A',
    flat_no: '101',
    month: currentMonthName,
    amount: 2500,
    previous_due: 0,
    late_fee: 0,
    due_date: format(new Date(now.getFullYear(), now.getMonth(), 10), 'yyyy-MM-dd'),
    notes: 'Monthly society maintenance charges.'
  });

  // Bulk Generation Form State
  const [bulkFormData, setBulkFormData] = useState({
    month: currentMonthName,
    default_amount: 2500,
    due_date: format(new Date(now.getFullYear(), now.getMonth(), 10), 'yyyy-MM-dd'),
    notes: 'Monthly society maintenance charges.'
  });

  // Payment Form State
  const [paymentFormData, setPaymentFormData] = useState({
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: 'UPI',
    transaction_id: '',
    amount_paid: 2500,
    notes: 'Payment received successfully'
  });

  // Unique Towers & Flats
  const towers = useMemo(() => Array.from(new Set(residents.map(r => r.tower))).sort(), [residents]);
  const flats = useMemo(() => Array.from(new Set(residents.map(r => r.flat))).sort(), [residents]);

  // Active Residents Map
  const residentMap = useMemo(() => {
    const map = new Map<string, Resident>();
    residents.forEach(r => map.set(r.resident_id, r));
    return map;
  }, [residents]);

  // Process & Enrich Maintenance Records with Dynamic Overdue Check
  const enrichedMaintenance = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    return (maintenance || []).map(m => {
      const residentObj = residentMap.get(m.resident_id);
      const isPastDue = m.due_date && m.due_date < todayStr;
      
      let computedStatus = m.status || 'Unpaid';
      if (computedStatus.toLowerCase() !== 'paid' && isPastDue) {
        computedStatus = 'Overdue';
      }

      return {
        ...m,
        status: computedStatus,
        resident_name: m.resident_name || residentObj?.name || 'Resident',
        tower: m.tower || residentObj?.tower || 'A',
        flat_no: m.flat_no || residentObj?.flat || '101'
      };
    });
  }, [maintenance, residentMap]);

  // Month-Scoped Records for KPI Calculations
  const monthScopedRecords = useMemo(() => {
    if (selectedMonth === 'All') return enrichedMaintenance;
    return enrichedMaintenance.filter(m => m.month === selectedMonth);
  }, [enrichedMaintenance, selectedMonth]);

  // Dynamic KPI Calculations
  const activeResidentsCount = useMemo(() => {
    return residents.filter(r => (r.status || 'Active') === 'Active').length || residents.length || 90;
  }, [residents]);

  const totalCollectionAmount = useMemo(() => {
    return monthScopedRecords
      .filter(m => m.status === 'Paid')
      .reduce((sum, m) => sum + (Number(m.total_paid || m.amount) || 0), 0);
  }, [monthScopedRecords]);

  const totalPendingAmount = useMemo(() => {
    return monthScopedRecords
      .filter(m => m.status !== 'Paid')
      .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  }, [monthScopedRecords]);

  const paidBillsCount = useMemo(() => {
    return monthScopedRecords.filter(m => m.status === 'Paid').length;
  }, [monthScopedRecords]);

  const unpaidBillsCount = useMemo(() => {
    return monthScopedRecords.filter(m => m.status !== 'Paid').length;
  }, [monthScopedRecords]);

  const totalExpectedAmount = totalCollectionAmount + totalPendingAmount;
  const collectionPercentage = totalExpectedAmount > 0 
    ? Math.round((totalCollectionAmount / totalExpectedAmount) * 100) 
    : 0;

  // Filtered Maintenance Records
  const filteredMaintenance = useMemo(() => {
    return enrichedMaintenance.filter(m => {
      // Month Filter
      if (selectedMonth !== 'All' && m.month !== selectedMonth) {
        return false;
      }

      // Status Filter
      if (statusFilter !== 'All') {
        if (statusFilter === 'Paid' && m.status !== 'Paid') return false;
        if (statusFilter === 'Unpaid' && m.status === 'Paid') return false;
        if (statusFilter === 'Overdue' && m.status !== 'Overdue') return false;
        if (statusFilter === 'Partial' && m.status !== 'Partial') return false;
      }

      // Tower Filter
      if (towerFilter !== 'All' && m.tower !== towerFilter) {
        return false;
      }

      // Flat Filter
      if (flatFilter !== 'All' && m.flat_no !== flatFilter) {
        return false;
      }

      // Search Filter across Bill ID, Resident ID, Name, Flat, Tower
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesId = String(m.maintenance_id || '').toLowerCase().includes(query);
        const matchesResId = String(m.resident_id || '').toLowerCase().includes(query);
        const matchesName = String(m.resident_name || '').toLowerCase().includes(query);
        const matchesFlat = String(m.flat_no || '').toLowerCase().includes(query);
        const matchesTower = String(m.tower || '').toLowerCase().includes(query);

        if (!matchesId && !matchesResId && !matchesName && !matchesFlat && !matchesTower) {
          return false;
        }
      }

      return true;
    });
  }, [enrichedMaintenance, selectedMonth, statusFilter, towerFilter, flatFilter, searchTerm]);

  // Paginated Records
  const totalPages = Math.ceil(filteredMaintenance.length / itemsPerPage) || 1;
  const paginatedMaintenance = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMaintenance.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMaintenance, currentPage, itemsPerPage]);

  // Auto-fill Tower and Flat when resident is selected in single bill generation
  const handleResidentSelectInForm = (resId: string) => {
    const found = residentMap.get(resId);
    if (found) {
      const bhk = found.bhk || '2 BHK';
      const baseAmount = bhk.includes('1 BHK') ? 2000 : bhk.includes('3 BHK') ? 3500 : 2500;
      setBillFormData(prev => ({
        ...prev,
        resident_id: found.resident_id,
        tower: found.tower || 'A',
        flat_no: found.flat || '101',
        amount: baseAmount
      }));
    } else {
      setBillFormData(prev => ({ ...prev, resident_id: resId }));
    }
  };

  // Generate Single Bill
  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billFormData.resident_id) {
      toast.error('Please select a resident');
      return;
    }

    const totalPayable = Number(billFormData.amount) + Number(billFormData.previous_due) + Number(billFormData.late_fee);

    setActionLoading(true);
    try {
      const residentObj = residentMap.get(billFormData.resident_id);
      await societyService.createMaintenanceBill({
        resident_id: billFormData.resident_id,
        resident_name: residentObj?.name || 'Resident',
        society_id: user.society_id || 'GV2026',
        tower: billFormData.tower,
        flat_no: billFormData.flat_no,
        month: billFormData.month,
        amount: totalPayable,
        status: 'Unpaid',
        due_date: billFormData.due_date,
        late_fee: Number(billFormData.late_fee) || 0,
        generated_by: user.name || 'Society Admin'
      });

      toast.success(`Maintenance bill generated for Flat ${billFormData.flat_no} (${billFormData.month})`);
      setShowGenerateModal(false);
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to generate bill: ' + (err?.message || 'Error occurred'));
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Generate Bills for All Active Residents
  const handleBulkGenerateBills = async () => {
    setActionLoading(true);
    try {
      const activeResidents = residents.filter(r => (r.status || 'Active') === 'Active');
      let createdCount = 0;
      let skippedCount = 0;

      for (const res of activeResidents) {
        // Check if bill already exists for this resident and month
        const alreadyExists = maintenance.some(
          m => m.resident_id === res.resident_id && m.month === bulkFormData.month
        );

        if (alreadyExists) {
          skippedCount++;
          continue;
        }

        const bhk = res.bhk || '2 BHK';
        const flatAmount = bhk.includes('1 BHK') ? 2000 : bhk.includes('3 BHK') ? 3500 : Number(bulkFormData.default_amount);

        try {
          await societyService.createMaintenanceBill({
            resident_id: res.resident_id,
            resident_name: res.name,
            society_id: user.society_id || 'GV2026',
            tower: res.tower,
            flat_no: res.flat,
            month: bulkFormData.month,
            amount: flatAmount,
            status: 'Unpaid',
            due_date: bulkFormData.due_date,
            generated_by: user.name || 'Society Admin'
          });
          createdCount++;
        } catch {
          // continue loop
        }
      }

      toast.success(`Bulk Generation Complete: ${createdCount} bills generated, ${skippedCount} already existed.`);
      setShowBulkGenerateModal(false);
      onRefresh();
    } catch (err: any) {
      toast.error('Bulk generation error: ' + (err?.message || 'Error'));
    } finally {
      setActionLoading(false);
    }
  };

  // Mark as Paid
  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentBill) return;

    setActionLoading(true);
    try {
      const billId = paymentBill.maintenance_id || paymentBill.id!;
      const isFullPayment = Number(paymentFormData.amount_paid) >= Number(paymentBill.amount);
      const newStatus = isFullPayment ? 'Paid' : 'Partial';

      await societyService.updateMaintenanceStatus(billId, newStatus as 'Paid', {
        payment_date: paymentFormData.payment_date,
        payment_method: paymentFormData.payment_method,
        transaction_id: paymentFormData.transaction_id || `TXN-${Date.now().toString().slice(-6)}`,
        total_paid: Number(paymentFormData.amount_paid)
      });

      toast.success(`Payment of ₹${Number(paymentFormData.amount_paid).toLocaleString()} recorded for ${paymentBill.maintenance_id}`);
      
      const updatedRecord: MaintenanceRecord = {
        ...paymentBill,
        status: newStatus,
        payment_date: paymentFormData.payment_date,
        payment_method: paymentFormData.payment_method,
        transaction_id: paymentFormData.transaction_id || `TXN-${Date.now().toString().slice(-6)}`,
        total_paid: Number(paymentFormData.amount_paid)
      };

      setPaymentBill(null);
      setReceiptBill(updatedRecord); // Automatically offer receipt
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to record payment: ' + (err?.message || 'Error'));
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Bill
  const handleDeleteBill = async (billId: string) => {
    setActionLoading(true);
    try {
      await societyService.deleteMaintenanceRecord(billId);
      toast.success('Maintenance bill deleted.');
      setDeletingBillId(null);
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to delete bill: ' + (err?.message || 'Error'));
    } finally {
      setActionLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredMaintenance.length === 0) {
      toast.error('No records to export');
      return;
    }

    const headers = ['Bill ID', 'Resident ID', 'Resident Name', 'Tower', 'Flat', 'Amount', 'Billing Month', 'Due Date', 'Payment Date', 'Payment Method', 'Transaction ID', 'Status'];
    const rows = filteredMaintenance.map(m => [
      m.maintenance_id,
      m.resident_id,
      `"${m.resident_name || ''}"`,
      m.tower,
      m.flat_no,
      m.amount,
      `"${m.month}"`,
      m.due_date || '',
      m.payment_date || '',
      m.payment_method || '',
      m.transaction_id || '',
      m.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Maintenance_Report_${selectedMonth.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Maintenance records exported successfully');
  };

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10.5px] font-black uppercase tracking-wider bg-[#059669] text-white shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            PAID
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10.5px] font-black uppercase tracking-wider bg-[#EA580C] text-white shadow-sm">
            <AlertCircle className="w-3.5 h-3.5 text-white" />
            OVERDUE
          </span>
        );
      case 'Partial':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10.5px] font-black uppercase tracking-wider bg-[#6D28D9] text-white shadow-sm">
            <Clock className="w-3.5 h-3.5 text-white" />
            PARTIAL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10.5px] font-black uppercase tracking-wider bg-[#DC2626] text-white shadow-sm">
            <XCircle className="w-3.5 h-3.5 text-white" />
            UNPAID
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full font-sans">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-blue-50/80 via-emerald-50/50 to-slate-50 p-5 rounded-2xl border border-blue-100/90 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Maintenance Management</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                {selectedMonth}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Manage maintenance bills, payments, pending dues and resident maintenance records.
            </p>
          </div>
        </div>

        {/* Month Selector Controls */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setSelectedMonth(lastMonthName)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedMonth === lastMonthName 
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30' 
                : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            {lastMonthName.split(' ')[0]}
          </button>
          <button
            type="button"
            onClick={() => setSelectedMonth(currentMonthName)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all uppercase tracking-wider ${
              selectedMonth === currentMonthName 
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30' 
                : 'text-slate-700 hover:text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            {currentMonthName.split(' ')[0]}
          </button>
          <button
            type="button"
            onClick={() => setSelectedMonth(nextMonthName)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedMonth === nextMonthName 
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30' 
                : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            {nextMonthName.split(' ')[0]}
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1"></div>

          {/* Month & Year Selectors */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent outline-none text-xs font-bold text-slate-700 cursor-pointer pr-2"
          >
            <option value="All">All Months</option>
            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => {
              const optVal = `${m} ${selectedYear}`;
              return <option key={optVal} value={optVal}>{m} {selectedYear}</option>;
            })}
          </select>
        </div>
      </div>

      {/* 2. SUMMARY CARDS (Solid Vibrant Colors) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* TOTAL RESIDENTS: Solid Blue #2563EB */}
        <div className="bg-[#2563EB] p-5 rounded-2xl shadow-lg shadow-blue-500/20 text-white flex flex-col justify-between transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-white/90">Total Residents</span>
            <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center font-black backdrop-blur-xs">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-black text-white font-mono tracking-tight">{activeResidentsCount}</h3>
            <p className="text-[11px] font-bold text-white/80 mt-0.5">Active resident units</p>
          </div>
        </div>

        {/* TOTAL COLLECTION: Solid Green #059669 */}
        <div className="bg-[#059669] p-5 rounded-2xl shadow-lg shadow-emerald-500/20 text-white flex flex-col justify-between transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-white/90">Total Collection</span>
            <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center font-black backdrop-blur-xs">
              <IndianRupee className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-black text-white font-mono tracking-tight">₹{totalCollectionAmount.toLocaleString('en-IN')}</h3>
            <p className="text-[11px] font-bold text-white/80 mt-0.5">Collected this month</p>
          </div>
        </div>

        {/* PENDING AMOUNT: Solid Orange #EA580C */}
        <div className="bg-[#EA580C] p-5 rounded-2xl shadow-lg shadow-orange-500/20 text-white flex flex-col justify-between transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-white/90">Pending Amount</span>
            <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center font-black backdrop-blur-xs">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-black text-white font-mono tracking-tight">₹{totalPendingAmount.toLocaleString('en-IN')}</h3>
            <p className="text-[11px] font-bold text-white/80 mt-0.5">Outstanding maintenance</p>
          </div>
        </div>

        {/* PAID BILLS: Solid Teal #0D9488 */}
        <div className="bg-[#0D9488] p-5 rounded-2xl shadow-lg shadow-teal-500/20 text-white flex flex-col justify-between transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-white/90">Paid Bills</span>
            <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center font-black backdrop-blur-xs">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-black text-white font-mono tracking-tight">{paidBillsCount}</h3>
            <p className="text-[11px] font-bold text-white/80 mt-0.5">Settled bills</p>
          </div>
        </div>

        {/* UNPAID BILLS: Solid Red #DC2626 */}
        <div className="bg-[#DC2626] p-5 rounded-2xl shadow-lg shadow-red-500/20 text-white flex flex-col justify-between transition-transform hover:-translate-y-0.5 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-white/90">Unpaid Bills</span>
            <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center font-black backdrop-blur-xs">
              <XCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-black text-white font-mono tracking-tight">{unpaidBillsCount}</h3>
            <p className="text-[11px] font-bold text-white/80 mt-0.5">Awaiting payment</p>
          </div>
        </div>
      </div>

      {/* 3. QUICK SUMMARY / COLLECTION PROGRESS */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              Monthly Collection Progress ({selectedMonth})
            </h4>
            <p className="text-sm font-extrabold text-slate-900 mt-0.5">
              ₹{totalCollectionAmount.toLocaleString('en-IN')} <span className="text-slate-500 font-normal">collected of</span> ₹{totalExpectedAmount.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
              Paid: <strong>{paidBillsCount}</strong>
            </span>
            <span className="px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold">
              Pending: <strong>{unpaidBillsCount}</strong>
            </span>
            <span className="text-sm font-black text-emerald-700">
              {collectionPercentage}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div 
            className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-500 shadow-xs"
            style={{ width: `${Math.min(collectionPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* 4. MAINTENANCE BILL MANAGEMENT */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col w-full">
        {/* Management Header & Controls */}
        <div className="p-4.5 border-b border-slate-100 bg-slate-50/70 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Maintenance Bills</h3>
              <p className="text-xs font-medium text-slate-500">View, search and manage resident maintenance bills.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setBulkFormData({
                    month: selectedMonth === 'All' ? currentMonthName : selectedMonth,
                    default_amount: 2500,
                    due_date: format(new Date(now.getFullYear(), now.getMonth(), 10), 'yyyy-MM-dd'),
                    notes: 'Monthly society maintenance charges.'
                  });
                  setShowBulkGenerateModal(true);
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Generate All Bills</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5"
                title="Export Filtered Maintenance Records"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-200/80">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by resident name, flat, tower, or bill ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 placeholder-slate-400 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-2xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</span>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent outline-none font-bold text-slate-700 cursor-pointer"
                >
                  <option value="All">All</option>
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Partial">Partial</option>
                </select>
              </div>

              {/* Tower Filter */}
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Tower</span>
                <select
                  value={towerFilter}
                  onChange={(e) => {
                    setTowerFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent outline-none font-bold text-slate-700 cursor-pointer"
                >
                  <option value="All">All</option>
                  {towers.map(t => <option key={t} value={t}>Tower {t}</option>)}
                </select>
              </div>

              {/* Flat Filter */}
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
                <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider">Flat</span>
                <select
                  value={flatFilter}
                  onChange={(e) => {
                    setFlatFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent outline-none font-bold text-slate-700 cursor-pointer"
                >
                  <option value="All">All</option>
                  {flats.map(f => <option key={f} value={f}>Flat {f}</option>)}
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    viewMode === 'cards' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Card Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    viewMode === 'table' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Table View"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>

              {/* Reset Filters */}
              {(searchTerm || statusFilter !== 'All' || towerFilter !== 'All' || flatFilter !== 'All') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('All');
                    setTowerFilter('All');
                    setFlatFilter('All');
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 5. & 6. BILL RECORD CARDS / TABLE VIEW */}
        {filteredMaintenance.length > 0 ? (
          viewMode === 'cards' ? (
            /* RESPONSIVE CARD GRID VIEW (3 cols desktop, 2 cols tablet, 1 col mobile) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4.5 bg-slate-50/50">
              {paginatedMaintenance.map((m) => {
                const isPaid = m.status === 'Paid';
                const isOverdue = m.status === 'Overdue';
                const isPartial = m.status === 'Partial';

                // Accent border color based on status
                const accentBorderClass = isPaid
                  ? 'border-t-[5px] border-t-[#059669]'
                  : isOverdue
                  ? 'border-t-[5px] border-t-[#EA580C]'
                  : isPartial
                  ? 'border-t-[5px] border-t-[#6D28D9]'
                  : 'border-t-[5px] border-t-[#DC2626]';

                return (
                  <div
                    key={m.id || m.maintenance_id}
                    className={`bg-white rounded-2xl border-2 border-slate-200/90 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between ${accentBorderClass} relative group`}
                  >
                    {/* Top Row: Bill ID & Status Badge */}
                    <div className="flex items-center justify-between gap-2 pb-3 border-b-2 border-slate-100">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">BILL ID</span>
                        <span className="font-mono font-black text-[#2563EB] text-sm">{m.maintenance_id}</span>
                      </div>
                      <div>
                        {getStatusBadge(m.status)}
                      </div>
                    </div>

                    {/* Resident Info */}
                    <div className="py-3.5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-[#2563EB] font-black flex items-center justify-center text-sm shrink-0">
                        {m.resident_name ? m.resident_name.charAt(0).toUpperCase() : 'R'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <UserIcon className="w-4 h-4 text-[#2563EB] shrink-0" />
                          <h4 className="font-black text-slate-900 text-sm truncate">{m.resident_name}</h4>
                        </div>
                        <p className="text-[11px] font-mono font-extrabold text-slate-500 mt-0.5">{m.resident_id}</p>
                      </div>
                    </div>

                    {/* Location Badge Box */}
                    <div className="bg-slate-100/90 p-3 rounded-xl border border-slate-200 flex items-center justify-around text-xs font-black text-slate-800 mb-3.5">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-[#2563EB]" />
                        <span>Tower {m.tower}</span>
                      </div>
                      <div className="h-3.5 w-0.5 bg-slate-300"></div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#6D28D9] font-black">🚪</span>
                        <span>Flat {m.flat_no}</span>
                      </div>
                    </div>

                    {/* Billing Details */}
                    <div className="space-y-2 mb-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#EA580C]" />
                          <span>Billing Month</span>
                        </span>
                        <span className="text-xs font-extrabold text-slate-900">{m.month}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
                        <span className="text-xs font-bold text-slate-600">Amount Due</span>
                        <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">₹{Number(m.amount).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-bold pt-1.5 border-t border-slate-200/60">
                        <span className="text-slate-500">Due Date: <strong className="text-slate-800">{m.due_date ? format(new Date(m.due_date), 'dd MMM yyyy') : '—'}</strong></span>
                        <span className="text-slate-500">Paid: <strong className="text-slate-800">{isPaid && m.payment_date ? format(new Date(m.payment_date), 'dd MMM yyyy') : '—'}</strong></span>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100">
                      <button
                        onClick={() => setSelectedBillDetails(m)}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-700" />
                        <span>View Details</span>
                      </button>

                      {!isPaid ? (
                        <button
                          onClick={() => {
                            setPaymentBill(m);
                            setPaymentFormData({
                              payment_date: format(new Date(), 'yyyy-MM-dd'),
                              payment_method: 'UPI',
                              transaction_id: `TXN-${Date.now().toString().slice(-6)}`,
                              amount_paid: Number(m.amount),
                              notes: 'Full payment received'
                            });
                          }}
                          className="flex-1 py-2.5 bg-[#059669] hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Mark Paid</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setReceiptBill(m)}
                          className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-2 border-emerald-200 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Printer className="w-4 h-4 text-[#059669]" />
                          <span>Receipt</span>
                        </button>
                      )}

                      <button
                        onClick={() => setDeletingBillId(m.maintenance_id || m.id!)}
                        className="p-2.5 text-[#DC2626] hover:bg-rose-50 border border-rose-200 rounded-xl transition-all cursor-pointer"
                        title="Delete Bill"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Bill ID</th>
                    <th className="px-4 py-3">Resident</th>
                    <th className="px-4 py-3">Flat & Tower</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Billing Month</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedMaintenance.map((m) => {
                    const isPaid = m.status === 'Paid';

                    return (
                      <tr 
                        key={m.id || m.maintenance_id} 
                        className={`hover:bg-slate-50/90 transition-colors group ${
                          isPaid ? 'bg-emerald-50/15' : m.status === 'Overdue' ? 'bg-amber-50/20' : 'bg-rose-50/15'
                        }`}
                      >
                        <td className="px-4 py-3 font-mono font-bold text-blue-700">
                          {m.maintenance_id}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs shrink-0">
                              {m.resident_name ? m.resident_name.charAt(0).toUpperCase() : 'R'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 leading-snug">{m.resident_name}</p>
                              <p className="text-[10.5px] font-mono text-slate-500">{m.resident_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          <span className="font-bold text-blue-900">Tower {m.tower}</span>
                          <span className="text-slate-300 mx-1.5">•</span>
                          <span className="font-bold text-purple-900">Flat {m.flat_no}</span>
                        </td>
                        <td className="px-4 py-3 font-mono font-extrabold text-slate-900 text-sm">
                          ₹{Number(m.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {m.month}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-mono text-slate-800 font-semibold">
                            {m.due_date ? format(new Date(m.due_date), 'dd MMM yyyy') : '—'}
                          </p>
                          {isPaid && m.payment_date && (
                            <p className="text-[10px] text-emerald-700 font-medium">
                              Paid: {format(new Date(m.payment_date), 'dd MMM')}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(m.status)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedBillDetails(m)}
                              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                              title="View Bill Details"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                              <span>View</span>
                            </button>

                            {!isPaid ? (
                              <button
                                onClick={() => {
                                  setPaymentBill(m);
                                  setPaymentFormData({
                                    payment_date: format(new Date(), 'yyyy-MM-dd'),
                                    payment_method: 'UPI',
                                    transaction_id: `TXN-${Date.now().toString().slice(-6)}`,
                                    amount_paid: Number(m.amount),
                                    notes: 'Full payment received'
                                  });
                                }}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                                title="Mark Bill as Paid"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Mark Paid</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setReceiptBill(m)}
                                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                                title="View Payment Receipt"
                              >
                                <Printer className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Receipt</span>
                              </button>
                            )}

                            <button
                              onClick={() => setDeletingBillId(m.maintenance_id || m.id!)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                              title="Delete Bill"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* 17. EMPTY STATE */
          <div className="p-12 text-center space-y-3 bg-white">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">No maintenance bills found</h4>
              <p className="text-xs text-slate-500 mt-1">Try changing your search or filters, or generate new bills.</p>
            </div>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
            >
              + Generate Bill
            </button>
          </div>
        )}

        {/* 16. PAGINATION */}
        {filteredMaintenance.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-slate-600 font-medium">
              Showing <strong className="text-slate-900">{((currentPage - 1) * itemsPerPage) + 1}</strong> to <strong className="text-slate-900">{Math.min(currentPage * itemsPerPage, filteredMaintenance.length)}</strong> of <strong className="text-slate-900">{filteredMaintenance.length}</strong> records
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors shadow-2xs flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                .map((page, idx, arr) => (
                  <React.Fragment key={page}>
                    {idx > 0 && arr[idx - 1] !== page - 1 && <span className="px-1 text-slate-400">...</span>}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg font-bold transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors shadow-2xs flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 7. BILL DETAILS MODAL */}
      {/* ============================================================ */}
      {selectedBillDetails && (() => {
        const b = selectedBillDetails;
        const res = residentMap.get(b.resident_id);
        const isPaid = b.status === 'Paid';

        return (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white">
                      {b.status}
                    </span>
                    <span className="text-white/80 text-xs font-mono font-bold">
                      {b.maintenance_id}
                    </span>
                  </div>
                  <h3 className="text-xl font-black mt-1">Maintenance Bill Details</h3>
                </div>
                <button onClick={() => setSelectedBillDetails(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                {/* Resident Block */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Resident Information</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-slate-500 font-medium">Resident Name:</p>
                      <p className="font-black text-slate-900 text-sm mt-0.5">{b.resident_name || res?.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium">Resident ID:</p>
                      <p className="font-mono font-bold text-blue-700 mt-0.5">{b.resident_id}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium">Tower & Flat:</p>
                      <p className="font-bold text-slate-900 mt-0.5">Tower {b.tower} • Flat {b.flat_no}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium">Phone:</p>
                      <p className="font-mono text-slate-700 mt-0.5">{res?.phone || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Billing Breakdown</p>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Billing Month:</span>
                    <strong className="text-slate-900 font-bold">{b.month}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Maintenance Charges:</span>
                    <strong className="font-mono text-slate-900 font-bold">₹{Number(b.amount).toLocaleString('en-IN')}</strong>
                  </div>
                  {b.late_fee ? (
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-rose-600">Late Fee:</span>
                      <strong className="font-mono text-rose-700 font-bold">₹{Number(b.late_fee).toLocaleString('en-IN')}</strong>
                    </div>
                  ) : null}
                  <div className="flex justify-between py-1 text-sm bg-blue-50/70 p-2.5 rounded-xl border border-blue-200 text-blue-950">
                    <span className="font-black">Total Payable:</span>
                    <strong className="font-mono font-black text-blue-700">₹{Number(b.amount).toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                {/* Due & Payment Timeline */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Due Date</p>
                    <p className="font-mono font-bold text-slate-800 mt-0.5">
                      {b.due_date ? format(new Date(b.due_date), 'dd MMMM yyyy') : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Payment Date</p>
                    <p className="font-mono font-bold text-emerald-700 mt-0.5">
                      {b.payment_date ? format(new Date(b.payment_date), 'dd MMMM yyyy') : 'Not Paid'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
                {!isPaid && (
                  <button
                    onClick={() => {
                      setSelectedBillDetails(null);
                      setPaymentBill(b);
                      setPaymentFormData({
                        payment_date: format(new Date(), 'yyyy-MM-dd'),
                        payment_method: 'UPI',
                        transaction_id: `TXN-${Date.now().toString().slice(-6)}`,
                        amount_paid: Number(b.amount),
                        notes: 'Full payment received'
                      });
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Mark as Paid</span>
                  </button>
                )}
                {isPaid && (
                  <button
                    onClick={() => {
                      setSelectedBillDetails(null);
                      setReceiptBill(b);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Receipt</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedBillDetails(null)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================ */}
      {/* 8. GENERATE SINGLE BILL MODAL */}
      {/* ============================================================ */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black">Generate Maintenance Bill</h3>
                <p className="text-blue-100 text-xs font-medium">Issue individual bill for a resident flat</p>
              </div>
              <button onClick={() => setShowGenerateModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="p-6 space-y-4 text-xs">
              {/* Resident Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Select Resident</label>
                <select
                  required
                  value={billFormData.resident_id}
                  onChange={(e) => handleResidentSelectInForm(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">-- Choose Resident --</option>
                  {residents.map(r => (
                    <option key={r.resident_id} value={r.resident_id}>
                      {r.name} ({r.resident_id} • Tower {r.tower} - Flat {r.flat})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tower & Flat (Readonly/Synced) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Tower</label>
                  <input
                    type="text"
                    required
                    value={billFormData.tower}
                    onChange={(e) => setBillFormData({ ...billFormData, tower: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-slate-50 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Flat Number</label>
                  <input
                    type="text"
                    required
                    value={billFormData.flat_no}
                    onChange={(e) => setBillFormData({ ...billFormData, flat_no: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-slate-50 outline-none"
                  />
                </div>
              </div>

              {/* Month & Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Billing Month</label>
                  <input
                    type="text"
                    required
                    value={billFormData.month}
                    onChange={(e) => setBillFormData({ ...billFormData, month: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Due Date</label>
                  <input
                    type="date"
                    required
                    value={billFormData.due_date}
                    onChange={(e) => setBillFormData({ ...billFormData, due_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Amount Breakdown */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Maintenance (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={billFormData.amount}
                    onChange={(e) => setBillFormData({ ...billFormData, amount: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold text-xs bg-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Previous Due (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={billFormData.previous_due}
                    onChange={(e) => setBillFormData({ ...billFormData, previous_due: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold text-xs bg-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Late Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={billFormData.late_fee}
                    onChange={(e) => setBillFormData({ ...billFormData, late_fee: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold text-xs bg-white outline-none"
                  />
                </div>
              </div>

              {/* Live Total Payable Display */}
              <div className="flex justify-between items-center p-3.5 bg-blue-50 rounded-2xl border border-blue-200">
                <span className="font-extrabold text-blue-900">Total Payable Amount:</span>
                <span className="text-base font-black font-mono text-blue-700">
                  ₹{(Number(billFormData.amount) + Number(billFormData.previous_due) + Number(billFormData.late_fee)).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Submit / Cancel */}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/25 disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {actionLoading ? 'Generating...' : 'Generate Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 14. BULK BILL GENERATION MODAL */}
      {/* ============================================================ */}
      {showBulkGenerateModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-purple-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black">Bulk Generate Bills</h3>
                <p className="text-purple-100 text-xs font-medium">Create bills for all active residents simultaneously</p>
              </div>
              <button onClick={() => setShowBulkGenerateModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200 space-y-2">
                <p className="text-purple-950 font-bold leading-relaxed">
                  Generate maintenance bills for all <strong className="text-purple-700 font-black">{activeResidentsCount} active residents</strong>?
                </p>
                <p className="text-[11px] text-purple-700">
                  Flats with existing bills for {bulkFormData.month} will be automatically skipped to prevent duplicates.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Billing Month</label>
                  <input
                    type="text"
                    value={bulkFormData.month}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, month: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Default Rate (₹)</label>
                  <input
                    type="number"
                    value={bulkFormData.default_amount}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, default_amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Payment Due Date</label>
                  <input
                    type="date"
                    value={bulkFormData.due_date}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, due_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkGenerateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkGenerateBills}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-500/25 disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {actionLoading ? 'Processing...' : 'Generate All Bills'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 9. MARK AS PAID PAYMENT MODAL */}
      {/* ============================================================ */}
      {paymentBill && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-emerald-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black">Record Payment</h3>
                <p className="text-emerald-100 text-xs font-medium">{paymentBill.maintenance_id} • Tower {paymentBill.tower} Flat {paymentBill.flat_no}</p>
              </div>
              <button onClick={() => setPaymentBill(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4 text-xs">
              {/* Resident Summary Box */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-900">{paymentBill.resident_name}</p>
                  <p className="text-[11px] text-slate-500">{paymentBill.month}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Total Due</p>
                  <p className="font-mono font-black text-slate-900 text-base">₹{Number(paymentBill.amount).toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Payment Details Form */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={paymentFormData.payment_date}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Payment Method</label>
                  <select
                    required
                    value={paymentFormData.payment_method}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_method: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT / IMPS / RTGS)</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Online Payment">Online Payment Gateway</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Transaction ID / Reference Number</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI/4028910284 or Cheque #102910"
                    value={paymentFormData.transaction_id}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, transaction_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-xs bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Amount Paid (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={paymentFormData.amount_paid}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, amount_paid: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-black text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-800"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentBill(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-500/25 disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{actionLoading ? 'Processing...' : 'Confirm Payment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 10. PRINTABLE RECEIPT MODAL */}
      {/* ============================================================ */}
      {receiptBill && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[160] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header Actions */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Payment Receipt</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button onClick={() => setReceiptBill(null)} className="p-1.5 hover:bg-white/20 rounded-lg text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Canvas */}
            <div className="p-8 space-y-6 text-slate-800 bg-white" id="printable-receipt">
              {/* Society Branding */}
              <div className="text-center pb-4 border-b-2 border-slate-800">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-black tracking-tight uppercase">Green Park CHS Ltd.</h2>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">TowerTech Society Management Portal • Reg. MH/PUN/2024/9918</p>
                <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 mt-2 bg-emerald-50 py-1 rounded-md border border-emerald-200">
                  Maintenance Payment Receipt
                </p>
              </div>

              {/* Receipt Meta */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Receipt No.</p>
                  <p className="font-mono font-bold text-slate-900">REC-{receiptBill.maintenance_id}-{Date.now().toString().slice(-4)}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Payment Date</p>
                  <p className="font-mono font-bold text-slate-900">
                    {receiptBill.payment_date ? format(new Date(receiptBill.payment_date), 'dd MMM yyyy') : format(new Date(), 'dd MMM yyyy')}
                  </p>
                </div>
              </div>

              {/* Resident & Unit Details */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[9.5px]">Received From</p>
                  <p className="font-black text-slate-900 text-sm mt-0.5">{receiptBill.resident_name}</p>
                  <p className="font-mono text-slate-500 text-[10.5px]">Resident ID: {receiptBill.resident_id}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 font-bold uppercase text-[9.5px]">Unit Details</p>
                  <p className="font-black text-slate-900 text-sm mt-0.5">Tower {receiptBill.tower} - Flat {receiptBill.flat_no}</p>
                  <p className="text-slate-500 text-[10.5px]">Billing Period: {receiptBill.month}</p>
                </div>
              </div>

              {/* Payment Particulars */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-200 font-medium">
                  <span>Maintenance Bill ({receiptBill.maintenance_id})</span>
                  <span className="font-mono font-bold">₹{Number(receiptBill.amount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-2 border-b-2 border-slate-800 text-base font-black">
                  <span className="text-emerald-800">Total Amount Paid:</span>
                  <span className="font-mono text-emerald-700">
                    ₹{Number(receiptBill.total_paid || receiptBill.amount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Payment Mode & Reference */}
              <div className="grid grid-cols-2 gap-3 text-[11px] bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                <div>
                  <p className="text-emerald-800 font-bold uppercase text-[9px]">Payment Method</p>
                  <p className="font-bold text-slate-900">{receiptBill.payment_method || 'UPI Transfer'}</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-800 font-bold uppercase text-[9px]">Transaction / Reference</p>
                  <p className="font-mono font-bold text-slate-900 truncate">{receiptBill.transaction_id || 'TXN-CONFIRMED'}</p>
                </div>
              </div>

              {/* Seal & Signature */}
              <div className="pt-4 flex justify-between items-end text-center">
                <div className="p-2 border-2 border-dashed border-emerald-400 rounded-xl bg-emerald-50/50">
                  <p className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">✓ PAID & VERIFIED</p>
                  <p className="text-[8px] font-mono text-emerald-600">GREEN PARK SOCIETY</p>
                </div>
                <div className="w-36 text-center">
                  <div className="border-b border-slate-400 pb-1 mb-1 font-serif text-slate-600 italic text-xs">
                    Secretary / Admin
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Authorized Signatory</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 print:hidden">
              <button
                onClick={() => setReceiptBill(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ============================================================ */}
      {deletingBillId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[170] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-2xs">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-900">Delete Maintenance Record?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete bill <strong className="text-slate-800 font-bold">{deletingBillId}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingBillId(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBill(deletingBillId)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/25 disabled:opacity-50 transition-all"
              >
                {actionLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
