import React, { useState } from 'react';
import { 
  ArrowLeft, 
  CreditCard, 
  User, 
  Building2, 
  Calendar, 
  IndianRupee, 
  Check, 
  X, 
  Printer, 
  Download, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Layers, 
  Trash2,
  Sparkles,
  Phone,
  Mail,
  Receipt,
  ShieldCheck,
  Share2
} from 'lucide-react';
import { MaintenanceRecord, Resident } from '../../types';
import { format } from 'date-fns';

// ============================================================================
// 1. GENERATE MAINTENANCE BILL WORKSPACE
// ============================================================================
interface GenerateBillWorkspaceProps {
  residents: Resident[];
  onBack: () => void;
  onGenerate: (data: any) => Promise<void>;
  currentMonth: string;
}

export function GenerateBillWorkspace({
  residents,
  onBack,
  onGenerate,
  currentMonth
}: GenerateBillWorkspaceProps) {
  const now = new Date();
  const [billMode] = useState<'bulk'>('bulk');
  const [selectedResidentId] = useState<string>(residents[0]?.resident_id || '');
  const [billingMonth, setBillingMonth] = useState<string>(currentMonth);
  const [billingYear, setBillingYear] = useState<number>(now.getFullYear());
  const [calcMethod, setCalcMethod] = useState<'fixed' | 'flat_type' | 'sqft'>('flat_type');
  
  // Bulk bill charges
  const [baseAmount, setBaseAmount] = useState<number>(2500);
  const [sinkingFund, setSinkingFund] = useState<number>(250);
  const [waterCharges, setWaterCharges] = useState<number>(150);
  const [lateFeeRule, setLateFeeRule] = useState<number>(100);
  const [dueDate, setDueDate] = useState<string>(
    format(new Date(now.getFullYear(), now.getMonth(), 10), 'yyyy-MM-dd')
  );
  const [notes, setNotes] = useState<string>('Monthly maintenance and common facility charges.');
  const [submitting, setSubmitting] = useState(false);

  // Selected resident details (not needed for bulk but keeping for context if needed)
  const selectedResident = residents[0];

  // Auto calculate based on calc method
  const handleCalcMethodChange = (method: 'fixed' | 'flat_type' | 'sqft') => {
    setCalcMethod(method);

    if (method === 'fixed') {
      setBaseAmount(2500);
    } else if (method === 'flat_type') {
      setBaseAmount(2500);
    } else if (method === 'sqft') {
      setBaseAmount(2500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
        await onGenerate({
          mode: 'bulk',
          month: `${billingMonth} ${billingYear}`,
          base_amount: baseAmount,
          sinking_fund: sinkingFund,
          water_charges: waterCharges,
          late_fee: lateFeeRule,
          due_date: dueDate,
          notes,
          calc_method: calcMethod
        });
    } finally {
      setSubmitting(false);
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Top Header & Navigation Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs group"
            title="Back to Maintenance"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-[#321F5C] tracking-tight">
                Generate Maintenance Bill
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider bg-purple-50 text-purple-800 border-purple-200">
                All Resident Bills
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Generate and dispatch official monthly maintenance invoices for all society residents.
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5 self-end md:self-center">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-[#6339CA] hover:bg-[#5D31C7] text-white text-xs font-bold transition-all shadow-md shadow-purple-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <span>Generating Bills...</span>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Generate All Bills</span>
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Bill Schedule & Generation */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#321F5C] uppercase tracking-wider">
                  Section 1: Bill Schedule & Calculation Method
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Configure billing period and rates for all society residents</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Step 1 of 2</span>
          </div>

          <div className="p-6 space-y-6">
            <div className="p-4 rounded-xl bg-[#6339CA]/10 border border-[#6339CA]/20 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-[#321F5C]">Society Bulk Maintenance Invoicing</h4>
                <p className="text-xs text-[#321F5C]/80 mt-0.5">
                  Generates monthly bills for all {residents.length} resident units across all towers for {billingMonth} {billingYear}.
                </p>
              </div>
              <span className="px-3.5 py-1.5 rounded-xl bg-[#6339CA] text-white font-black text-xs">
                {residents.length} Flats Selected
              </span>
            </div>

            {/* Month, Year, and Calculation Method */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Billing Month *</label>
                <select
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#6339CA] focus:ring-2 focus:ring-[#6339CA]/10 outline-none text-xs font-bold text-slate-800 bg-white"
                >
                  {months.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Billing Year *</label>
                <select
                  value={billingYear}
                  onChange={(e) => setBillingYear(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-xs font-bold text-slate-800 bg-white"
                >
                  {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Calculation Method *</label>
                <select
                  value={calcMethod}
                  onChange={(e) => handleCalcMethodChange(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#6339CA] focus:ring-2 focus:ring-[#6339CA]/10 outline-none text-xs font-bold text-slate-800 bg-white"
                >
                  <option value="flat_type">BHK / Flat Type Standard Rates</option>
                  <option value="fixed">Fixed Rate (Uniform for all)</option>
                  <option value="sqft">Per Square Foot Rate (₹4.0/sqft)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Payment Terms & Due Dates */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#321F5C] uppercase tracking-wider">
                  Section 2: Base Rate & Payment Due Terms
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Timelines and overdue penalties</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Step 2 of 2</span>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Base Maintenance Rate (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={baseAmount}
                  onChange={(e) => setBaseAmount(Number(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#6339CA] focus:ring-2 focus:ring-[#6339CA]/10 outline-none text-xs font-bold text-slate-800 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Payment Due Date *</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none text-xs font-bold text-slate-800 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Late Fee Penalty if Unpaid (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={lateFeeRule}
                  onChange={(e) => setLateFeeRule(Number(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none text-xs font-bold text-slate-800 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Submission Toolbar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to Maintenance</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#6339CA] hover:bg-[#5D31C7] text-white text-xs font-bold transition-all shadow-md shadow-purple-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <span>Generating...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Generate Bill</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ============================================================================
// 2. VIEW MAINTENANCE BILL WORKSPACE
// ============================================================================
interface ViewBillWorkspaceProps {
  bill: MaintenanceRecord;
  resident?: Resident | null;
  onBack: () => void;
  onMarkPaid: (bill: MaintenanceRecord) => void;
  onPrintReceipt: (bill: MaintenanceRecord) => void;
  onDeleteBill?: (billId: string) => void;
}

export function ViewBillWorkspace({
  bill,
  resident,
  onBack,
  onMarkPaid,
  onPrintReceipt,
  onDeleteBill
}: ViewBillWorkspaceProps) {
  const isPaid = bill.status === 'Paid';
  const isOverdue = !isPaid && bill.due_date && new Date(bill.due_date) < new Date();
  const billNo = bill.bill_no || bill.maintenance_id;
  const residentName = bill.resident_name || resident?.name || 'Resident';

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Top Header & Navigation Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs group"
            title="Back to Maintenance"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-[#321F5C] tracking-tight">
                Maintenance Bill — {billNo}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${
                isPaid 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : isOverdue 
                    ? 'bg-rose-50 text-rose-700 border-rose-200' 
                    : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : 'PENDING'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Unit: Tower {bill.tower}, Flat {bill.flat_no} • Billing Month: {bill.month}
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5 self-end md:self-center">
          {!isPaid && (
            <button
              type="button"
              onClick={() => onMarkPaid(bill)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Mark as Paid</span>
            </button>
          )}

          {isPaid && (
            <button
              type="button"
              onClick={() => onPrintReceipt(bill)}
              className="px-4 py-2.5 bg-[#6339CA] hover:bg-[#5D31C7] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[#6339CA]/20 flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
          )}

          {onDeleteBill && (
            <button
              type="button"
              onClick={() => onDeleteBill(bill.maintenance_id || bill.id!)}
              className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              title="Delete Bill"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Bill & Resident Details (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section: Bill Overview Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#6339CA] text-white flex items-center justify-center font-bold">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#321F5C]">Green Valley Housing Society</h3>
                  <p className="text-xs text-slate-500">Baner Road, Pune • Reg: SOC-MH-PUN-2024-8890</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Invoice ID</span>
                <p className="font-mono font-bold text-purple-700 text-sm">{billNo}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Billing Month</p>
                <p className="font-bold text-slate-800 mt-0.5">{bill.month}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Issue Date</p>
                <p className="font-bold text-slate-800 mt-0.5">{bill.created_at ? format(new Date(bill.created_at), 'dd MMM yyyy') : '01 ' + bill.month}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Due Date</p>
                <p className="font-bold text-slate-800 mt-0.5">{bill.due_date ? format(new Date(bill.due_date), 'dd MMM yyyy') : '10 ' + bill.month}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status</p>
                <p className={`font-bold mt-0.5 ${isPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {bill.status}
                </p>
              </div>
            </div>
          </div>

          {/* Section: Resident Information */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" />
              <span>Resident & Apartment Allocation</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 text-xs">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Resident Name</p>
                <p className="font-black text-[#321F5C] mt-0.5 text-sm">{residentName}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Resident ID</p>
                <p className="font-mono font-bold text-purple-700 mt-0.5">{bill.resident_id}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Unit Number</p>
                <p className="font-bold text-[#321F5C] mt-0.5">Tower {bill.tower}, Flat {bill.flat_no}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Phone</p>
                <p className="font-mono text-slate-700 mt-0.5">{resident?.phone || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Email</p>
                <p className="text-slate-700 truncate mt-0.5">{resident?.email || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Flat Configuration</p>
                <p className="font-bold text-slate-800 mt-0.5">{resident?.bhk || '2 BHK'} ({resident?.square_feet || 620} sq.ft.)</p>
              </div>
            </div>
          </div>

          {/* Section: Financial Details Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-slate-500" />
              <span>Itemized Charges Breakdown</span>
            </h4>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="flex justify-between py-2.5">
                <span className="text-slate-600 font-medium">Standard Maintenance Charges</span>
                <span className="font-mono font-bold text-[#321F5C]">₹{(Number(bill.amount) * 0.8).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-600 font-medium">Sinking Fund & Building Reserve</span>
                <span className="font-mono font-bold text-[#321F5C]">₹{(Number(bill.amount) * 0.1).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-600 font-medium">Water & Common Electricity</span>
                <span className="font-mono font-bold text-[#321F5C]">₹{(Number(bill.amount) * 0.1).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
              {bill.late_fee ? (
                <div className="flex justify-between py-2.5 text-rose-600">
                  <span className="font-medium">Late Payment Fee</span>
                  <span className="font-mono font-bold">+ ₹{Number(bill.late_fee).toLocaleString('en-IN')}</span>
                </div>
              ) : null}
              <div className="flex justify-between py-3 text-sm font-black bg-purple-50/60 p-3 rounded-xl border border-purple-100 text-purple-950 mt-2">
                <span>Total Net Payable</span>
                <span className="font-mono text-purple-700 text-base">₹{Number(bill.amount).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Status & Payment Information (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Payment Status Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Payment Status</h4>

            <div className={`p-4 rounded-xl text-center space-y-2 border ${
              isPaid 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center font-bold text-lg ${
                isPaid ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
              }`}>
                {isPaid ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              <h5 className="font-black text-sm uppercase tracking-wider">{isPaid ? 'Payment Received' : 'Payment Awaiting'}</h5>
              <p className="text-xs text-slate-600">
                {isPaid 
                  ? `Completed on ${bill.payment_date ? format(new Date(bill.payment_date), 'dd MMMM yyyy') : 'Official Date'}` 
                  : `Due by ${bill.due_date ? format(new Date(bill.due_date), 'dd MMMM yyyy') : 'Schedule'}`
                }
              </p>
            </div>

            {isPaid ? (
              <div className="space-y-3 pt-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Payment Method:</span>
                  <span className="font-bold text-slate-800">{bill.payment_method || 'UPI Transfer'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Transaction ID:</span>
                  <span className="font-mono font-bold text-slate-800">{bill.transaction_id || `TXN-${bill.maintenance_id.slice(-6)}`}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Amount Received:</span>
                  <span className="font-mono font-bold text-emerald-700">₹{Number(bill.total_paid || bill.amount).toLocaleString('en-IN')}</span>
                </div>

                <button
                  type="button"
                  onClick={() => onPrintReceipt(bill)}
                  className="w-full mt-3 py-2.5 bg-[#6339CA] hover:bg-[#5D31C7] text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>View Official Receipt</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => onMarkPaid(bill)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Mark Bill as Paid</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Info Box */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 text-xs text-slate-600 space-y-2">
            <h5 className="font-black text-slate-800 uppercase tracking-wider text-[11px]">Society Bank Details</h5>
            <p><strong>Bank:</strong> HDFC Bank Ltd</p>
            <p><strong>Account Name:</strong> Green Valley Co-operative Society</p>
            <p><strong>A/C No:</strong> 50200088992211</p>
            <p><strong>IFSC:</strong> HDFC0001234</p>
            <p><strong>UPI ID:</strong> gvsociety@hdfcbank</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. MARK BILL AS PAID WORKSPACE
// ============================================================================
interface MarkBillPaidWorkspaceProps {
  bill: MaintenanceRecord;
  resident?: Resident | null;
  onBack: () => void;
  onConfirm: (paymentData: {
    amount: number;
    payment_date: string;
    payment_method: string;
    transaction_id: string;
    notes: string;
  }) => Promise<void>;
}

export function MarkBillPaidWorkspace({
  bill,
  resident,
  onBack,
  onConfirm
}: MarkBillPaidWorkspaceProps) {
  const [amountPaid, setAmountPaid] = useState<number>(Number(bill.amount));
  const [paymentDate, setPaymentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [transactionId, setTransactionId] = useState<string>(`TXN-${Date.now().toString().slice(-8)}`);
  const [bankName, setBankName] = useState<string>('HDFC Bank');
  const [notes, setNotes] = useState<string>('Full payment received and verified.');
  const [submitting, setSubmitting] = useState(false);

  const billNo = bill.bill_no || bill.maintenance_id;
  const residentName = bill.resident_name || resident?.name || 'Resident';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirm({
        amount: amountPaid,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        notes: notes ? `${notes} (Bank: ${bankName})` : `Bank: ${bankName}`
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Top Header & Navigation Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs group"
            title="Back to Bill"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-[#321F5C] tracking-tight">
                Record Payment for Bill {billNo}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider bg-emerald-50 text-emerald-800 border-emerald-200">
                Payment Entry
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Confirm payment receipt and update resident maintenance record.
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5 self-end md:self-center">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <span>Recording...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Confirm Payment</span>
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bill Summary Strip */}
        <div className="bg-[#321F5C] text-white rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full text-white">
              Target Invoice
            </span>
            <h3 className="text-xl font-black mt-2">{residentName} • Flat {bill.flat_no} (Tower {bill.tower})</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Billing Month: {bill.month} • Due Date: {bill.due_date ? format(new Date(bill.due_date), 'dd MMM yyyy') : 'Standard'}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Due</span>
            <span className="text-3xl font-black text-emerald-400 font-mono">₹{Number(bill.amount).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Payment Details Form */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#321F5C] uppercase tracking-wider">
                  Payment Details
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Enter transaction verification data</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Amount Paid (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-xs font-bold text-slate-800 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Payment Date *</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-xs font-bold text-slate-800 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-xs font-bold text-slate-800 bg-white"
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="NEFT/IMPS">NEFT / IMPS Net Banking</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Card">Debit / Credit Card</option>
                  <option value="Cash">Cash in Society Office</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Transaction ID / Reference Number *</label>
                <input
                  type="text"
                  required
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. UPI-2026-98124912 or Cheque #492102"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-xs font-bold font-mono text-slate-800 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Bank Name / Payer Details</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank, SBI, ICICI"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-xs font-medium text-slate-800 bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Payment Remarks / Verification Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes regarding this payment..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-xs font-medium text-slate-800 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Bottom Submission Toolbar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <span>Confirming...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirm Payment</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ============================================================================
// 4. BILL RECEIPT WORKSPACE (FULL-SCREEN PRINTABLE)
// ============================================================================
interface BillReceiptWorkspaceProps {
  bill: MaintenanceRecord;
  resident?: Resident | null;
  onBack: () => void;
}

export function BillReceiptWorkspace({
  bill,
  resident,
  onBack
}: BillReceiptWorkspaceProps) {
  const billNo = bill.bill_no || bill.maintenance_id;
  const residentName = bill.resident_name || resident?.name || 'Resident';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Top Header & Navigation Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs group"
            title="Back to Maintenance"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-[#321F5C] tracking-tight">
                Maintenance Payment Receipt
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider bg-emerald-50 text-emerald-800 border-emerald-200">
                Official Voucher
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Receipt #{billNo} • Generated for society audit and resident record.
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5 self-end md:self-center">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-[#6339CA] hover:bg-[#5D31C7] text-white text-xs font-bold transition-all shadow-md shadow-purple-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>

      {/* Printable Receipt Paper */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-8 sm:p-12 max-w-4xl mx-auto w-full space-y-8 font-sans">
        {/* Receipt Header */}
        <div className="flex justify-between items-start pb-6 border-b-2 border-slate-900">
          <div>
            <div className="flex items-center gap-2 text-[#6339CA] font-black text-xl tracking-tight">
              <Building2 className="w-6 h-6" />
              <span>TowerTech Residential Society</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">Baner - Hinjewadi Link Road, Pune - 411045, Maharashtra</p>
            <p className="text-xs text-slate-500">Reg. No: MAH/PUN/2024/SOC-8890 • Email: office@towertechsociety.com</p>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
              PAYMENT RECEIPT
            </span>
            <p className="text-xs font-mono font-black text-[#321F5C] mt-2">NO: {billNo}</p>
            <p className="text-xs text-slate-500 mt-0.5">Date: {bill.payment_date ? format(new Date(bill.payment_date), 'dd MMMM yyyy') : format(new Date(), 'dd MMMM yyyy')}</p>
          </div>
        </div>

        {/* Resident & Apartment Details */}
        <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 text-xs">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Received With Thanks From</p>
            <h4 className="text-base font-black text-[#321F5C] mt-1">{residentName}</h4>
            <p className="text-slate-600 mt-0.5 font-medium">Resident ID: {bill.resident_id}</p>
            <p className="text-slate-600 font-medium">Mobile: {resident?.phone || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Property / Unit Allocation</p>
            <h4 className="text-base font-black text-[#321F5C] mt-1">Tower {bill.tower} — Flat {bill.flat_no}</h4>
            <p className="text-slate-600 mt-0.5 font-medium">{resident?.bhk || '2 BHK'} Configuration</p>
            <p className="text-slate-600 font-medium">Billing Period: {bill.month}</p>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="space-y-2">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3 font-black">Sr.</th>
                <th className="py-3 font-black">Particulars / Description</th>
                <th className="py-3 font-black text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 text-slate-400 font-mono">01</td>
                <td className="py-3 font-bold text-slate-800">Monthly Society Maintenance ({bill.month})</td>
                <td className="py-3 font-mono font-bold text-[#321F5C] text-right">₹{(Number(bill.amount) * 0.8).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
              </tr>
              <tr>
                <td className="py-3 text-slate-400 font-mono">02</td>
                <td className="py-3 font-bold text-slate-800">Sinking Fund Reserve Contribution</td>
                <td className="py-3 font-mono font-bold text-[#321F5C] text-right">₹{(Number(bill.amount) * 0.1).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
              </tr>
              <tr>
                <td className="py-3 text-slate-400 font-mono">03</td>
                <td className="py-3 font-bold text-slate-800">Common Amenities & Water Utility Charges</td>
                <td className="py-3 font-mono font-bold text-[#321F5C] text-right">₹{(Number(bill.amount) * 0.1).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
              </tr>
              {bill.late_fee ? (
                <tr>
                  <td className="py-3 text-slate-400 font-mono">04</td>
                  <td className="py-3 font-bold text-rose-700">Late Payment Interest / Surcharge</td>
                  <td className="py-3 font-mono font-bold text-rose-700 text-right">+ ₹{Number(bill.late_fee).toLocaleString('en-IN')}</td>
                </tr>
              ) : null}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-900 text-sm font-black">
                <td colSpan={2} className="py-4 text-[#321F5C] uppercase">Total Received Amount</td>
                <td className="py-4 text-right font-mono text-[#6339CA] text-base">₹{Number(bill.amount).toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Payment Transaction Details */}
        <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Payment Mode</span>
            <span className="font-bold text-slate-800">{bill.payment_method || 'UPI / Online'}</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Transaction Reference</span>
            <span className="font-mono font-bold text-slate-800 truncate block">{bill.transaction_id || `TXN-${bill.maintenance_id.slice(-6)}`}</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Payment Date</span>
            <span className="font-bold text-slate-800">{bill.payment_date ? format(new Date(bill.payment_date), 'dd MMM yyyy') : format(new Date(), 'dd MMM yyyy')}</span>
          </div>
        </div>

        {/* Footer & Signatures */}
        <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs">
          <div>
            <p className="text-[11px] text-slate-500">This is a computer-generated society payment receipt.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">TowerTech Management Portal • Verification ID: {bill.id || bill.maintenance_id}</p>
          </div>
          <div className="text-center">
            <div className="w-36 h-12 border-b-2 border-slate-800 mb-2"></div>
            <p className="font-black text-[#321F5C] text-xs">Authorized Signatory</p>
            <p className="text-[10px] text-slate-500">Hon. Treasurer / Secretary</p>
          </div>
        </div>
      </div>
    </div>
  );
}
