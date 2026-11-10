import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Check, 
  X, 
  Download, 
  FileCheck, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  ShieldCheck, 
  IndianRupee, 
  Calendar,
  ExternalLink,
  Eye
} from 'lucide-react';
import { Resident, ResidentDocument, DocumentStatus } from '../../types';
import { toast } from 'sonner';
import { format } from 'date-fns';

// ============================================================================
// 1. UPLOAD DOCUMENT WORKSPACE (REQUIREMENT 9)
// ============================================================================
interface UploadDocumentWorkspaceProps {
  resident: Resident;
  isOwner?: boolean;
  documentDefinition?: { type: string; name: string; purpose: string } | null;
  onBack: () => void;
  onUploadSuccess: (file: File, def: { type: string; name: string; purpose: string }, depositData?: any) => Promise<void>;
}

export function UploadDocumentWorkspace({
  resident,
  isOwner = true,
  documentDefinition,
  onBack,
  onUploadSuccess
}: UploadDocumentWorkspaceProps) {
  const [selectedType, setSelectedType] = useState<string>(
    documentDefinition?.type || (isOwner ? 'sale_deed' : 'rent_agreement')
  );
  const [documentName, setDocumentName] = useState<string>(
    documentDefinition?.name || (isOwner ? 'Registered Sale Deed' : 'Registered Rent Agreement')
  );
  const [purpose, setPurpose] = useState<string>(
    documentDefinition?.purpose || 'Official property proof and ownership validation'
  );

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tenant Deposit Fields
  const [depositAmount, setDepositAmount] = useState<number>(50000);
  const [depositDate, setDepositDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [depositRef, setDepositRef] = useState<string>('');

  const ownerDefinitions = [
    { type: 'sale_deed', name: 'Registered Sale Deed', purpose: 'Legal proof of flat ownership' },
    { type: 'index_ii', name: 'Index II Document', purpose: 'Sub-registrar property registration record' },
    { type: 'possession_letter', name: 'Builder Possession Letter', purpose: 'Handover & move-in authorization' },
    { type: 'property_tax_receipt', name: 'Property Tax Receipt', purpose: 'Municipal corporation tax verification' },
    { type: 'aadhaar_card', name: 'Aadhaar Card (Owner)', purpose: 'Government identity proof' },
    { type: 'pan_card', name: 'PAN Card (Owner)', purpose: 'Financial and tax identification' },
    { type: 'passport_photo', name: 'Passport-size Photo', purpose: 'Society directory member profile' }
  ];

  const tenantDefinitions = [
    { type: 'rent_agreement', name: 'Registered Rent Agreement', purpose: 'Sub-registrar registered lease deed' },
    { type: 'police_verification', name: 'Police Verification Form', purpose: 'Local police station tenant clearance' },
    { type: 'owner_noc', name: 'Owner NOC Letter', purpose: 'Formal landlord move-in authorization' },
    { type: 'security_deposit_receipt', name: 'Security Deposit Receipt', purpose: 'Society move-in security deposit record' },
    { type: 'tenant_aadhaar', name: 'Aadhaar Card (Tenant)', purpose: 'Identity and citizenship verification' },
    { type: 'tenant_pan', name: 'PAN Card (Tenant)', purpose: 'Financial verification' },
    { type: 'tenant_photo', name: 'Passport-size Photo', purpose: 'Tenant gate pass and directory card' }
  ];

  const currentDefinitions = isOwner ? ownerDefinitions : tenantDefinitions;

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    const found = currentDefinitions.find(d => d.type === type);
    if (found) {
      setDocumentName(found.name);
      setPurpose(found.purpose);
    }
  };

  const handleFileChange = (file: File) => {
    const validMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    const validExts = ['pdf', 'jpg', 'jpeg', 'png'];

    if (!validMimes.includes(file.type) && !validExts.includes(fileExt)) {
      toast.error('Invalid file format. Please upload PDF, JPG, JPEG, or PNG files only.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds the 10 MB limit. Please choose a smaller file.');
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a file to upload.');
      return;
    }

    setUploading(true);
    try {
      const depositData = selectedType === 'security_deposit_receipt' ? {
        deposit_amount: depositAmount,
        deposit_date: depositDate,
        deposit_ref: depositRef
      } : undefined;

      await onUploadSuccess(selectedFile, {
        type: selectedType,
        name: documentName,
        purpose
      }, depositData);
    } finally {
      setUploading(false);
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
            title="Back to Resident"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-[#321F5C] tracking-tight">
                Upload Document
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${
                isOwner ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-purple-50 text-purple-800 border-purple-200'
              }`}>
                {isOwner ? 'Owner Record' : 'Tenant Verification'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              {resident.name} • Tower {resident.tower}, Flat {resident.flat} ({resident.resident_id})
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
            onClick={handleUploadSubmit}
            disabled={!selectedFile || uploading}
            className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
              isOwner 
                ? 'bg-[#6339CA] hover:bg-[#5D31C7] shadow-purple-500/25' 
                : 'bg-[#6339CA] hover:bg-[#5D31C7] shadow-purple-500/25'
            }`}
          >
            {uploading ? (
              <span>Uploading Document...</span>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload Document</span>
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleUploadSubmit} className="space-y-6">
        {/* SECTION 1: Document Type */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#321F5C] uppercase tracking-wider">
                  Section 1: Select Document Type
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Choose from required verification categories</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Step 1 of 3</span>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {currentDefinitions.map(def => {
                const isSelected = selectedType === def.type;
                return (
                  <div
                    key={def.type}
                    onClick={() => handleTypeSelect(def.type)}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between h-28 ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-[#321F5C] leading-tight">{def.name}</span>
                      <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${
                        isSelected ? 'border-purple-600 bg-purple-600' : 'border-slate-300'
                      }`}>
                        {isSelected && <div className="w-1 h-1 rounded-full bg-white" />}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-2 mt-1">{def.purpose}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION 2: Document Information */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#321F5C] uppercase tracking-wider">
                  Section 2: Document Information
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Verify metadata and notes</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Step 2 of 3</span>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Document Title *</label>
                <input
                  type="text"
                  required
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-xs font-bold text-slate-800 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Verification Purpose</label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-xs text-slate-700 bg-white"
                />
              </div>
            </div>

            {/* Special Tenant Security Deposit Section */}
            {selectedType === 'security_deposit_receipt' && (
              <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-purple-900">
                  Security Deposit Transaction Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-purple-900">Deposit Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-purple-300 bg-white text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-purple-900">Payment Date *</label>
                    <input
                      type="date"
                      required
                      value={depositDate}
                      onChange={(e) => setDepositDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-purple-300 bg-white text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-purple-900">Transaction / Cheque Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. UPI-9928123 or CHQ-481920"
                      value={depositRef}
                      onChange={(e) => setDepositRef(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-purple-300 bg-white text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: Large File Upload Area (Exact structure as prompt requirement 9) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#321F5C] uppercase tracking-wider">
                  Section 3: File Upload Area
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Clear and large upload viewport</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Step 3 of 3</span>
          </div>

          <div className="p-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              className="hidden"
            />

            {/* Large Drag & Drop Box */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full min-h-[260px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 transition-all cursor-pointer ${
                isDragging
                  ? 'border-purple-600 bg-purple-50/80 scale-[1.01]'
                  : selectedFile
                    ? 'border-emerald-400 bg-emerald-50/30'
                    : 'border-slate-300 hover:border-[#6339CA] bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              {selectedFile ? (
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                    <FileCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[#321F5C]">{selectedFile.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'Document'}
                    </p>
                  </div>
                  {filePreview && (
                    <img 
                      src={filePreview} 
                      alt="Preview" 
                      className="max-h-36 rounded-xl border border-slate-200 object-contain shadow-xs mt-2" 
                    />
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setFilePreview(null);
                    }}
                    className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold border border-rose-200 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Choose Different File</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-xs">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-[#321F5C]">Upload Document</h4>
                    <p className="text-sm font-bold text-slate-600 mt-1">Drag & Drop File Here</p>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider my-1">OR</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-6 py-2.5 bg-[#6339CA] hover:bg-[#5D31C7] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-500/25"
                  >
                    Choose File
                  </button>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    PDF, JPG, PNG • Max 10 MB
                  </p>
                </div>
              )}
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
            <span>Back to Resident</span>
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
              disabled={!selectedFile || uploading}
              className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                isOwner 
                  ? 'bg-[#6339CA] hover:bg-[#5D31C7] shadow-purple-500/25' 
                  : 'bg-[#6339CA] hover:bg-[#5D31C7] shadow-purple-500/25'
              }`}
            >
              {uploading ? (
                <span>Uploading...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Upload Document</span>
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
// 2. VIEW DOCUMENT WORKSPACE (FULL SCREEN)
// ============================================================================
interface ViewDocumentWorkspaceProps {
  document: ResidentDocument;
  resident: Resident;
  managementReview?: boolean;
  isAdminReview?: boolean;
  onBack: () => void;
  onApprove?: (doc: ResidentDocument) => Promise<void>;
  onReject?: (doc: ResidentDocument, reason: string) => Promise<void>;
  onDelete?: (doc: ResidentDocument) => Promise<void>;
}

export function ViewDocumentWorkspace({
  document: doc,
  resident,
  managementReview = false,
  isAdminReview = false,
  onBack,
  onApprove,
  onReject,
  onDelete
}: ViewDocumentWorkspaceProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified & Approved</span>
          </span>
        );
      case 'Rejected':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </span>
        );
      case 'Under Review':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Under Review</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const handleApprove = async () => {
    if (!onApprove) return;
    setActionLoading(true);
    try {
      await onApprove(doc);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!onReject) return;
    if (!rejectReason.trim()) {
      toast.error('Please specify a rejection reason.');
      return;
    }
    setActionLoading(true);
    try {
      await onReject(doc, rejectReason.trim());
      setShowRejectBox(false);
    } finally {
      setActionLoading(false);
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
            title="Back to Documents"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-[#321F5C] tracking-tight">
                {doc.document_name}
              </h1>
              {getStatusBadge(doc.status)}
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Resident: {resident.name} • Unit: Tower {resident.tower}, Flat {resident.flat} ({resident.resident_id})
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5 self-end md:self-center">
          {doc.file_url && (
            <a
              href={doc.file_url}
              download={doc.file_name || 'document.pdf'}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Download</span>
            </a>
          )}

          {(managementReview || isAdminReview) && doc.status !== 'Verified' && onApprove && (
            <button
              type="button"
              onClick={handleApprove}
              disabled={actionLoading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Approve Document</span>
            </button>
          )}

          {(managementReview || isAdminReview) && doc.status !== 'Rejected' && onReject && !showRejectBox && (
            <button
              type="button"
              onClick={() => setShowRejectBox(true)}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Reject...</span>
            </button>
          )}
        </div>
      </div>

      {/* Reject Reason Input Banner */}
      {showRejectBox && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-3 animate-in fade-in duration-150">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black uppercase tracking-wider text-rose-900">
              Provide Rejection Reason
            </h4>
            <button
              type="button"
              onClick={() => setShowRejectBox(false)}
              className="text-rose-500 hover:text-rose-700 text-xs font-bold"
            >
              Cancel
            </button>
          </div>
          <textarea
            rows={2}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Document copy is blurry or signature is missing on page 2..."
            className="w-full px-3.5 py-2 rounded-xl border border-rose-300 bg-white text-xs outline-none focus:ring-2 focus:ring-rose-200"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowRejectBox(false)}
              className="px-3.5 py-1.5 bg-white border border-rose-200 text-rose-700 text-xs font-bold rounded-lg"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={actionLoading || !rejectReason.trim()}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50"
            >
              {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      )}

      {/* Document Metadata Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          Document Details & Specifications
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">File Name</p>
            <p className="font-mono font-bold text-slate-800 mt-0.5 truncate">{doc.file_name || 'document.pdf'}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">File Size</p>
            <p className="font-bold text-slate-800 mt-0.5">
              {doc.file_size ? `${(doc.file_size / (1024 * 1024)).toFixed(2)} MB` : '1.8 MB'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Upload Date</p>
            <p className="font-bold text-slate-800 mt-0.5">
              {doc.uploaded_at ? format(new Date(doc.uploaded_at), 'dd MMM yyyy') : 'Recent'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Verification Status</p>
            <p className="font-bold mt-0.5 text-[#6339CA]">{doc.status}</p>
          </div>
        </div>

        {doc.deposit_amount && (
          <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-xs flex flex-wrap gap-6 text-purple-950">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block">Security Deposit</span>
              <span className="font-mono font-black text-sm">₹{doc.deposit_amount.toLocaleString('en-IN')}</span>
            </div>
            {doc.deposit_date && (
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block">Deposit Date</span>
                <span className="font-bold">{doc.deposit_date}</span>
              </div>
            )}
            {doc.deposit_ref && (
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block">Reference No</span>
                <span className="font-mono font-bold">{doc.deposit_ref}</span>
              </div>
            )}
          </div>
        )}

        {doc.rejection_reason && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block mb-0.5">Rejection Reason</span>
            <p className="font-medium">{doc.rejection_reason}</p>
          </div>
        )}
      </div>

      {/* Large Document Viewer Viewport */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Eye className="w-4 h-4 text-slate-500" />
            <span>Document Preview & Inspection Viewport</span>
          </h3>
          {doc.file_url && (
            <a
              href={doc.file_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1"
            >
              <span>Open in New Tab</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        <div className="p-6 flex-1 flex items-center justify-center bg-slate-100/50">
          {doc.file_url?.startsWith('data:image') || doc.mime_type?.startsWith('image') ? (
            <img 
              src={doc.file_url} 
              alt={doc.document_name}
              className="max-h-[70vh] max-w-full rounded-2xl border border-slate-200 object-contain shadow-md bg-white"
            />
          ) : doc.file_url?.startsWith('data:application/pdf') || doc.mime_type === 'application/pdf' ? (
            <iframe 
              src={doc.file_url} 
              title={doc.document_name} 
              className="w-full h-[70vh] rounded-2xl border border-slate-200 bg-white shadow-sm"
            />
          ) : (
            <div className="text-center p-10 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-lg space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto shadow-inner">
                <FileCheck className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-lg font-black text-[#321F5C]">{doc.document_name}</h4>
                <p className="text-xs text-slate-500 mt-1">{doc.purpose}</p>
                <p className="text-xs font-mono font-bold text-slate-700 mt-2 bg-slate-50 py-1.5 px-3 rounded-lg border border-slate-200 inline-block">
                  {doc.file_name || 'document_file.pdf'}
                </p>
              </div>
              {doc.file_url && (
                <div className="pt-2">
                  <a
                    href={doc.file_url}
                    download={doc.file_name || 'document.pdf'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6339CA] hover:bg-[#5D31C7] text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/25 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Original File</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
