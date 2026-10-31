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
  TrendingDown,
  Download,
  Share2,
  Lock,
  Building2,
  Users,
  ShieldCheck,
  DollarSign,
  Receipt,
  FileCheck,
  PiggyBank,
  Landmark,
  History,
  Settings,
  Send,
  Eye,
  XCircle,
  Award,
  AlertTriangle
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { 
  Finance, 
  FinanceType, 
  PaymentMode, 
  PaymentStatus, 
  Resident, 
  MaintenanceRecord, 
  User, 
  StaffSalaryRecord, 
  ServiceContract,
  IncomeEntry,
  ExpenseRecord,
  SocietyFund,
  BankAccount,
  FinancialAuditLog
} from '../types';
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

// 14 Core Financial Navigation Sub-sections
type FinancialTab = 
  | 'overview'
  | 'billing'
  | 'payments'
  | 'receipts'
  | 'income'
  | 'expenses'
  | 'salaries'
  | 'vendors'
  | 'funds'
  | 'cash_bank'
  | 'outstanding'
  | 'reports'
  | 'audit_logs'
  | 'settings';

const EXPENSE_COLORS: Record<string, string> = {
  'Electricity': '#8b5cf6',
  'Cleaning': '#44D080',
  'Staff Salary': '#7c3aed',
  'Security': '#6339CA',
  'Water': '#38bdf8',
  'Repairs & Maintenance': '#FAA928',
  'Lift Maintenance': '#c084fc',
  'Other Expenses': '#f43f5e',
};

const INCOME_COLORS: Record<string, string> = {
  'Maintenance Collection': '#8b5cf6',
  'Parking Charges': '#38bdf8',
  'Clubhouse Charges': '#44D080',
  'Penalties/Fines': '#FAA928',
  'Other Income': '#7c3aed',
};

const FALLBACK_PALETTE = ['#8b5cf6', '#7c3aed', '#6339CA', '#FAA928', '#44D080', '#c084fc', '#f43f5e', '#38bdf8'];

export default function FinanceDashboard({ user, residents, maintenance, onRefresh }: FinanceDashboardProps) {
  const isAdmin = user.role === 'admin' || !!user.admin_id;

  // Active Tab
  const [activeTab, setActiveTab] = useState<FinancialTab>('overview');

  // Filter Date Range
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month' | 'quarter' | 'year'>('all');

  // Core Data States
  const [finances, setFinances] = useState<Finance[]>([]);
  const [bills, setBills] = useState<MaintenanceRecord[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [incomes, setIncomes] = useState<IncomeEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [salaries, setSalaries] = useState<StaffSalaryRecord[]>([]);
  const [vendors, setVendors] = useState<ServiceContract[]>([]);
  const [funds, setFunds] = useState<SocietyFund[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [auditLogs, setAuditLogs] = useState<FinancialAuditLog[]>([]);
  const [settings, setSettings] = useState<any>({
    currency: 'INR',
    billing_day: 1,
    due_day: 10,
    grace_period_days: 5,
    late_fee_type: 'fixed',
    late_fee_amount: 100
  });

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Workspaces
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingFinance, setEditingFinance] = useState<Finance | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);

  // Billing Config & Generation
  const [rateMethod, setRateMethod] = useState<'per_bhk' | 'per_sqft' | 'hybrid' | 'fixed'>('per_bhk');
  const [bhkRates, setBhkRates] = useState({ '1 BHK': 2000, '2 BHK': 3000, '3 BHK': 4000, '4 BHK': 5000 });
  const [sqftRate, setSqftRate] = useState(4);
  const [hybridBase, setHybridBase] = useState(1500);
  const [hybridSqftRate, setHybridSqftRate] = useState(2);
  const [fixedAmount, setFixedAmount] = useState(2500);
  const [billMonth, setBillMonth] = useState('March 2026');

  // Expense Modal Form
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [newExpenseTitle, setNewExpenseTitle] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('Repairs & Maintenance');
  const [newExpenseVendor, setNewExpenseVendor] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState<number | ''>('');
  const [newExpenseDescription, setNewExpenseDescription] = useState('');

  // Load All Financial Data
  const loadAllFinancialData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const socId = user.society_id || 'GV2026';
      const [
        finData,
        maintData,
        payData,
        rcptData,
        incData,
        expData,
        salData,
        venData,
        fndData,
        accData,
        auditData,
        settData
      ] = await Promise.all([
        societyService.getFinances(socId),
        societyService.getMaintenance(),
        societyService.getFinancialPayments(socId),
        societyService.getPaymentReceipts(socId),
        societyService.getIncomeEntries(socId),
        societyService.getExpenses(socId),
        societyService.getStaffMembers(socId),
        societyService.getServiceContracts(socId),
        societyService.getSocietyFunds(socId),
        societyService.getFinancialAccounts(socId),
        societyService.getFinancialAuditLogs(socId),
        societyService.getFinancialSettings(socId)
      ]);

      setFinances(finData || []);
      setBills(maintData || []);
      setPayments(payData || []);
      setReceipts(rcptData || []);
      setIncomes(incData || []);
      setExpenses(expData || []);
      setSalaries(salData || []);
      setVendors(venData || []);
      setFunds(fndData || []);
      setAccounts(accData || []);
      setAuditLogs(auditData || []);
      if (settData) setSettings(settData);
    } catch (err) {
      console.error('Error loading financial suite:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadAllFinancialData();
  }, [user.society_id, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-rose-100 shadow-sm text-center max-w-2xl mx-auto my-12">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-[#6339CA] mb-2">Access Denied / Restricted Financial Access</h2>
        <p className="text-sm font-medium text-slate-500 leading-relaxed mb-6">
          The Society Financial Suite contains sensitive ledger statements, cash reserves, and expenditure controls. Only authorized Administrators and Treasurers have access.
        </p>
      </div>
    );
  }

  // Financial Metrics
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

  const totalMaintenanceBilled = useMemo(() => {
    return bills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  }, [bills]);

  const totalMaintenanceCollected = useMemo(() => {
    return bills.filter(b => b.status === 'Paid' || b.status === 'paid').reduce((sum, b) => sum + (Number(b.total_paid || b.amount) || 0), 0);
  }, [bills]);

  const pendingMaintenance = useMemo(() => {
    return bills.filter(b => b.status === 'Unpaid' || b.status === 'unpaid' || b.status === 'Pending').reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  }, [bills]);

  const overdueMaintenance = useMemo(() => {
    return bills.filter(b => b.status === 'Overdue' || b.status === 'overdue').reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  }, [bills]);

  const totalSocietyFunds = useMemo(() => {
    return funds.reduce((sum, f) => sum + (Number(f.closing_balance || f.opening_balance) || 0), 0);
  }, [funds]);

  const bankBalance = useMemo(() => {
    return accounts.reduce((sum, a) => sum + (Number(a.current_balance || a.opening_balance) || 0), 0);
  }, [accounts]);

  // Bulk Maintenance Generator
  const handleGenerateBulkMaintenance = async () => {
    if (residents.length === 0) {
      toast.error('No residents found for maintenance bill generation.');
      return;
    }

    try {
      const generatedBills = residents.map(r => {
        let amt = 2500;
        if (rateMethod === 'per_bhk') {
          const bhk = r.bhk || '2 BHK';
          amt = (bhkRates as any)[bhk] || 3000;
        } else if (rateMethod === 'per_sqft') {
          const sqft = r.square_feet || 700;
          amt = sqft * sqftRate;
        } else if (rateMethod === 'hybrid') {
          const sqft = r.square_feet || 700;
          amt = hybridBase + (sqft * hybridSqftRate);
        } else {
          amt = fixedAmount;
        }

        return {
          resident_id: r.resident_id,
          resident_name: r.name,
          flat_no: r.flat,
          tower: r.tower,
          month: billMonth,
          amount: amt,
          status: 'Unpaid',
          due_date: '2026-04-10',
          society_id: user.society_id || 'GV2026',
          generated_by: user.name || 'Treasurer'
        };
      });

      await societyService.createBulkMaintenanceBills(generatedBills as any);
      await societyService.logFinancialAction({
        society_id: user.society_id || 'GV2026',
        user_name: user.name,
        user_role: 'Treasurer',
        action: 'GENERATE_BULK_MAINTENANCE',
        module_name: 'Maintenance Billing',
        reason: `Generated ${generatedBills.length} maintenance bills for ${billMonth}`
      });

      toast.success(`Successfully generated ${generatedBills.length} maintenance bills for ${billMonth}!`);
      loadAllFinancialData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate bulk bills.');
    }
  };

  // Add Expense Handler
  const handleAddExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseTitle.trim() || !newExpenseAmount || Number(newExpenseAmount) <= 0) {
      toast.error('Please enter a valid title and expense amount.');
      return;
    }

    try {
      await societyService.addExpense({
        society_id: user.society_id || 'GV2026',
        expense_title: newExpenseTitle.trim(),
        category_name: newExpenseCategory,
        vendor_name: newExpenseVendor.trim() || 'Vendor',
        amount: Number(newExpenseAmount),
        description: newExpenseDescription.trim(),
        approval_status: 'pending',
        payment_status: 'unpaid',
        expense_date: new Date().toISOString().split('T')[0],
        created_by: user.name
      });

      await societyService.logFinancialAction({
        society_id: user.society_id || 'GV2026',
        user_name: user.name,
        user_role: user.role,
        action: 'CREATE_EXPENSE',
        module_name: 'Expense Management',
        reason: `Added new expense: ${newExpenseTitle} (₹${newExpenseAmount})`
      });

      toast.success('Expense submitted for Chairperson approval!');
      setShowAddExpenseModal(false);
      setNewExpenseTitle('');
      setNewExpenseAmount('');
      setNewExpenseDescription('');
      loadAllFinancialData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit expense');
    }
  };

  // Expense Approval Handler
  const handleApproveExpense = async (expId: string) => {
    try {
      await societyService.updateExpenseApproval(expId, 'approved', user.admin_id || 'A001', 'Approved by Committee');
      toast.success('Expense approved successfully!');
      loadAllFinancialData();
    } catch {
      toast.error('Approval failed');
    }
  };

  // Navigation Tabs Configuration
  const navTabs: { id: FinancialTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutGridIcon },
    { id: 'billing', label: 'Maintenance Billing', icon: Receipt },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'receipts', label: 'Receipts', icon: FileCheck },
    { id: 'income', label: 'Income', icon: ArrowUpRight },
    { id: 'expenses', label: 'Expenses', icon: ArrowDownRight },
    { id: 'salaries', label: 'Staff Salaries', icon: Users },
    { id: 'vendors', label: 'Vendor Payments', icon: Building2 },
    { id: 'funds', label: 'Society Funds', icon: PiggyBank },
    { id: 'cash_bank', label: 'Cash & Bank', icon: Landmark },
    { id: 'outstanding', label: 'Outstanding Dues', icon: AlertCircle },
    { id: 'reports', label: 'Financial Reports', icon: FileText },
    { id: 'audit_logs', label: 'Audit Logs', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  function LayoutGridIcon(props: any) {
    return <Layers {...props} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* --------------------------------------------------------------------- */}
      {/* Top Header & Navigation Launcher Bar */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#6339CA]/10 text-[#6339CA] flex items-center justify-center border border-[#6339CA]/20">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-[#6339CA] tracking-tight">Financial Management Suite</h2>
                <span className="bg-[#6339CA] text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Green Park Residency
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Complete society financial accounting, maintenance rules, vouchers, staff payroll, and double-entry ledgers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAllFinancialData}
              disabled={loading}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
              title="Sync Financial Ledger"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#6339CA]' : ''}`} />
            </button>
            <button
              onClick={() => setShowAddExpenseModal(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
            <button
              onClick={handleGenerateBulkMaintenance}
              className="px-5 py-2.5 bg-[#6339CA] hover:bg-[#5D31C7] text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2"
            >
              <Receipt className="w-4 h-4" />
              Run Billing
            </button>
          </div>
        </div>

        {/* 14 Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-t border-slate-100 pt-4 scrollbar-none">
          {navTabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  active 
                    ? 'bg-[#6339CA] text-white shadow-md shadow-purple-200' 
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-amber-300' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* SECTION 1: OVERVIEW DASHBOARD */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 8 Financial Position Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-emerald-600 text-white p-5 rounded-2xl shadow-md">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">1. Total Income</span>
              <h3 className="text-2xl font-black font-mono mt-2">₹{totalIncome.toLocaleString('en-IN')}</h3>
              <p className="text-[11px] text-emerald-100 font-bold mt-1">Verified Inflows</p>
            </div>

            <div className="bg-rose-600 text-white p-5 rounded-2xl shadow-md">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-200">2. Total Expenses</span>
              <h3 className="text-2xl font-black font-mono mt-2">₹{totalExpenses.toLocaleString('en-IN')}</h3>
              <p className="text-[11px] text-rose-100 font-bold mt-1">Operational Outlays</p>
            </div>

            <div className="bg-purple-700 text-white p-5 rounded-2xl shadow-md">
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-200">3. Billed Maintenance</span>
              <h3 className="text-2xl font-black font-mono mt-2">₹{totalMaintenanceBilled.toLocaleString('en-IN')}</h3>
              <p className="text-[11px] text-purple-100 font-bold mt-1">Total Generated</p>
            </div>

            <div className="bg-[#6339CA] text-white p-5 rounded-2xl shadow-md">
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-200">4. Collected Dues</span>
              <h3 className="text-2xl font-black font-mono mt-2">₹{totalMaintenanceCollected.toLocaleString('en-IN')}</h3>
              <p className="text-[11px] text-purple-100 font-bold mt-1">Collected Dues</p>
            </div>

            <div className="bg-amber-500 text-white p-5 rounded-2xl shadow-md">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-100">5. Pending Maintenance</span>
              <h3 className="text-2xl font-black font-mono mt-2">₹{pendingMaintenance.toLocaleString('en-IN')}</h3>
              <p className="text-[11px] text-amber-100 font-bold mt-1">Awaiting Payment</p>
            </div>

            <div className="bg-red-700 text-white p-5 rounded-2xl shadow-md">
              <span className="text-[10px] font-black uppercase tracking-widest text-red-200">6. Overdue Maintenance</span>
              <h3 className="text-2xl font-black font-mono mt-2">₹{overdueMaintenance.toLocaleString('en-IN')}</h3>
              <p className="text-[11px] text-red-100 font-bold mt-1">Critical Overdue</p>
            </div>

            <div className="bg-indigo-700 text-white p-5 rounded-2xl shadow-md">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">7. Society Funds</span>
              <h3 className="text-2xl font-black font-mono mt-2">₹{totalSocietyFunds.toLocaleString('en-IN')}</h3>
              <p className="text-[11px] text-indigo-100 font-bold mt-1">Reserves & Sinking</p>
            </div>

            <div className="bg-blue-600 text-white p-5 rounded-2xl shadow-md">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">8. Bank Balance</span>
              <h3 className="text-2xl font-black font-mono mt-2">₹{bankBalance.toLocaleString('en-IN')}</h3>
              <p className="text-[11px] text-blue-100 font-bold mt-1">Bank & Cash Accounts</p>
            </div>
          </div>

          {/* Financial Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-black text-[#6339CA] uppercase mb-4">Monthly Income vs Expenses</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[
                  { month: 'Oct 2025', Income: 780000, Expense: 420000 },
                  { month: 'Nov 2025', Income: 810000, Expense: 450000 },
                  { month: 'Dec 2025', Income: 830000, Expense: 490000 },
                  { month: 'Jan 2026', Income: 820000, Expense: 440000 },
                  { month: 'Feb 2026', Income: 840000, Expense: 460000 },
                  { month: 'Mar 2026', Income: totalIncome, Expense: totalExpenses }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Income" fill="#44D080" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expense" fill="#FAA928" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-black text-[#6339CA] uppercase mb-4">Maintenance Collection Trend</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={[
                  { month: 'Oct', Billed: 800000, Collected: 760000 },
                  { month: 'Nov', Billed: 800000, Collected: 780000 },
                  { month: 'Dec', Billed: 800000, Collected: 790000 },
                  { month: 'Jan', Billed: 800000, Collected: 775000 },
                  { month: 'Feb', Billed: 800000, Collected: 810000 },
                  { month: 'Mar', Billed: totalMaintenanceBilled || 850000, Collected: totalMaintenanceCollected }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Billed" stroke="#6339CA" strokeWidth={2} />
                  <Line type="monotone" dataKey="Collected" stroke="#059669" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* SECTION 2: MAINTENANCE BILLING MANAGEMENT */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Rate Configuration Panel */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-[#6339CA] uppercase">Maintenance Rate Configuration</h3>
                <p className="text-xs text-slate-500">Configure society maintenance calculation strategy</p>
              </div>
              <span className="text-xs font-black uppercase text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                Active: {rateMethod.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <button
                onClick={() => setRateMethod('per_bhk')}
                className={`p-3 rounded-2xl border text-left font-black text-xs uppercase cursor-pointer ${
                  rateMethod === 'per_bhk' ? 'bg-[#6339CA] text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Per BHK Rate
              </button>
              <button
                onClick={() => setRateMethod('per_sqft')}
                className={`p-3 rounded-2xl border text-left font-black text-xs uppercase cursor-pointer ${
                  rateMethod === 'per_sqft' ? 'bg-[#6339CA] text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Per Sq.Ft. Rate
              </button>
              <button
                onClick={() => setRateMethod('hybrid')}
                className={`p-3 rounded-2xl border text-left font-black text-xs uppercase cursor-pointer ${
                  rateMethod === 'hybrid' ? 'bg-[#6339CA] text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Hybrid Formula
              </button>
              <button
                onClick={() => setRateMethod('fixed')}
                className={`p-3 rounded-2xl border text-left font-black text-xs uppercase cursor-pointer ${
                  rateMethod === 'fixed' ? 'bg-[#6339CA] text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Fixed Monthly
              </button>
            </div>

            {/* BHK Inputs */}
            {rateMethod === 'per_bhk' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-purple-50/50 p-4 rounded-2xl border border-purple-100 text-xs">
                <div>
                  <label className="font-bold text-slate-500 block">1 BHK (₹)</label>
                  <input
                    type="number"
                    value={bhkRates['1 BHK']}
                    onChange={(e) => setBhkRates({ ...bhkRates, '1 BHK': parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 p-2 bg-white rounded-xl border border-purple-200 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-500 block">2 BHK (₹)</label>
                  <input
                    type="number"
                    value={bhkRates['2 BHK']}
                    onChange={(e) => setBhkRates({ ...bhkRates, '2 BHK': parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 p-2 bg-white rounded-xl border border-purple-200 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-500 block">3 BHK (₹)</label>
                  <input
                    type="number"
                    value={bhkRates['3 BHK']}
                    onChange={(e) => setBhkRates({ ...bhkRates, '3 BHK': parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 p-2 bg-white rounded-xl border border-purple-200 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-500 block">4 BHK (₹)</label>
                  <input
                    type="number"
                    value={bhkRates['4 BHK']}
                    onChange={(e) => setBhkRates({ ...bhkRates, '4 BHK': parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 p-2 bg-white rounded-xl border border-purple-200 font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Maintenance Bills Table */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-[#6339CA] uppercase">Generated Maintenance Bills ({bills.length})</h3>
              <input
                type="text"
                placeholder="Search flat or resident..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold outline-none"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black border-b border-slate-100">
                  <tr>
                    <th className="p-3">Bill ID</th>
                    <th className="p-3">Flat Details</th>
                    <th className="p-3">Resident</th>
                    <th className="p-3">Billing Month</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                  {bills.filter(b => !searchTerm || b.flat_no.includes(searchTerm) || (b.resident_name || '').toLowerCase().includes(searchTerm.toLowerCase())).map((b) => (
                    <tr key={b.maintenance_id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-[#6339CA]">{b.maintenance_id}</td>
                      <td className="p-3">Flat {b.flat_no} (T-{b.tower})</td>
                      <td className="p-3">{b.resident_name || 'Resident'}</td>
                      <td className="p-3">{b.month}</td>
                      <td className="p-3 font-mono font-black">₹{b.amount.toLocaleString('en-IN')}</td>
                      <td className="p-3 font-mono">{b.due_date}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          b.status === 'Paid' || b.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* SECTION 3: PAYMENTS MANAGEMENT */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'payments' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-[#6339CA] uppercase">Centralized Payment Ledger</h3>
              <p className="text-xs text-slate-500">Verified online payments and manual society payment recordings</p>
            </div>
            <span className="text-xs font-bold text-slate-500">{payments.length} Transactions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black">
                <tr>
                  <th className="p-3">Payment No.</th>
                  <th className="p-3">Payer / Flat</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                {payments.map(p => (
                  <tr key={p.id || p.payment_number} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-[#6339CA]">{p.payment_number}</td>
                    <td className="p-3">{p.payer_name} ({p.flat_number})</td>
                    <td className="p-3 uppercase text-[10px]">{p.payment_category}</td>
                    <td className="p-3 font-black font-mono">₹{p.amount.toLocaleString('en-IN')}</td>
                    <td className="p-3 uppercase">{p.payment_method}</td>
                    <td className="p-3 font-mono">{p.payment_date?.split('T')[0]}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                        {p.status || 'Successful'}
                      </span>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 font-medium">No verified online transactions recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* SECTION 4: RECEIPTS MANAGEMENT */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'receipts' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-[#6339CA] uppercase">Payment Receipts Ledger</h3>
              <p className="text-xs text-slate-500">Official PDF receipts generated for resident payments</p>
            </div>
            <span className="text-xs font-bold text-slate-500">{receipts.length} Receipts Issued</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {receipts.map(r => (
              <div key={r.receipt_number} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="font-mono font-black text-xs text-[#6339CA]">{r.receipt_number}</span>
                  <span className="text-[10px] font-bold text-slate-400">{r.payment_date?.split('T')[0]}</span>
                </div>
                <p className="font-black text-slate-900 text-sm">{r.payer_name}</p>
                <p className="text-xs text-slate-500 font-bold">Flat {r.flat_number} · Method: {r.payment_method}</p>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-black text-[#6339CA] text-base">₹{r.amount.toLocaleString('en-IN')}</span>
                  <button
                    onClick={() => toast.success(`Receipt ${r.receipt_number} ready for print/download`)}
                    className="px-3 py-1.5 bg-[#6339CA] text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3 h-3" />
                    Print PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* SECTION 6: EXPENSE MANAGEMENT WITH APPROVAL WORKFLOW */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'expenses' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-[#6339CA] uppercase">Society Expense Ledger & Approvals</h3>
              <p className="text-xs text-slate-500">Expenditure tracking across 20 society categories with multi-step approvals</p>
            </div>
            <button
              onClick={() => setShowAddExpenseModal(true)}
              className="px-4 py-2 bg-[#6339CA] text-white rounded-xl text-xs font-black uppercase cursor-pointer"
            >
              + New Expense
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black">
                <tr>
                  <th className="p-3">Expense No.</th>
                  <th className="p-3">Title / Vendor</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Approval</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                {expenses.map(e => (
                  <tr key={e.id || e.expense_number} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-[#6339CA]">{e.expense_number}</td>
                    <td className="p-3">{e.expense_title} <span className="text-slate-400 font-normal">({e.vendor_name || 'Vendor'})</span></td>
                    <td className="p-3">{e.category_name || 'General'}</td>
                    <td className="p-3 font-black font-mono">₹{e.amount.toLocaleString('en-IN')}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        e.approval_status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {e.approval_status}
                      </span>
                    </td>
                    <td className="p-3 uppercase text-[10px]">{e.payment_status}</td>
                    <td className="p-3 text-right">
                      {e.approval_status === 'pending' && (
                        <button
                          onClick={() => handleApproveExpense(e.id || e.expense_number)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase cursor-pointer"
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* SECTION 9: SOCIETY FUNDS MANAGEMENT */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'funds' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-[#6339CA] uppercase">Society Capital & Earmarked Funds</h3>
              <p className="text-xs text-slate-500">General, Sinking, Major Repair, and Emergency Reserves</p>
            </div>
            <span className="text-sm font-black text-[#6339CA]">Total Reserve: ₹{totalSocietyFunds.toLocaleString('en-IN')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {funds.map(f => (
              <div key={f.fund_name} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase text-purple-900">{f.fund_name}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{f.fund_type}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2">
                  <span className="text-2xl font-black text-[#6339CA] font-mono">₹{(f.closing_balance || f.opening_balance).toLocaleString('en-IN')}</span>
                  <span className="text-xs font-bold text-emerald-600">+₹{(f.interest_earned || 0).toLocaleString('en-IN')} Interest</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* SECTION 13: AUDIT LOGS */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'audit_logs' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-[#6339CA] uppercase">Immutable Financial Audit Trail</h3>
              <p className="text-xs text-slate-500">Chronological history of financial mutations, approvals, and billings</p>
            </div>
          </div>

          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id || log.created_at} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-purple-900">{log.user_name || 'Admin'}</span>
                    <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">{log.action}</span>
                  </div>
                  <p className="text-slate-600 font-medium mt-1">{log.reason || 'Financial operation executed'}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{log.created_at?.split('T')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Expense Modal Popup */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-[140] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-[#6339CA] uppercase">Add Society Expense</h3>
              <button onClick={() => setShowAddExpenseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-500 block">Expense Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pump House Electrical Repair"
                  value={newExpenseTitle}
                  onChange={(e) => setNewExpenseTitle(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-500 block">Category</label>
                  <select
                    value={newExpenseCategory}
                    onChange={(e) => setNewExpenseCategory(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-bold outline-none"
                  >
                    <option value="Electricity">Electricity</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Staff Salary">Staff Salary</option>
                    <option value="Security">Security</option>
                    <option value="Water">Water</option>
                    <option value="Repairs & Maintenance">Repairs & Maintenance</option>
                    <option value="Lift Maintenance">Lift Maintenance</option>
                    <option value="Other Expenses">Other Expenses</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-500 block">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="e.g. 4500"
                    value={newExpenseAmount}
                    onChange={(e) => setNewExpenseAmount(parseFloat(e.target.value) || '')}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-bold outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-500 block">Vendor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Metro Civil Works"
                  value={newExpenseVendor}
                  onChange={(e) => setNewExpenseVendor(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-bold outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-500 block">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Details of expense..."
                  value={newExpenseDescription}
                  onChange={(e) => setNewExpenseDescription(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-medium outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#6339CA] hover:bg-[#5D31C7] text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-md mt-2"
              >
                Submit Expense
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
