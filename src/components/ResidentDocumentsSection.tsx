import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Eye, 
  Trash2, 
  ShieldCheck, 
  FileCheck, 
  Plus
} from 'lucide-react';
import { Resident, ResidentDocument, DocumentStatus } from '../types';
import { OWNER_DOCUMENT_DEFINITIONS, TENANT_DOCUMENT_DEFINITIONS } from '../data';
import { societyService } from '../lib/societyService';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { UploadDocumentWorkspace, ViewDocumentWorkspace } from './workspaces/DocumentWorkspaces';

interface ResidentDocumentsSectionProps {
  resident: Resident;
  isOwner?: boolean;
  isAdminReview?: boolean;
  onRefresh?: () => void;
}

export default function ResidentDocumentsSection({
  resident,
  isOwner = true,
  isAdminReview = false,
  onRefresh
}: ResidentDocumentsSectionProps) {
  const [documents, setDocuments] = useState<ResidentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  
  // Full-screen Workspace Mode
  const [workspaceMode, setWorkspaceMode] = useState<'none' | 'upload' | 'view'>('none');
  const [activeUploadDef, setActiveUploadDef] = useState<{ type: string; name: string; purpose: string } | null>(null);
  const [activeViewDoc, setActiveViewDoc] = useState<ResidentDocument | null>(null);

  // Delete Modal (Small confirmation dialog per Rule 11)
  const [deletingDoc, setDeletingDoc] = useState<ResidentDocument | null>(null);

  const definitions = isOwner ? OWNER_DOCUMENT_DEFINITIONS : TENANT_DOCUMENT_DEFINITIONS;

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await societyService.getResidentDocuments(resident.resident_id, resident.society_id);
      setDocuments(docs);
    } catch (err) {
      console.warn('Could not fetch resident documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resident?.resident_id) {
      loadDocuments();
    }
  }, [resident?.resident_id]);

  const handleWorkspaceUpload = async (file: File, def: { type: string; name: string; purpose: string }, depositData?: any) => {
    const existingDoc = documents.find(d => d.document_type === def.type && hasRealFile(d));
    setUploadingType(def.type);
    try {
      await societyService.uploadResidentDocument({
        resident_id: resident.resident_id,
        society_id: resident.society_id || 'SOC001',
        role: isOwner ? 'owner' : 'tenant',
        document_type: def.type,
        document_name: def.name,
        purpose: def.purpose,
        file: file,
        file_name: file.name,
        existingDoc: existingDoc || null,
        deposit_amount: depositData?.deposit_amount,
        deposit_date: depositData?.deposit_date,
        deposit_ref: depositData?.deposit_ref
      });

      toast.success(`${def.name} uploaded successfully!`);
      setWorkspaceMode('none');
      setActiveUploadDef(null);
      await loadDocuments();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('[ResidentDocuments] Upload error:', err);
      toast.error('Upload failed: ' + (err?.message || 'Unexpected error'));
    } finally {
      setUploadingType(null);
    }
  };

  const handleAdminVerify = async (doc: ResidentDocument) => {
    try {
      await societyService.updateResidentDocumentStatus(doc.id, 'Verified', undefined, 'Society Secretary', resident.society_id);
      toast.success(`"${doc.document_name}" marked as Verified`);
      setActiveViewDoc(prev => prev ? { ...prev, status: 'Verified' } : null);
      await loadDocuments();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error('Failed to verify: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleAdminRejectDoc = async (doc: ResidentDocument, reason: string) => {
    try {
      await societyService.updateResidentDocumentStatus(
        doc.id,
        'Rejected',
        reason,
        'Society Secretary',
        resident.society_id
      );
      toast.success(`"${doc.document_name}" marked as Rejected`);
      setActiveViewDoc(prev => prev ? { ...prev, status: 'Rejected', rejection_reason: reason } : null);
      await loadDocuments();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error('Failed to reject: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleDelete = (doc: ResidentDocument) => {
    setDeletingDoc(doc);
  };

  const confirmDeleteDocument = async () => {
    if (!deletingDoc) return;
    try {
      await societyService.deleteResidentDocument(
        deletingDoc.id, 
        resident.resident_id, 
        resident.society_id, 
        deletingDoc.document_type,
        deletingDoc.file_path
      );
      toast.success(`"${deletingDoc.document_name}" deleted.`);
      setDeletingDoc(null);
      if (activeViewDoc && activeViewDoc.id === deletingDoc.id) {
        setActiveViewDoc(null);
        setWorkspaceMode('none');
      }
      await loadDocuments();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error('Failed to delete document: ' + (err?.message || 'Error'));
    }
  };

  const getStatusBadge = (status: DocumentStatus, reason?: string) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Verified
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Under Review
          </span>
        );
      case 'Rejected':
        return (
          <span 
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 cursor-help"
            title={reason ? `Rejection reason: ${reason}` : 'Document rejected by society'}
          >
            <XCircle className="w-3 h-3 text-rose-600" />
            Rejected
          </span>
        );
      case 'Uploaded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#6339CA]/10 text-[#6339CA] border border-blue-200">
            <FileCheck className="w-3 h-3 text-[#6339CA]" />
            Uploaded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
            <AlertCircle className="w-3 h-3 text-slate-400" />
            Not Uploaded
          </span>
        );
    }
  };

  const hasRealFile = (doc?: ResidentDocument | null): boolean => {
    if (!doc) return false;
    return Boolean(doc.file_path && doc.status && doc.status !== 'Not Uploaded');
  };

  const verifiedCount = documents.filter(d => hasRealFile(d) && d.status === 'Verified').length;

  // 1. FULL-SCREEN WORKSPACE: UPLOAD DOCUMENT (Requirement 9)
  if (workspaceMode === 'upload') {
    return (
      <UploadDocumentWorkspace
        resident={resident}
        isOwner={isOwner}
        documentDefinition={activeUploadDef}
        onBack={() => {
          setWorkspaceMode('none');
          setActiveUploadDef(null);
        }}
        onUploadSuccess={handleWorkspaceUpload}
      />
    );
  }

  // 2. FULL-SCREEN WORKSPACE: VIEW DOCUMENT (Requirement 1 & 15)
  if (workspaceMode === 'view' && activeViewDoc) {
    return (
      <ViewDocumentWorkspace
        document={activeViewDoc}
        resident={resident}
        isAdminReview={isAdminReview}
        onBack={() => {
          setWorkspaceMode('none');
          setActiveViewDoc(null);
        }}
        onApprove={isAdminReview ? handleAdminVerify : undefined}
        onReject={isAdminReview ? handleAdminRejectDoc : undefined}
        onDelete={async (doc) => {
          setDeletingDoc(doc);
        }}
      />
    );
  }

  return (
    <div className={`rounded-2xl shadow-sm border overflow-hidden font-sans ${
      isOwner ? 'bg-[#f0f6ff]/40 border-blue-200/80' : 'bg-[#faf5ff]/40 border-purple-200/80'
    }`}>
      {/* Section Header */}
      <div className={`p-5 md:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isOwner ? 'bg-[#6339CA]/10 border-blue-100' : 'bg-purple-50/70 border-purple-100'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shadow-md ${
            isOwner ? 'bg-[#6339CA] shadow-[#6339CA]/20' : 'bg-purple-600 shadow-purple-500/20'
          }`}>
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-[#321F5C] tracking-tight">
                {isOwner ? 'Owner Documents' : 'Tenant Documents'}
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                isOwner ? 'bg-[#6339CA]/10 text-[#6339CA] border-blue-300' : 'bg-purple-100 text-purple-800 border-purple-300'
              }`}>
                {isOwner ? 'Ownership Records' : 'Tenancy Records'}
              </span>
            </div>
            <p className="text-slate-600 text-xs font-semibold mt-0.5">
              {isOwner 
                ? 'Upload and manage property ownership, possession, and identification records.'
                : 'Upload tenancy agreement, police verification, identity proof, and security deposit records.'
              }
            </p>
          </div>
        </div>

        {/* Action Controls & Verification Progress Counter */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {!isAdminReview && (
            <button
              type="button"
              onClick={() => {
                setActiveUploadDef(null);
                setWorkspaceMode('upload');
              }}
              className={`px-4 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
                isOwner 
                  ? 'bg-[#6339CA] hover:bg-[#5D31C7] shadow-[#6339CA]/25' 
                  : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/25'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          )}

          <div className="flex items-center gap-3 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Documentation Status</p>
              <p className="text-xs font-black text-slate-800">
                {verifiedCount} of {definitions.length} Verified
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Document List / Cards */}
      <div className="p-5 md:p-6 grid grid-cols-1 gap-4">
        {definitions.map((def, idx) => {
          const uploadedDoc = documents.find(d => d.document_type === def.type);
          const isUploaded = hasRealFile(uploadedDoc);
          const status: DocumentStatus = isUploaded && uploadedDoc ? uploadedDoc.status : 'Not Uploaded';

          return (
            <div 
              key={def.type} 
              className={`rounded-2xl p-4.5 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs ${
                isUploaded
                  ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  : isOwner
                    ? 'bg-white border-blue-100 hover:border-blue-200'
                    : 'bg-white border-purple-100 hover:border-purple-200'
              }`}
            >
              {/* Document Info */}
              <div className="flex items-start gap-3.5 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-xs mt-0.5 border ${
                  status === 'Verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  status === 'Under Review' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  isOwner ? 'bg-[#6339CA]/10 text-[#6339CA] border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'
                }`}>
                  {idx + 1}
                </div>

                <div className="min-w-0 space-y-1">
                  <h4 className="text-sm font-bold text-[#321F5C] leading-snug">
                    {def.name}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {def.purpose}
                  </p>

                  {/* Status Indicator */}
                  <div className="pt-1 flex items-center gap-2">
                    {getStatusBadge(status, uploadedDoc?.rejection_reason)}
                  </div>

                  {/* Real Upload Details (shown ONLY when a real file exists) */}
                  {isUploaded && uploadedDoc && (
                    <div className="flex flex-wrap items-center gap-2.5 pt-1.5 text-[11px] text-slate-500">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[10.5px] truncate max-w-[240px] border border-slate-200">
                        {uploadedDoc.file_name}
                      </span>
                      {uploadedDoc.file_size ? (
                        <span>{(uploadedDoc.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                      ) : null}
                      {uploadedDoc.uploaded_at ? (
                        <span>• Uploaded: {format(new Date(uploadedDoc.uploaded_at), 'dd MMM yyyy')}</span>
                      ) : null}
                      {uploadedDoc.deposit_amount ? (
                        <span className="font-bold text-[#6339CA] bg-[#6339CA]/10 px-2 py-0.5 rounded text-[10px] border border-[#6339CA]/20">
                          Deposit: ₹{uploadedDoc.deposit_amount.toLocaleString('en-IN')} {uploadedDoc.deposit_ref ? `(${uploadedDoc.deposit_ref})` : ''}
                        </span>
                      ) : null}
                      {uploadedDoc.rejection_reason && status === 'Rejected' ? (
                        <span className="text-rose-600 font-bold text-[10.5px]">
                          Note: {uploadedDoc.rejection_reason}
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2 self-start md:self-center shrink-0 pt-2 md:pt-0">
                {/* NOT UPLOADED STATE -> [ Upload Document ] Button opens full workspace */}
                {!isUploaded ? (
                  isAdminReview ? (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                        Awaiting Upload
                      </span>
                      <p className="text-[9px] text-slate-400 font-medium italic">Resident has not submitted this yet</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveUploadDef(def);
                        setWorkspaceMode('upload');
                      }}
                      className={`px-4 py-2 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                        isOwner 
                          ? 'bg-[#6339CA] hover:bg-[#5D31C7] shadow-[#6339CA]/20' 
                          : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Document</span>
                    </button>
                  )
                ) : (
                  /* UPLOADED STATE -> [ View ] opens full workspace, [ Replace ], [ Delete ] */
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveViewDoc(uploadedDoc!);
                        setWorkspaceMode('view');
                      }}
                      className="px-3.5 py-1.5 bg-[#321F5C] hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                      title="View Full Document"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>

                    {!isAdminReview && (
                      <button
                        onClick={() => {
                          setActiveUploadDef(def);
                          setWorkspaceMode('upload');
                        }}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors border border-slate-200 cursor-pointer"
                        title="Upload New Version"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span className="hidden sm:inline">Replace</span>
                      </button>
                    )}

                    {!isAdminReview && (
                      <button
                        onClick={() => handleDelete(uploadedDoc!)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors border border-rose-200 cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* DOCUMENT DELETE CONFIRMATION MODAL (ALLOWED MINOR CONFIRMATION DIALOG - RULE 11 & 15) */}
      {deletingDoc && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[170] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-2xs">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-[#321F5C]">Delete Document?</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-800 font-bold">"{deletingDoc.document_name}"</strong>? This will remove the uploaded file and reset the document status to <span className="font-bold text-slate-700">NOT UPLOADED</span>.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingDoc(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteDocument}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-md shadow-rose-500/25 transition-all cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
