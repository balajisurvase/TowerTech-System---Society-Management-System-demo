import React, { useState } from 'react';
import { 
  ArrowLeft, 
  IndianRupee, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  CreditCard, 
  Check, 
  X, 
  Printer, 
  Download, 
  FileText, 
  Building, 
  Building2,
  Trash2, 
  Clock, 
  ShieldCheck, 
  Layers
} from 'lucide-react';
import { Finance, FinanceType, PaymentMode, PaymentStatus } from '../../types';
import { format } from 'date-fns';

const CATEGORY_SUGGESTIONS: Record<FinanceType, string[]> = {
  Income: [
    'Maintenance Collection',
    'Monthly Maintenance',
    'Parking Charges',
    'Facility Booking Charges',
    'Clubhouse Booking',
    'Penalties',
    'Donations',
    'Society Contributions',
    'Interest Income',
    'Other Income'
  ],
  Expense: [
    'Electricity',
    'Water',
    'Garbage Collection',
    'Plumbing',
    'Electrical Maintenance',
    'Lift Maintenance',
    'Security',
    'Housekeeping',
    'Gardening',
    'Fire Safety',
    'CCTV Maintenance',
    'Generator/DG Maintenance',
    'Building Repairs',
    'Staff Salaries',
    'Vendor Payments',
    'Insurance',
    'Administrative Expenses',
    'Equipment Purchases',
    'Other Expenses'
  ],
  Maintenance: ['Monthly Maintenance', 'Maintenance Collection', 'Sinking Fund', 'Special Amenity Charge', 'Water Utility'],
  Fine: ['Late Payment Penalty', 'Improper Parking Fine', 'Noise Violation', 'Renovation Overdue Fine', 'Garbage Mismanagement']
};

// ============================================================================
// 1. ADD / EDIT FINANCIAL RECORD WORKSPACE (FULL SCREEN)
// ============================================================================
interface AddEditFinanceWorkspaceProps {
  mode: 'add' | 'edit';
  editingFinance?: Finance | null;
  onBack: () => void;
  onSubmit: (formData: any) => Promise<void>;
}

export function AddEditFinanceWorkspace({
  mode,
  editingFinance,
  onBack,
  onSubmit
}: AddEditFinanceWorkspaceProps) {
  const [financeType, setFinanceType] = useState<FinanceType>(editingFinance?.finance_type || 'Expense');
  const [category, setCategory] = useState<string>(
    editingFinance?.category || CATEGORY_SUGGESTIONS[editingFinance?.finance_type || 'Expense'][0]
  );
  const [description, setDescription] = useState<string>(editingFinance?.description || '');
  const [amount, setAmount] = useState<number>(editingFinance?.amount || 0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(editingFinance?.payment_mode || 'Bank Transfer');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(editingFinance?.payment_status || 'Paid');
  const [transactionDate, setTransactionDate] = useState<string>(
    editingFinance?.transaction_date || format(new Date(), 'yyyy-MM-dd')
  );
  const [partyName, setPartyName] = useState<string>(editingFinance?.party_name || '');
  const [referenceNumber, setReferenceNumber] = useState<string>(editingFinance?.reference_number || '');
  const [submitting, setSubmitting] = useState(false);

  const handleTypeChange = (type: FinanceType) => {
    setFinanceType(type);
    setCategory(CATEGORY_SUGGESTIONS[type][0] || 'General');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        finance_type: financeType,
        category,
        description,
        amount: Number(amount),
        payment_mode: paymentMode,
        payment_status: paymentStatus,
        transaction_date: transactionDate,
        party_name: partyName,
        reference_number: referenceNumber
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
            title="Back to Finance"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {mode === 'edit' ? 'Edit Financial Record' : 'Add Financial Record'}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${
                financeType === 'Income' || financeType === 'Maintenance'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {financeType}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              {mode === 'edit' ? `Updating entry #${editingFinance?.finance_id}` : 'Record society revenue, operational expense, or vendor payment.'}
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
            onClick={handleFormSubmit}
            disabled={submitting || amount <= 0}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <span>Saving...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{mode === 'edit' ? 'Update Record' : 'Save Financial Record'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* SECTION 1: Transaction Type & Category */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Section 1: Transaction Type & Categorization
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Select entry classification and ledger head</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Step 1 of 3</span>
          </div>

          <div className="p-6 space-y-5">
            {/* Type Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['Expense', 'Income', 'Maintenance', 'Fine'] as const).map(t => {
                const isSelected = financeType === t;
                return (
                  <div
                    key={t}
                    onClick={() => handleTypeChange(t)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? t === 'Income' || t === 'Maintenance'
                          ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                          : 'border-rose-600 bg-rose-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-900">{t}</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {t === 'Expense' ? 'Money paid out' : t === 'Income' ? 'General revenue' : t === 'Maintenance' ? 'Resident collections' : 'Violation penalty'}
                      </p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected 
                        ? t === 'Income' || t === 'Maintenance' ? 'border-emerald-600 bg-emerald-600' : 'border-rose-600 bg-rose-600'
                        : 'border-slate-300'
                    }`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Category Dropdown and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Accounting Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-xs font-bold text-slate-800 bg-white"
                >
                  {CATEGORY_SUGGESTIONS[financeType].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Payment Status *</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-xs font-bold text-slate-800 bg-white"
                >
                  <option value="Paid">Paid / Cleared</option>
                  <option value="Pending">Pending Clearance</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Financial Particulars */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <IndianRupee className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Section 2: Amount & Payment Details
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Financial numbers and method</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Step 2 of 3</span>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Total Transaction Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  placeholder="e.g. 15000"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-black font-mono text-slate-900 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Transaction Date *</label>
                <input
                  type="date"
                  required
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-xs font-bold text-slate-800 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Payment Mode *</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-xs font-bold text-slate-800 bg-white"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value="UPI">UPI (GPay / PhonePe / QR)</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Card">Debit / Credit Card</option>
                  <option value="Cash">Cash Voucher</option>
                  <option value="Other">Other Mode</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Counterparty & Description */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Section 3: Payee / Vendor & Reference
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Audit documentation and voucher narration</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Step 3 of 3</span>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {financeType === 'Expense' ? 'Vendor / Payee Name *' : 'Payer / Resident Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="e.g. Maharashtra State Electricity Board (MSEB) or Apex Security Agency"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-xs font-bold text-slate-800 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Reference / Cheque / UTR Number
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. UTR-98124921 or CHQ #991023"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-xs font-mono font-bold text-slate-800 bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Narration / Voucher Notes *</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed reason for this transaction, invoice number, approval minutes reference..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-xs text-slate-800 bg-white"
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
            <span>Back to Finance</span>
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
              disabled={submitting || amount <= 0}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{mode === 'edit' ? 'Update Record' : 'Save Record'}</span>
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
// 2. VIEW FINANCE VOUCHER WORKSPACE (FULL SCREEN)
// ============================================================================
interface ViewFinanceVoucherWorkspaceProps {
  record: Finance;
  onBack: () => void;
  onEdit?: (record: Finance) => void;
}

export function ViewFinanceVoucherWorkspace({
  record,
  onBack,
  onEdit
}: ViewFinanceVoucherWorkspaceProps) {
  const isIncome = record.finance_type === 'Income' || record.finance_type === 'Maintenance';

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
            title="Back to Finance"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Payment Voucher — {record.finance_id}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${
                isIncome 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {record.finance_type} Voucher
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Official society accounting entry and disbursement authorization.
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
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(record)}
              className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Edit Record
            </button>
          )}
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Voucher</span>
          </button>
        </div>
      </div>

      {/* Voucher Paper */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-8 sm:p-12 max-w-4xl mx-auto w-full space-y-8 font-sans">
        {/* Voucher Header */}
        <div className="flex justify-between items-start pb-6 border-b-2 border-slate-900">
          <div>
            <div className="flex items-center gap-2 text-indigo-700 font-black text-xl tracking-tight">
              <Building2 className="w-6 h-6" />
              <span>Joyville Sensorium Co-operative Housing Society</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">Hinjawadi Phase 1, Pune - 411057, Maharashtra</p>
            <p className="text-xs text-slate-500">Reg. No: MAH/PUN/2026/JS • Society ID: {record.society_id}</p>
          </div>
          <div className="text-right">
            <span className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
              isIncome ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {isIncome ? 'CREDIT / RECEIPT VOUCHER' : 'PAYMENT / DEBIT VOUCHER'}
            </span>
            <p className="text-xs font-mono font-black text-slate-900 mt-2">VOUCHER #{record.finance_id}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Date: {record.transaction_date ? format(new Date(record.transaction_date), 'dd MMMM yyyy') : format(new Date(), 'dd MMMM yyyy')}
            </p>
          </div>
        </div>

        {/* Voucher Particulars Grid */}
        <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 text-xs">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {isIncome ? 'Received From' : 'Paid To (Party / Vendor)'}
            </p>
            <h4 className="text-base font-black text-slate-900 mt-1">{record.party_name || 'Society Office'}</h4>
            <p className="text-slate-600 mt-0.5 font-medium">Head of Account: {record.category}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Payment Channel & Reference</p>
            <h4 className="text-base font-black text-slate-900 mt-1">{record.payment_mode}</h4>
            <p className="text-slate-600 mt-0.5 font-mono">Reference: {record.reference_number || 'N/A'}</p>
          </div>
        </div>

        {/* Amount Box */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex justify-between items-center">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 block">Total Voucher Amount</span>
            <span className="text-3xl font-black font-mono text-emerald-400">₹{Number(record.amount).toLocaleString('en-IN')}</span>
          </div>
          <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/10 text-white border border-white/20">
            Status: {record.payment_status}
          </span>
        </div>

        {/* Narration Description */}
        <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Narration / Particulars</p>
          <p className="text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">
            {record.description}
          </p>
        </div>

        {/* Signatures */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
          <div>
            <div className="w-32 h-10 border-b-2 border-slate-800 mx-auto mb-2"></div>
            <p className="font-bold text-slate-800">Prepared By</p>
            <p className="text-[10px] text-slate-400">Accountant</p>
          </div>
          <div>
            <div className="w-32 h-10 border-b-2 border-slate-800 mx-auto mb-2"></div>
            <p className="font-bold text-slate-800">Checked & Verified</p>
            <p className="text-[10px] text-slate-400">Hon. Treasurer</p>
          </div>
          <div>
            <div className="w-32 h-10 border-b-2 border-slate-800 mx-auto mb-2"></div>
            <p className="font-bold text-slate-800">Receiver's Signature</p>
            <p className="text-[10px] text-slate-400">Payee / Authorized Agent</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. FINANCE STATEMENT WORKSPACE (FULL SCREEN)
// ============================================================================
interface FinanceStatementWorkspaceProps {
  finances: Finance[];
  onBack: () => void;
}

export function FinanceStatementWorkspace({
  finances,
  onBack
}: FinanceStatementWorkspaceProps) {
  const totalIncome = finances
    .filter(f => f.finance_type === 'Income' || f.finance_type === 'Maintenance')
    .reduce((sum, f) => sum + Number(f.amount || 0), 0);

  const totalExpense = finances
    .filter(f => f.finance_type === 'Expense')
    .reduce((sum, f) => sum + Number(f.amount || 0), 0);

  const netBalance = totalIncome - totalExpense;

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-2 cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Back to Finance Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Print Financial Statement</span>
        </button>
      </div>

      {/* Statement Sheet */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-200 pb-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Financial Ledger Statement</h2>
            <p className="text-slate-500 text-xs font-medium mt-0.5">Joyville Sensorium • Official Financial Report</p>
          </div>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-xs border border-indigo-200">
            Current Term
          </span>
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
            <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">Total Income / Collection</span>
            <p className="text-2xl font-black font-mono text-emerald-700 mt-1">₹{totalIncome.toLocaleString('en-IN')}</p>
          </div>
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
            <span className="text-[10px] font-black uppercase text-rose-700 tracking-wider">Total Expenses Paid</span>
            <p className="text-2xl font-black font-mono text-rose-700 mt-1">₹{totalExpense.toLocaleString('en-IN')}</p>
          </div>
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
            <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Net Reserve Balance</span>
            <p className="text-2xl font-black font-mono text-indigo-700 mt-1">₹{netBalance.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-black text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Party / Vendor</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {finances.map((f, i) => (
                <tr key={f.finance_id || i}>
                  <td className="px-4 py-3 font-mono">{f.transaction_date}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      f.finance_type === 'Expense' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {f.finance_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">{f.category}</td>
                  <td className="px-4 py-3">{f.party_name || 'Society Member'}</td>
                  <td className={`px-4 py-3 text-right font-bold font-mono ${
                    f.finance_type === 'Expense' ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    {f.finance_type === 'Expense' ? '-' : '+'}₹{Number(f.amount).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
