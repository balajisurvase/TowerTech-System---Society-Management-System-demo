import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  IndianRupee, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Building, 
  Filter, 
  Printer, 
  X, 
  RefreshCw, 
  ShieldAlert,
  Calendar,
  Layers,
  Check,
  CreditCard,
  PieChart as PieIcon,
  ChevronRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Users, 
  Building2, 
  Briefcase, 
  Phone, 
  ShieldCheck 
} from 'lucide-react';
import { Finance, FinanceType, PaymentMode, PaymentStatus, Resident, MaintenanceRecord, User, StaffSalaryRecord, ServiceContract } from '../types';
import { societyService } from '../lib/societyService';
import { toast } from 'sonner';
import { 
  AddEditFinanceWorkspace, 
  ViewFinanceVoucherWorkspace, 
  FinanceStatementWorkspace,
  AddEditStaffSalaryWorkspace,
  AddEditServiceContractWorkspace
} from './workspaces/FinanceWorkspaces';

interface FinanceDashboardProps {
  user: User;
  residents: Resident[];
  maintenance: MaintenanceRecord[];
  onRefresh?: () => void;
}

// Color schemes aligned with Navy Blue + White theme
const EXPENSE_COLORS: Record<string, string> = {
  'Electricity': '#6339CA',             // Royal Violet
  'Cleaning': '#44D080',                // Mint Green
  'Staff Salary': '#5D31C7',            // Secondary Violet
  'Security': '#321F5C',                // Dark Plum
  'Water': '#0284C7',                   // Sky Blue (keeping some variety)
  'Repairs & Maintenance': '#FAA928',   // Vibrant Gold
  'Lift Maintenance': '#7C3AED',        // Violet
  'Other Expenses': '#E11D48',          // Rose Red
  'Housekeeping & Sanitation': '#44D080',
  'Security Services': '#321F5C',
  'Elevator / Lift AMC': '#7C3AED',
  'Electricity / Utility': '#6339CA',
  'Water Supply & Plumbing': '#0284C7',
  'Building Repairs & Civil Works': '#FAA928',
  'DG Generator Fuel': '#EA580C',
  'Gardening & Landscaping': '#16A34A',
  'CCTV & Security Tech AMC': '#64748B'
};

const INCOME_COLORS: Record<string, string> = {
  'Maintenance Collection': '#6339CA',  // Royal Violet
  'Parking Charges': '#0284C7',         // Sky Blue
  'Clubhouse Charges': '#44D080',       // Mint Green
  'Penalties/Fines': '#FAA928',         // Vibrant Gold
  'Other Income': '#5D31C7',            // Secondary Violet
  'Amenity Booking': '#44D080',
  'Violation Penalty': '#FAA928',
  'Parking Violation': '#FAA928',
  'Interest & Investments': '#6339CA',
  'Move-in / Move-out Charges': '#8B5CF6'
};

const FALLBACK_PALETTE = ['#6339CA', '#5D31C7', '#321F5C', '#FAA928', '#44D080', '#7C3AED', '#E11D48', '#0284C7'];

const CATEGORY_SUGGESTIONS: Record<FinanceType, string[]> = {
  Income: [
    'Maintenance Collection',
    'Parking Charges',
    'Clubhouse Charges',
    'Penalties/Fines',
    'Amenity Booking',
    'Interest & Investments',
    'Move-in / Move-out Charges',
    'Other Income'
  ],
  Expense: [
    'Electricity',
    'Cleaning',
    'Staff Salary',
    'Security',
    'Water',
    'Repairs & Maintenance',
    'Lift Maintenance',
    'Other Expenses',
    'DG Generator Fuel',
    'Gardening & Landscaping',
    'CCTV & Security Tech AMC'
  ],
  Maintenance: [
    'Maintenance Collection',
    'Quarterly Maintenance',
    'Sinking Fund Contribution'
  ],
  Fine: [
    'Penalties/Fines',
    'Parking Violation',
    'Late Night Noise Violation',
    'Late Maintenance Payment Fine'
  ]
};

export default function FinanceDashboard({ user, residents, maintenance, onRefresh }: FinanceDashboardProps) {
  // 1. Admin-only Authorization Guard
  const isAdmin = user.role === 'admin' || !!user.admin_id;

  const [moduleTab, setModuleTab] = useState<'ledger' | 'salaries' | 'services'>('ledger');
  const [finances, setFinances] = useState<Finance[]>([]);
  const [staffSalaries, setStaffSalaries] = useState<StaffSalaryRecord[]>([]);
  const [serviceContracts, setServiceContracts] = useState<ServiceContract[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTypeTab, setActiveTypeTab] = useState<'All' | FinanceType | 'PendingDues'>('All');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('All');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Interactive click filter from graphs
  const [clickedFilter, setClickedFilter] = useState<{ label: string; type?: string } | null>(null);

  // Modal States
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingFinance, setEditingFinance] = useState<Finance | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Staff Salary & Service Contract Modals
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [editingSalary, setEditingSalary] = useState<StaffSalaryRecord | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [editingContract, setEditingContract] = useState<ServiceContract | null>(null);

  // Voucher / Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<Finance | null>(null);
  
  // Delete Confirm Modal
  const [financeToDelete, setFinanceToDelete] = useState<Finance | null>(null);

  // Financial Report Modal
  const [showReportModal, setShowReportModal] = useState(false);

  // Form Data
  const initialFormData: Omit<Finance, 'finance_id'> = {
    finance_type: 'Income',
    category: 'Maintenance Collection',
    description: '',
    amount: 0,
    payment_mode: 'UPI',
    payment_status: 'Paid',
    transaction_date: new Date().toISOString().split('T')[0],
    party_name: '',
    reference_number: '',
    society_id: user.society_id || 'GV2026',
    resident_id: '',
    maintenance_id: ''
  };

  const [formData, setFormData] = useState<Omit<Finance, 'finance_id'>>(initialFormData);

  // Load Financial Records
  const loadFinances = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const data = await societyService.getFinances(user.society_id);
      setFinances(data);
    } catch (error) {
      console.error('Error fetching finances:', error);
      toast.error('Failed to load financial records');
    } finally {
      setLoading(false);
    }
  };

  const loadSalaries = async () => {
    if (!isAdmin) return;
    try {
      const data = await societyService.getStaffSalaries(user.society_id);
      setStaffSalaries(data);
    } catch (e) {
      console.warn('Error loading salaries:', e);
    }
  };

  const loadContracts = async () => {
    if (!isAdmin) return;
    try {
      const data = await societyService.getServiceContracts(user.society_id);
      setServiceContracts(data);
    } catch (e) {
      console.warn('Error loading service contracts:', e);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadFinances();
      loadSalaries();
      loadContracts();
    }
  }, [user.society_id, isAdmin]);

  // If user is not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-rose-100 shadow-sm text-center max-w-2xl mx-auto my-12">
        <div className="w-16 h-16 bg-rose-50 text-#FAA928 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-[#321F5C] mb-2">Access Denied / Unauthorized</h2>
        <p className="text-sm font-medium text-slate-500 leading-relaxed mb-6">
          The Financial module contains sensitive society balance sheets, revenue streams, and expenditures. Only authorized Administrators have permission to view or manage financial records.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-600 border border-slate-200">
          <span>Logged in role: <strong className="uppercase text-[#321F5C]">{user.admin_role || user.role}</strong></span>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Metrics & Dynamic Chart Calculations
  // -------------------------------------------------------------------------
  const totalIncome = useMemo(() => {
    return finances
      .filter(f => (f.finance_type === 'Income' || f.finance_type === 'Maintenance' || f.finance_type === 'Fine') && f.payment_status === 'Paid')
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  }, [finances]);

  const totalExpenses = useMemo(() => {
    return finances
      .filter(f => f.finance_type === 'Expense' && f.payment_status === 'Paid')
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  }, [finances]);

  const maintenanceCollected = useMemo(() => {
    return finances
      .filter(f => (f.finance_type === 'Maintenance' || f.category?.toLowerCase().includes('maintenance')) && f.payment_status === 'Paid')
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  }, [finances]);

  const pendingDues = useMemo(() => {
    return finances
      .filter(f => f.payment_status === 'Pending' || f.payment_status === 'Overdue')
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  }, [finances]);

  const maintenancePending = useMemo(() => {
    return finances
      .filter(f => (f.finance_type === 'Maintenance' || f.category?.toLowerCase().includes('maintenance')) && (f.payment_status === 'Pending' || f.payment_status === 'Overdue'))
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  }, [finances]);

  const totalMaintenanceBilled = maintenanceCollected + maintenancePending;
  const maintenancePercentage = totalMaintenanceBilled > 0 
    ? ((maintenanceCollected / totalMaintenanceBilled) * 100).toFixed(1) 
    : '100.0';

  // Expense Donut Data (finance_type = 'Expense')
  const expenseChartData = useMemo(() => {
    const map = new Map<string, number>();
    finances
      .filter(f => f.finance_type === 'Expense' && f.payment_status === 'Paid')
      .forEach(f => {
        let cat = f.category || 'Other Expenses';
        // Normalize common category names
        if (cat.includes('Electricity') || cat.includes('Utility')) cat = 'Electricity';
        else if (cat.includes('Housekeeping') || cat.includes('Cleaning')) cat = 'Cleaning';
        else if (cat.includes('Salary') || cat.includes('Payroll')) cat = 'Staff Salary';
        else if (cat.includes('Security')) cat = 'Security';
        else if (cat.includes('Water') || cat.includes('Plumbing')) cat = 'Water';
        else if (cat.includes('Repairs') || cat.includes('Civil')) cat = 'Repairs & Maintenance';
        else if (cat.includes('Lift') || cat.includes('Elevator')) cat = 'Lift Maintenance';
        else if (cat.includes('Other') || cat.includes('DG') || cat.includes('Gardening') || cat.includes('CCTV')) cat = 'Other Expenses';
        
        map.set(cat, (map.get(cat) || 0) + (Number(f.amount) || 0));
      });

    return Array.from(map.entries()).map(([name, value], idx) => {
      const percentage = totalExpenses > 0 ? ((value / totalExpenses) * 100).toFixed(1) : '0.0';
      const color = EXPENSE_COLORS[name] || FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length];
      return { name, value, percentage, color };
    }).sort((a, b) => b.value - a.value);
  }, [finances, totalExpenses]);

  // Income Donut Data (finance_type = 'Income' or Paid Maintenance/Fine)
  const incomeChartData = useMemo(() => {
    const map = new Map<string, number>();
    finances
      .filter(f => (f.finance_type === 'Income' || f.finance_type === 'Maintenance' || f.finance_type === 'Fine') && f.payment_status === 'Paid')
      .forEach(f => {
        let cat = f.category || 'Other Income';
        // Normalize categories
        if (f.finance_type === 'Maintenance' || cat.includes('Maintenance')) cat = 'Maintenance Collection';
        else if (cat.includes('Parking')) cat = 'Parking Charges';
        else if (cat.includes('Clubhouse') || cat.includes('Amenity') || cat.includes('Hall')) cat = 'Clubhouse Charges';
        else if (f.finance_type === 'Fine' || cat.includes('Penalty') || cat.includes('Fine') || cat.includes('Violation')) cat = 'Penalties/Fines';
        else cat = 'Other Income';

        map.set(cat, (map.get(cat) || 0) + (Number(f.amount) || 0));
      });

    return Array.from(map.entries()).map(([name, value], idx) => {
      const percentage = totalIncome > 0 ? ((value / totalIncome) * 100).toFixed(1) : '0.0';
      const color = INCOME_COLORS[name] || FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length];
      return { name, value, percentage, color };
    }).sort((a, b) => b.value - a.value);
  }, [finances, totalIncome]);

  // Maintenance Progress Donut Data
  const maintenanceChartData = useMemo(() => {
    return [
      { name: 'Collected', value: maintenanceCollected, color: '#6339CA', percentage: maintenancePercentage },
      { name: 'Pending', value: maintenancePending, color: '#FAA928', percentage: (100 - parseFloat(maintenancePercentage)).toFixed(1) }
    ];
  }, [maintenanceCollected, maintenancePending, maintenancePercentage]);

  // Pending Dues Donut Data (Pending vs Overdue breakdown)
  const pendingDuesChartData = useMemo(() => {
    const pendingAmount = finances
      .filter(f => f.payment_status === 'Pending')
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const overdueAmount = finances
      .filter(f => f.payment_status === 'Overdue')
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

    return [
      { 
        name: 'Regular Pending', 
        value: pendingAmount, 
        color: '#FAA928', 
        percentage: pendingDues > 0 ? ((pendingAmount / pendingDues) * 100).toFixed(1) : '0.0' 
      },
      { 
        name: 'Critical Overdue', 
        value: overdueAmount, 
        color: '#E11D48', 
        percentage: pendingDues > 0 ? ((overdueAmount / pendingDues) * 100).toFixed(1) : '0.0' 
      }
    ];
  }, [finances, pendingDues]);

  // -------------------------------------------------------------------------
  // Filtering & Sorting
  // -------------------------------------------------------------------------
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    finances.forEach(f => {
      if (f.category) set.add(f.category);
    });
    return Array.from(set).sort();
  }, [finances]);

  const filteredFinances = useMemo(() => {
    return finances.filter(f => {
      // Interactive Click Filter from Circle Graphs
      if (clickedFilter) {
        if (clickedFilter.type === 'expense') {
          if (f.finance_type !== 'Expense') return false;
          const searchCat = clickedFilter.label.toLowerCase();
          const recordCat = (f.category || '').toLowerCase();
          if (!recordCat.includes(searchCat) && !searchCat.includes(recordCat)) {
            if (searchCat === 'other expenses' && !['electricity', 'cleaning', 'staff salary', 'security', 'water', 'repairs & maintenance', 'lift maintenance'].some(k => recordCat.includes(k))) {
              // Matches other
            } else {
              return false;
            }
          }
        } else if (clickedFilter.type === 'income') {
          const searchCat = clickedFilter.label.toLowerCase();
          const recordCat = (f.category || '').toLowerCase();
          if (searchCat.includes('maintenance') && f.finance_type !== 'Maintenance' && !recordCat.includes('maintenance')) return false;
          if (searchCat.includes('penalty') && f.finance_type !== 'Fine' && !recordCat.includes('penalty') && !recordCat.includes('fine')) return false;
          if (searchCat.includes('parking') && !recordCat.includes('parking')) return false;
          if (searchCat.includes('clubhouse') && !recordCat.includes('clubhouse') && !recordCat.includes('amenity') && !recordCat.includes('hall')) return false;
        } else if (clickedFilter.type === 'maintenance-collection') {
          if (clickedFilter.label === 'Collected' && f.payment_status !== 'Paid') return false;
          if (clickedFilter.label === 'Pending' && (f.payment_status !== 'Pending' && f.payment_status !== 'Overdue')) return false;
          if (f.finance_type !== 'Maintenance' && !(f.category || '').toLowerCase().includes('maintenance')) return false;
        } else if (clickedFilter.type === 'pending-dues') {
          if (clickedFilter.label === 'Regular Pending' && f.payment_status !== 'Pending') return false;
          if (clickedFilter.label === 'Critical Overdue' && f.payment_status !== 'Overdue') return false;
          if (clickedFilter.label === 'All Pending Dues' && (f.payment_status !== 'Pending' && f.payment_status !== 'Overdue')) return false;
        }
      }

      // Type Tab filter
      if (activeTypeTab === 'PendingDues') {
        if (f.payment_status !== 'Pending' && f.payment_status !== 'Overdue') return false;
      } else if (activeTypeTab !== 'All') {
        if (f.finance_type !== activeTypeTab) return false;
      }

      // Payment Mode filter
      if (selectedPaymentMode !== 'All' && f.payment_mode !== selectedPaymentMode) {
        return false;
      }

      // Payment Status filter
      if (selectedPaymentStatus !== 'All' && f.payment_status !== selectedPaymentStatus) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'All' && f.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchId = f.finance_id?.toLowerCase().includes(query);
        const matchDesc = f.description?.toLowerCase().includes(query);
        const matchParty = f.party_name?.toLowerCase().includes(query);
        const matchRef = f.reference_number?.toLowerCase().includes(query);
        const matchCat = f.category?.toLowerCase().includes(query);
        if (!matchId && !matchDesc && !matchParty && !matchRef && !matchCat) {
          return false;
        }
      }

      return true;
    });
  }, [finances, clickedFilter, activeTypeTab, selectedPaymentMode, selectedPaymentStatus, selectedCategory, searchTerm]);

  // -------------------------------------------------------------------------
  // Form Submission (Add / Edit)
  // -------------------------------------------------------------------------
  const handleOpenAddModal = () => {
    setEditingFinance(null);
    setFormData({
      ...initialFormData,
      transaction_date: new Date().toISOString().split('T')[0]
    });
    setShowAddEditModal(true);
  };

  const handleOpenEditModal = (item: Finance) => {
    setEditingFinance(item);
    setFormData({
      finance_type: item.finance_type,
      category: item.category,
      description: item.description,
      amount: item.amount,
      payment_mode: item.payment_mode,
      payment_status: item.payment_status,
      transaction_date: item.transaction_date,
      party_name: item.party_name || '',
      reference_number: item.reference_number || '',
      society_id: item.society_id || user.society_id || 'GV2026',
      resident_id: item.resident_id || '',
      maintenance_id: item.maintenance_id || ''
    });
    setShowAddEditModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    if (formData.amount <= 0) {
      toast.error('Amount must be greater than zero');
      return;
    }

    setSubmitting(true);
    try {
      if (editingFinance) {
        const updated = await societyService.updateFinance(editingFinance.finance_id, formData);
        setFinances(prev => prev.map(f => f.finance_id === editingFinance.finance_id ? { ...f, ...updated } : f));
        toast.success(`Financial record ${editingFinance.finance_id} updated successfully`);
      } else {
        const added = await societyService.addFinance(formData);
        setFinances(prev => [added, ...prev]);
        toast.success('New financial record added successfully');
      }
      setShowAddEditModal(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error saving finance record:', error);
      toast.error('Failed to save financial record');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete handler
  const confirmDeleteFinance = async () => {
    if (!financeToDelete) return;
    setSubmitting(true);
    try {
      await societyService.deleteFinance(financeToDelete.finance_id);
      setFinances(prev => prev.filter(f => f.finance_id !== financeToDelete.finance_id));
      toast.success(`Record ${financeToDelete.finance_id} deleted`);
      setFinanceToDelete(null);
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Failed to delete record');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Status Toggle
  const handleToggleStatus = async (item: Finance) => {
    const nextStatus: PaymentStatus = item.payment_status === 'Paid' ? 'Pending' : 'Paid';
    try {
      await societyService.updateFinance(item.finance_id, { payment_status: nextStatus });
      setFinances(prev => prev.map(f => f.finance_id === item.finance_id ? { ...f, payment_status: nextStatus } : f));
      toast.success(`Status updated to ${nextStatus}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  // Custom Interactive Tooltip Component
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#321F5C] text-white p-3 rounded-2xl shadow-xl border border-white/10 text-xs z-50">
          <p className="font-black text-slate-100 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: data.color || payload[0].color }} />
            {data.name}
          </p>
          <div className="mt-1.5 flex items-baseline justify-between gap-4">
            <span className="text-sm font-black text-white">₹{Number(data.value).toLocaleString('en-IN')}</span>
            <span className="text-[11px] font-bold text-[#FAA928]">({data.percentage}%)</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-1 font-medium">Click slice to filter records below</p>
        </div>
      );
    }
    return null;
  };

  if (showAddEditModal) {
    return (
      <AddEditFinanceWorkspace
        mode={editingFinance ? 'edit' : 'add'}
        editingFinance={editingFinance}
        onBack={() => {
          setShowAddEditModal(false);
          setEditingFinance(null);
        }}
        onSubmit={async (fd) => {
          try {
            if (editingFinance) {
              await societyService.updateFinance(editingFinance.finance_id, {
                finance_type: fd.finance_type,
                category: fd.category,
                description: fd.description,
                amount: fd.amount,
                payment_mode: fd.payment_mode,
                payment_status: fd.payment_status,
                transaction_date: fd.transaction_date,
                party_name: fd.party_name,
                reference_number: fd.reference_number,
                society_id: user.society_id
              });
              toast.success('Record updated successfully');
            } else {
              await societyService.addFinance({
                finance_type: fd.finance_type,
                category: fd.category,
                description: fd.description,
                amount: fd.amount,
                payment_mode: fd.payment_mode,
                payment_status: fd.payment_status,
                transaction_date: fd.transaction_date,
                party_name: fd.party_name,
                reference_number: fd.reference_number,
                society_id: user.society_id || 'GV2026'
              });
              toast.success('Record added successfully');
            }
            setShowAddEditModal(false);
            setEditingFinance(null);
            await loadFinances();
            if (onRefresh) onRefresh();
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Operation failed';
            toast.error(msg);
          }
        }}
      />
    );
  }

  if (selectedReceipt) {
    return (
      <ViewFinanceVoucherWorkspace
        record={selectedReceipt}
        onBack={() => setSelectedReceipt(null)}
        onEdit={(rec) => {
          const currentRec = rec;
          setSelectedReceipt(null);
          setEditingFinance(currentRec);
          setShowAddEditModal(true);
        }}
      />
    );
  }

  if (showReportModal) {
    return (
      <FinanceStatementWorkspace
        finances={finances}
        onBack={() => setShowReportModal(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* --------------------------------------------------------------------- */}
      {/* 1. Header Card */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#6339CA]/10 flex items-center justify-center text-[#6339CA] border border-[#6339CA]/20 shadow-sm">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-[#321F5C] tracking-tight">Financial Dashboard</h2>
              <span className="bg-[#6339CA]/10 text-[#6339CA] text-[10px] font-black px-2.5 py-0.5 rounded-full border border-[#6339CA]/20 uppercase tracking-wider">
                Admin Exclusive
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Interactive circular breakdown of society revenues, expenditures, maintenance collections, and dues.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowReportModal(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Financial Statement
          </button>
          <button
            onClick={loadFinances}
            disabled={loading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#6339CA]' : ''}`} />
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-[#6339CA] hover:bg-[#5D31C7] text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-[#6339CA]/10 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Record
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 2. Top Metric Cards Row: Total Income | Total Expenses | Pending Dues (Solid Colors) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Income: Solid Green #059669 */}
        <div 
          onClick={() => {
            setActiveTypeTab('Income');
            setClickedFilter(null);
          }}
          className="bg-[#44D080] p-6 rounded-2xl shadow-lg shadow-[#44D080]/20 text-white flex flex-col justify-between hover:scale-[1.01] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-black text-white/90 uppercase tracking-widest">Total Income</span>
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center backdrop-blur-xs font-black">
              <ArrowUpRight className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-white font-mono tracking-tight">₹{totalIncome.toLocaleString('en-IN')}</h3>
            <p className="text-[11px] font-bold text-white/80 mt-1 flex items-center gap-1">
              <span>Paid inflows received</span>
            </p>
          </div>
        </div>

        {/* Total Expenses: Solid Red #FAA928 */}
        <div 
          onClick={() => {
            setActiveTypeTab('Expense');
            setClickedFilter(null);
          }}
          className="bg-[#FAA928] p-6 rounded-2xl shadow-lg shadow-#FAA928/20 text-white flex flex-col justify-between hover:scale-[1.01] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-black text-white/90 uppercase tracking-widest">Total Expenses</span>
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center backdrop-blur-xs font-black">
              <ArrowDownRight className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-white font-mono tracking-tight">₹{totalExpenses.toLocaleString('en-IN')}</h3>
            <p className="text-[11px] font-bold text-white/80 mt-1 flex items-center gap-1">
              <span>Operational outlays</span>
            </p>
          </div>
        </div>

        {/* Pending Dues: Solid Orange #EA580C */}
        <div 
          onClick={() => {
            setActiveTypeTab('PendingDues');
            setClickedFilter(null);
          }}
          className="bg-[#FAA928] p-6 rounded-2xl shadow-lg shadow-[#FAA928]/20 text-white flex flex-col justify-between hover:scale-[1.01] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-black text-white/90 uppercase tracking-widest">Pending Dues</span>
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center backdrop-blur-xs font-black">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-white font-mono tracking-tight">₹{pendingDues.toLocaleString('en-IN')}</h3>
            <p className="text-[11px] font-bold text-white/80 mt-1">
              <span>Unpaid / Overdue flat dues</span>
            </p>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 3. EXPENSE BREAKDOWN CIRCLE GRAPH (Large Donut Chart)                */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-[#321F5C] tracking-tight uppercase">Expense Breakdown</h3>
            <p className="text-xs font-medium text-slate-500">
              Categorical distribution of operational expenditures and society maintenance costs.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Expenses</span>
            <span className="text-xl font-black text-[#321F5C]">₹{totalExpenses.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Donut Chart with Center Amount */}
          <div className="lg:col-span-6 flex items-center justify-center relative min-h-[320px]">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Tooltip content={<CustomPieTooltip />} />
                <Pie
                  data={expenseChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={90}
                  outerRadius={135}
                  paddingAngle={3}
                  dataKey="value"
                  cursor="pointer"
                  onClick={(entry) => setClickedFilter({ label: entry.name, type: 'expense' })}
                >
                  {expenseChartData.map((entry, index) => (
                    <Cell 
                      key={`expense-cell-${index}`} 
                      fill={entry.color} 
                      stroke="#FFFFFF" 
                      strokeWidth={2}
                      className="transition-all duration-300 hover:opacity-85"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center Label for Expense Total */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl sm:text-3xl font-black text-[#321F5C] tracking-tight">
                ₹{totalExpenses.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mt-0.5">
                Total Expenses
              </span>
            </div>
          </div>

          {/* Clean Interactive Legend Grid */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {expenseChartData.map((item) => {
                const isSelected = clickedFilter?.type === 'expense' && clickedFilter.label === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      if (isSelected) setClickedFilter(null);
                      else setClickedFilter({ label: item.name, type: 'expense' });
                    }}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                      isSelected 
                        ? 'bg-[#6339CA]/5 border-[#6339CA]/40 ring-2 ring-[#6339CA]/10' 
                        : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-3.5 h-3.5 rounded-lg shrink-0" style={{ backgroundColor: item.color }} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate" title={item.name}>{item.name}</p>
                        <p className="text-[10px] font-bold text-slate-400">{item.percentage}% of total</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-[#321F5C] shrink-0 ml-2">
                      ₹{item.value.toLocaleString('en-IN')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 4. INCOME BREAKDOWN CIRCLE GRAPH (Large Donut Chart)                 */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-[#321F5C] tracking-tight uppercase">Income Breakdown</h3>
            <p className="text-xs font-medium text-slate-500">
              Revenue sources including flat maintenance collections, amenity rents, and penalties.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Income</span>
            <span className="text-xl font-black text-[#321F5C]">₹{totalIncome.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Donut Chart with Center Amount */}
          <div className="lg:col-span-6 flex items-center justify-center relative min-h-[320px]">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Tooltip content={<CustomPieTooltip />} />
                <Pie
                  data={incomeChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={90}
                  outerRadius={135}
                  paddingAngle={3}
                  dataKey="value"
                  cursor="pointer"
                  onClick={(entry) => setClickedFilter({ label: entry.name, type: 'income' })}
                >
                  {incomeChartData.map((entry, index) => (
                    <Cell 
                      key={`income-cell-${index}`} 
                      fill={entry.color} 
                      stroke="#FFFFFF" 
                      strokeWidth={2}
                      className="transition-all duration-300 hover:opacity-85"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center Label for Income Total */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl sm:text-3xl font-black text-[#321F5C] tracking-tight">
                ₹{totalIncome.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mt-0.5">
                Total Income
              </span>
            </div>
          </div>

          {/* Clean Interactive Legend Grid */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {incomeChartData.map((item) => {
                const isSelected = clickedFilter?.type === 'income' && clickedFilter.label === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      if (isSelected) setClickedFilter(null);
                      else setClickedFilter({ label: item.name, type: 'income' });
                    }}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                      isSelected 
                        ? 'bg-[#6339CA]/5 border-[#6339CA]/40 ring-2 ring-[#6339CA]/10' 
                        : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-3.5 h-3.5 rounded-lg shrink-0" style={{ backgroundColor: item.color }} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate" title={item.name}>{item.name}</p>
                        <p className="text-[10px] font-bold text-slate-400">{item.percentage}% of total</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-[#321F5C] shrink-0 ml-2">
                      ₹{item.value.toLocaleString('en-IN')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 5. 2-COLUMN ROW: Maintenance Collection Circle | Pending Dues Circle */}
      {/* --------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Maintenance Collection Circle Card */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex justify-between items-start pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-[#321F5C] uppercase tracking-tight">Maintenance Collection</h3>
              <p className="text-[11px] font-medium text-slate-500">Collected vs pending society dues ratio.</p>
            </div>
            <span className="text-xs font-black text-[#6339CA] bg-[#6339CA]/10 px-2.5 py-1 rounded-xl border border-[#6339CA]/20">
              {maintenancePercentage}%
            </span>
          </div>

          <div className="flex items-center justify-center relative min-h-[220px]">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Tooltip content={<CustomPieTooltip />} />
                <Pie
                  data={maintenanceChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  cursor="pointer"
                  onClick={(entry) => setClickedFilter({ label: entry.name, type: 'maintenance-collection' })}
                >
                  {maintenanceChartData.map((entry, index) => (
                    <Cell 
                      key={`maint-cell-${index}`} 
                      fill={entry.color} 
                      stroke="#FFFFFF" 
                      strokeWidth={2}
                      className="transition-all duration-300 hover:opacity-85"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Percentage in Center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-[#321F5C] tracking-tight">
                {maintenancePercentage}%
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Collected
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => setClickedFilter({ label: 'Collected', type: 'maintenance-collection' })}
              className={`p-3 rounded-2xl border text-left transition-all ${
                clickedFilter?.type === 'maintenance-collection' && clickedFilter.label === 'Collected'
                  ? 'bg-[#6339CA]/10 border-white/80'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6339CA]" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Collected</span>
              </div>
              <p className="text-sm font-black text-[#321F5C]">₹{maintenanceCollected.toLocaleString('en-IN')}</p>
            </button>

            <button
              onClick={() => setClickedFilter({ label: 'Pending', type: 'maintenance-collection' })}
              className={`p-3 rounded-2xl border text-left transition-all ${
                clickedFilter?.type === 'maintenance-collection' && clickedFilter.label === 'Pending'
                  ? 'bg-amber-50 border-amber-400'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Pending</span>
              </div>
              <p className="text-sm font-black text-[#321F5C]">₹{maintenancePending.toLocaleString('en-IN')}</p>
            </button>
          </div>
        </div>

        {/* Pending Dues Circle Card */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex justify-between items-start pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-[#321F5C] uppercase tracking-tight">Pending Dues</h3>
              <p className="text-[11px] font-medium text-slate-500">Unpaid and overdue maintenance liabilities.</p>
            </div>
            <span className="text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-100">
              ₹{pendingDues.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center justify-center relative min-h-[220px]">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Tooltip content={<CustomPieTooltip />} />
                <Pie
                  data={pendingDuesChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  cursor="pointer"
                  onClick={(entry) => setClickedFilter({ label: entry.name, type: 'pending-dues' })}
                >
                  {pendingDuesChartData.map((entry, index) => (
                    <Cell 
                      key={`pending-cell-${index}`} 
                      fill={entry.color} 
                      stroke="#FFFFFF" 
                      strokeWidth={2}
                      className="transition-all duration-300 hover:opacity-85"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Total Pending Dues in Center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-[#321F5C] tracking-tight">
                ₹{pendingDues.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Pending Dues
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {pendingDuesChartData.map((item) => (
              <button
                key={item.name}
                onClick={() => setClickedFilter({ label: item.name, type: 'pending-dues' })}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  clickedFilter?.type === 'pending-dues' && clickedFilter.label === item.name
                    ? 'bg-amber-50 border-amber-400'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{item.name}</span>
                </div>
                <p className="text-sm font-black text-[#321F5C]">₹{item.value.toLocaleString('en-IN')}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 6. Related / Filtered Finance Records Table                         */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Active Graph Filter Notification Banner */}
        {clickedFilter && (
          <div className="px-6 py-3 bg-[#6339CA]/10 border-b border-[#6339CA]/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#6339CA]" />
              <span className="text-xs font-bold text-[#321F5C]">
                Filtering by Graph Selection: <strong className="font-black underline">{clickedFilter.label}</strong>
              </span>
            </div>
            <button
              onClick={() => setClickedFilter(null)}
              className="text-xs font-black text-[#6339CA] hover:text-[#321F5C] flex items-center gap-1 uppercase tracking-wider"
            >
              <X className="w-3.5 h-3.5" />
              Clear Selection
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
            {[
              { id: 'All', label: 'All Transactions', count: finances.length },
              { id: 'Income', label: 'Income', count: finances.filter(f => f.finance_type === 'Income').length },
              { id: 'Expense', label: 'Expenses', count: finances.filter(f => f.finance_type === 'Expense').length },
              { id: 'Maintenance', label: 'Maintenance', count: finances.filter(f => f.finance_type === 'Maintenance').length },
              { id: 'Fine', label: 'Fines', count: finances.filter(f => f.finance_type === 'Fine').length },
              { id: 'PendingDues', label: 'Pending Dues', count: finances.filter(f => f.payment_status === 'Pending' || f.payment_status === 'Overdue').length }
            ].map(tab => {
              const active = activeTypeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTypeTab(tab.id as any);
                    setClickedFilter(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    active
                      ? 'bg-[#6339CA] text-white shadow-sm'
                      : 'text-slate-600 hover:text-[#321F5C] hover:bg-slate-50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Field */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, party, reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#6339CA] text-xs font-medium bg-white"
            />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filters:</span>
          </div>

          {/* Payment Mode */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Mode</span>
            <select
              value={selectedPaymentMode}
              onChange={(e) => setSelectedPaymentMode(e.target.value)}
              className="bg-transparent outline-none text-xs font-bold text-slate-700 cursor-pointer"
            >
              <option value="All">All Modes</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Card">Card</option>
              <option value="Online">Online</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="bg-transparent outline-none text-xs font-bold text-slate-700 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          {/* Category */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Category</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent outline-none text-xs font-bold text-slate-700 cursor-pointer max-w-[150px] truncate"
            >
              <option value="All">All Categories</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {(selectedPaymentMode !== 'All' || selectedPaymentStatus !== 'All' || selectedCategory !== 'All' || searchTerm || clickedFilter) && (
            <button
              onClick={() => {
                setSelectedPaymentMode('All');
                setSelectedPaymentStatus('All');
                setSelectedCategory('All');
                setSearchTerm('');
                setClickedFilter(null);
              }}
              className="text-[10px] font-black text-#FAA928 hover:underline uppercase tracking-wider ml-auto"
            >
              Clear All Filters
            </button>
          )}

          <div className="ml-auto text-xs font-bold text-slate-500">
            Showing <strong className="text-[#321F5C]">{filteredFinances.length}</strong> records
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                <th className="px-6 py-3.5">ID / Date</th>
                <th className="px-6 py-3.5">Type & Category</th>
                <th className="px-6 py-3.5">Description</th>
                <th className="px-6 py-3.5">Party / Resident</th>
                <th className="px-6 py-3.5">Mode & Ref</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredFinances.map((f) => {
                const isExpense = f.finance_type === 'Expense';
                return (
                  <tr key={f.finance_id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-6 py-3.5">
                      <div className="space-y-0.5">
                        <span className="font-black text-[#6339CA] block">{f.finance_id}</span>
                        <span className="text-[10px] font-medium text-slate-400">
                          {f.transaction_date ? new Date(f.transaction_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="space-y-1">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                          f.finance_type === 'Income' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          f.finance_type === 'Expense' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                          f.finance_type === 'Maintenance' ? 'bg-[#6339CA]/10 text-[#6339CA] border border-[#6339CA]/20' :
                          'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {f.finance_type}
                        </span>
                        <p className="font-bold text-slate-700 truncate max-w-[140px]" title={f.category}>{f.category}</p>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-slate-700 max-w-xs line-clamp-2" title={f.description}>
                        {f.description}
                      </p>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="space-y-0.5">
                        <p className="font-bold text-[#321F5C]">{f.party_name || 'Society Office'}</p>
                        {f.resident_id && (
                          <span className="text-[10px] font-medium text-[#6339CA] bg-[#6339CA]/10 px-1.5 py-0.5 rounded">
                            Res ID: {f.resident_id}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-700 block">{f.payment_mode}</span>
                        {f.reference_number && (
                          <span className="text-[9px] font-mono text-slate-400 truncate max-w-[120px] block" title={f.reference_number}>
                            {f.reference_number}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`text-sm font-black ${isExpense ? 'text-#FAA928' : 'text-emerald-700'}`}>
                        {isExpense ? '-' : '+'}₹{Number(f.amount).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <button
                        onClick={() => handleToggleStatus(f)}
                        title="Click to toggle status"
                        className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                          f.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' :
                          f.payment_status === 'Pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' :
                          f.payment_status === 'Overdue' ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' :
                          'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {f.payment_status === 'Paid' ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {f.payment_status}
                      </button>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedReceipt(f)}
                          className="p-1.5 text-[#6339CA] hover:bg-[#6339CA]/10 rounded-lg transition-all"
                          title="View Voucher Receipt"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(f)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                          title="Edit Record"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setFinanceToDelete(f)}
                          className="p-1.5 text-#FAA928 hover:bg-rose-50 rounded-lg transition-all"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredFinances.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Wallet className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-sm font-bold text-slate-700">No financial records found</p>
                      <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or click "Add Record" to create a transaction.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* Add / Edit Financial Record Modal                                     */}
      {/* --------------------------------------------------------------------- */}
      {showAddEditModal && (
        <div className="fixed inset-0 bg-[#321F5C]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 bg-[#6339CA] text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-black">{editingFinance ? 'Edit Financial Record' : 'Add Financial Record'}</h3>
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-0.5">
                  {editingFinance ? `Editing ${editingFinance.finance_id}` : 'Create income, expense, or maintenance entry'}
                </p>
              </div>
              <button onClick={() => setShowAddEditModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              {/* Type and Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Type</label>
                  <select
                    value={formData.finance_type}
                    onChange={(e) => {
                      const newType = e.target.value as FinanceType;
                      setFormData({
                        ...formData,
                        finance_type: newType,
                        category: CATEGORY_SUGGESTIONS[newType]?.[0] || 'General'
                      });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#6339CA] font-bold text-xs bg-white"
                  >
                    <option value="Income">Income</option>
                    <option value="Expense">Expense</option>
                    <option value="Maintenance">Maintenance Collection</option>
                    <option value="Fine">Fine / Penalty</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                  <input
                    list="category-options"
                    required
                    placeholder="Category name"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#6339CA] font-bold text-xs"
                  />
                  <datalist id="category-options">
                    {CATEGORY_SUGGESTIONS[formData.finance_type]?.map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Amount and Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Amount in ₹"
                    value={isNaN(formData.amount) || formData.amount === 0 ? '' : formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#6339CA] font-bold text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Date</label>
                  <input
                    type="date"
                    required
                    value={formData.transaction_date}
                    onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#6339CA] font-bold text-xs"
                  />
                </div>
              </div>

              {/* Payment Mode and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Mode</label>
                  <select
                    value={formData.payment_mode}
                    onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value as PaymentMode })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#6339CA] font-bold text-xs bg-white"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Card">Card (Credit/Debit)</option>
                    <option value="Online">Online Gateway</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Status</label>
                  <select
                    value={formData.payment_status}
                    onChange={(e) => setFormData({ ...formData, payment_status: e.target.value as PaymentStatus })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#6339CA] font-bold text-xs bg-white"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
              </div>

              {/* Party Name and Reference Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Party / Payee / Payer</label>
                  <input
                    type="text"
                    placeholder="Resident or Vendor Name"
                    value={formData.party_name || ''}
                    onChange={(e) => setFormData({ ...formData, party_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#6339CA] font-bold text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference / Cheque #</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI/9928192 or CHQ-10291"
                    value={formData.reference_number || ''}
                    onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#6339CA] font-bold text-xs"
                  />
                </div>
              </div>

              {/* Optional Resident Link */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Link to Resident (Optional)</label>
                <select
                  value={formData.resident_id || ''}
                  onChange={(e) => {
                    const resId = e.target.value;
                    const res = residents.find(r => r.resident_id === resId);
                    setFormData({
                      ...formData,
                      resident_id: resId,
                      party_name: res ? `${res.name} (Flat ${res.flat})` : formData.party_name
                    });
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#6339CA] font-medium text-xs bg-white"
                >
                  <option value="">-- No Resident Link / External Vendor --</option>
                  {residents.map(r => (
                    <option key={r.resident_id} value={r.resident_id}>
                      {r.resident_id} - {r.name} (Tower {r.tower} - {r.flat})
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description / Purpose</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed notes or line item particulars..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#6339CA] font-medium text-xs"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] py-3 bg-[#6339CA] hover:bg-[#5D31C7] text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-[#6339CA]/10 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {editingFinance ? 'Update Record' : 'Save Record'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* Printable Receipt / Voucher Modal                                     */}
      {/* --------------------------------------------------------------------- */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-[#321F5C]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden flex flex-col">
            <div className="p-6 bg-[#321F5C] text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#6339CA] flex items-center justify-center text-white">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">Society Payment Voucher</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">TowerTech Official Receipt</p>
                </div>
              </div>
              <button onClick={() => setSelectedReceipt(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6 bg-slate-50/50">
              {/* Header Box */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                  <div>
                    <h4 className="text-base font-black text-[#321F5C]">Green Valley Co-operative Housing Society</h4>
                    <p className="text-xs text-slate-500">Reg. No: MAH/PUN/2026/GV | Society ID: {selectedReceipt.society_id}</p>
                    <p className="text-xs text-slate-500">Baner Road, Pune - 411045</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Voucher #</span>
                    <span className="text-sm font-black text-[#6339CA]">{selectedReceipt.finance_id}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Date</span>
                    <span className="font-bold text-slate-800">
                      {selectedReceipt.transaction_date ? new Date(selectedReceipt.transaction_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Transaction Type</span>
                    <span className="font-bold text-slate-800">{selectedReceipt.finance_type} ({selectedReceipt.category})</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Party / Payee / Payer</span>
                    <span className="font-bold text-slate-800">{selectedReceipt.party_name || 'Society Office'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Payment Mode</span>
                    <span className="font-bold text-slate-800">{selectedReceipt.payment_mode} ({selectedReceipt.reference_number || 'N/A'})</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Particulars / Description</span>
                  <p className="text-xs font-medium text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedReceipt.description}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100 bg-[#6339CA]/10/50 p-4 rounded-xl border">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#321F5C] block">Payment Status</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      selectedReceipt.payment_status === 'Paid' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                    }`}>
                      {selectedReceipt.payment_status}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Total Amount</span>
                    <span className="text-2xl font-black text-[#321F5C]">₹{Number(selectedReceipt.amount).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-3 bg-[#6339CA] hover:bg-[#5D31C7] text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#6339CA]/10"
                >
                  <Printer className="w-4 h-4" />
                  Print Voucher
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* Delete Confirmation Modal                                             */}
      {/* --------------------------------------------------------------------- */}
      {financeToDelete && (
        <div className="fixed inset-0 bg-[#321F5C]/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-rose-50 text-#FAA928 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#321F5C]">Delete Financial Record?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete record <strong className="text-slate-800">{financeToDelete.finance_id}</strong> (₹{financeToDelete.amount.toLocaleString('en-IN')})? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setFinanceToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteFinance}
                disabled={submitting}
                className="flex-1 py-2.5 bg-#FAA928 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
              >
                {submitting ? <Clock className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* Financial Statement / Summary Report Modal                            */}
      {/* --------------------------------------------------------------------- */}
      {showReportModal && (
        <div className="fixed inset-0 bg-[#321F5C]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 bg-[#321F5C] text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#6339CA] flex items-center justify-center text-white">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">Society Financial Statement</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Green Valley Housing Society - Fiscal Summary</p>
                </div>
              </div>
              <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
              {/* High level statement */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block">Total Revenue (Income)</span>
                  <span className="text-xl font-black text-emerald-700">₹{totalIncome.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                  <span className="text-[10px] font-black text-rose-800 uppercase tracking-widest block">Total Expenditures</span>
                  <span className="text-xl font-black text-rose-700">₹{totalExpenses.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-4 bg-[#6339CA]/10 border border-[#6339CA]/20 rounded-2xl">
                  <span className="text-[10px] font-black text-[#321F5C] uppercase tracking-widest block">Net Treasury Balance</span>
                  <span className="text-xl font-black text-[#6339CA]">₹{(totalIncome - totalExpenses).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Expense Breakdown by Category */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">Top Expenditure Breakdown</h4>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  {expenseChartData.map((item) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          {item.name}
                        </span>
                        <span>₹{item.value.toLocaleString('en-IN')} ({item.percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${item.percentage}%`, backgroundColor: item.color }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Maintenance Status Overview */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-[#321F5C] uppercase tracking-wider">Maintenance Dues Collection Rate</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Collected: <strong>₹{maintenanceCollected.toLocaleString('en-IN')}</strong> | Pending: <strong>₹{maintenancePending.toLocaleString('en-IN')}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-[#6339CA]">
                    {maintenancePercentage}%
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="px-6 py-2.5 bg-[#6339CA] hover:bg-[#5D31C7] text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Statement
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
