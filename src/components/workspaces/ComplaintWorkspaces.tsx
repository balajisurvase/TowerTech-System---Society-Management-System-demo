import React, { useState } from 'react';
import { 
  ArrowLeft, 
  MessageSquare, 
  User, 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Check, 
  X, 
  Upload, 
  Trash2, 
  RefreshCw, 
  Ban,
  FileText,
  Calendar,
  Layers
} from 'lucide-react';
import { Complaint, User as UserType } from '../../types';
import { format } from 'date-fns';

// ============================================================================
// 1. ADD / REGISTER COMPLAINT WORKSPACE (FULL SCREEN)
// ============================================================================
interface AddComplaintWorkspaceProps {
  user: UserType;
  onBack: () => void;
  onSubmit: (complaintData: {
    category: string;
    description: string;
    priority?: string;
    photo_url?: string;
  }) => Promise<void>;
}

export function AddComplaintWorkspace({
  user,
  onBack,
  onSubmit
}: AddComplaintWorkspaceProps) {
  const [category, setCategory] = useState('Plumbing / Water Leakage');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [preferredTime, setPreferredTime] = useState('Morning (9 AM - 12 PM)');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    'Plumbing / Water Leakage',
    'Electrical & Power Supply',
    'Lift / Elevator Breakdown',
    'Flat Seepage & Wall Dampness',
    'Security & Gate Passes',
    'Parking & Vehicle Management',
    'Housekeeping & Waste Disposal',
    'Noise & Disturbance Complaint',
    'Garden / Clubhouse Maintenance',
    'General Society Facility'
  ];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fullDescription = title.trim() 
        ? `[${title.trim()}] ${description.trim()} (Preferred Time: ${preferredTime})`
        : `${description.trim()} (Preferred Time: ${preferredTime})`;

      await onSubmit({
        category,
        priority,
        description: fullDescription,
        photo_url: photoUrl || undefined
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
            title="Back to Complaints"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Register New Complaint
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider bg-rose-50 text-rose-800 border-rose-200">
                Service Request
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Submit your maintenance or facility issue directly to the society admin and maintenance team.
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
            disabled={submitting || !description.trim()}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <span>Submitting Request...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Submit Complaint</span>
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Issue Classification */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Section 1: Issue Classification & Priority
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Select issue category and severity</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Step 1 of 3</span>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Issue Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-xs font-bold text-slate-800 bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Priority Level *</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Low', 'Medium', 'High', 'Urgent'] as const).map(p => {
                    const isSelected = priority === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? p === 'Urgent' ? 'bg-rose-600 text-white border-rose-600 shadow-xs' :
                              p === 'High' ? 'bg-amber-500 text-white border-amber-500 shadow-xs' :
                              p === 'Medium' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' :
                              'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Submitted By</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{user.name}</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Apartment Unit</span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  Tower {user.tower || 'A'} - Flat {user.flat || '101'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Society</span>
                <span className="font-bold text-slate-800 mt-0.5 block">Green Valley Residency</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Issue Details */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Section 2: Issue Description & Inspection Timing
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Explain problem clearly to help maintenance team</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Step 2 of 3</span>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Complaint Title / Summary *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Master bathroom flush valve leakage or Kitchen power socket sparking"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-xs font-bold text-slate-800 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Detailed Problem Description *</label>
              <textarea
                rows={5}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe when the issue started, exact location in the flat, severity, and any actions taken..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-xs text-slate-800 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Preferred Technician Visit Timing</label>
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full sm:w-1/2 px-4 py-2.5 rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-xs font-medium text-slate-800 bg-white"
              >
                <option value="Morning (9 AM - 12 PM)">Morning (9:00 AM - 12:00 PM)</option>
                <option value="Afternoon (12 PM - 3 PM)">Afternoon (12:00 PM - 3:00 PM)</option>
                <option value="Evening (3 PM - 7 PM)">Evening (3:00 PM - 7:00 PM)</option>
                <option value="Anytime (Urgent Attention)">Anytime (Urgent Attention Required)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: Photo Attachment */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Section 3: Photo Attachment (Optional)
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Attach photo to speed up technician diagnosis</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Step 3 of 3</span>
          </div>

          <div className="p-6">
            {photoUrl ? (
              <div className="flex flex-col items-center p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <img 
                  src={photoUrl} 
                  alt="Attachment Preview" 
                  className="max-h-56 rounded-xl border border-slate-200 object-contain shadow-xs bg-white"
                />
                <button
                  type="button"
                  onClick={() => setPhotoUrl(null)}
                  className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold border border-rose-200 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Photo</span>
                </button>
              </div>
            ) : (
              <label className="w-full min-h-[160px] rounded-2xl border-2 border-dashed border-slate-300 hover:border-purple-500 bg-slate-50/60 hover:bg-slate-50 flex flex-col items-center justify-center p-6 cursor-pointer transition-all">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-700">Click or Drag & Drop Photo Here</span>
                <span className="text-[10px] text-slate-400 mt-1">PNG, JPG, JPEG up to 5 MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            )}
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
            <span>Back to Complaints</span>
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
              disabled={submitting || !description.trim()}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Submit Complaint</span>
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
// 2. VIEW COMPLAINT WORKSPACE (FULL SCREEN)
// ============================================================================
interface ViewComplaintWorkspaceProps {
  complaint: Complaint;
  isAdmin?: boolean;
  onBack: () => void;
  onUpdateStatus?: (complaintId: string, status: 'Pending' | 'Process' | 'Done' | 'Rejected', comment?: string) => Promise<void>;
}

export function ViewComplaintWorkspace({
  complaint,
  isAdmin = false,
  onBack,
  onUpdateStatus
}: ViewComplaintWorkspaceProps) {
  const [adminComment, setAdminComment] = useState(complaint.admin_comment || '');
  const [selectedStatus, setSelectedStatus] = useState<'Pending' | 'Process' | 'Done' | 'Rejected'>(
    (complaint.status as any) || 'Pending'
  );
  const [updating, setUpdating] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Done':
      case 'Resolved':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Resolved / Completed</span>
          </span>
        );
      case 'Process':
      case 'In Progress':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>In Progress</span>
          </span>
        );
      case 'Rejected':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review</span>
          </span>
        );
    }
  };

  const handleStatusChange = async (newStatus: 'Pending' | 'Process' | 'Done' | 'Rejected') => {
    setSelectedStatus(newStatus);
    if (!onUpdateStatus) return;
    setUpdating(true);
    try {
      await onUpdateStatus(complaint.complaint_id || complaint.id!, newStatus, adminComment);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveComment = async () => {
    if (!onUpdateStatus) return;
    setUpdating(true);
    try {
      await onUpdateStatus(complaint.complaint_id || complaint.id!, selectedStatus, adminComment);
    } finally {
      setUpdating(false);
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
            title="Back to Complaints"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Complaint #{complaint.complaint_id}
              </h1>
              {getStatusBadge(complaint.status)}
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              {complaint.category || 'General Maintenance'} • Registered by {complaint.resident_name || 'Resident'}
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
            Back to Complaints
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={handleSaveComment}
              disabled={updating}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{updating ? 'Saving...' : 'Save Remarks & Status'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Status Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Resolution Lifecycle</h4>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className={`p-3 rounded-xl border ${
            complaint.status === 'Pending' ? 'bg-amber-50 border-amber-300 text-amber-900 font-black' : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Step 1</span>
            Pending Review
          </div>
          <div className={`p-3 rounded-xl border ${
            complaint.status === 'Process' ? 'bg-blue-50 border-blue-300 text-blue-900 font-black' : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Step 2</span>
            In Progress
          </div>
          <div className={`p-3 rounded-xl border ${
            complaint.status === 'Done' ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-black' : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Step 3</span>
            Resolved / Fixed
          </div>
          <div className={`p-3 rounded-xl border ${
            complaint.status === 'Rejected' ? 'bg-rose-50 border-rose-300 text-rose-900 font-black' : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Alternative</span>
            Closed / Rejected
          </div>
        </div>
      </div>

      {/* Complaint Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Description & Photos */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Complaint Description & Particulars
            </h3>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
              {complaint.description}
            </div>

            {/* Media Image if attached */}
            {complaint.media && complaint.media.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-700">Attached Photos</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {complaint.media.map((m, idx) => (
                    <img
                      key={idx}
                      src={(m as any).url || (m as any).media_url || ''}
                      alt="Complaint attachment"
                      className="rounded-xl border border-slate-200 max-h-48 w-full object-cover shadow-2xs"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Admin Resolution Remarks */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Management & Technician Resolution Remarks
            </h3>

            {isAdmin ? (
              <div className="space-y-3">
                <textarea
                  rows={4}
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder="Enter technician visit updates, work completion notes, or resident communication..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs text-slate-800 bg-white"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveComment}
                    disabled={updating}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                  >
                    {updating ? 'Saving Remarks...' : 'Update Remarks'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-blue-950 font-medium leading-relaxed">
                {complaint.admin_comment || 'No resolution comments added by the administration team yet.'}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Resident Info & Admin Quick Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Resident & Apartment Information
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Resident:</span>
                <span className="font-bold text-slate-800">{complaint.resident_name || 'Resident'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Unit:</span>
                <span className="font-bold text-slate-800">Tower {complaint.tower}, Flat {complaint.flat_no}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Category:</span>
                <span className="font-bold text-purple-700">{complaint.category || 'General'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Logged Date:</span>
                <span className="font-bold text-slate-800">
                  {complaint.complaint_date ? format(new Date(complaint.complaint_date), 'dd MMM yyyy') : 'Recent'}
                </span>
              </div>
            </div>
          </div>

          {/* Admin Workflow Status Actions */}
          {isAdmin && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Update Status
              </h3>

              <div className="grid grid-cols-1 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleStatusChange('Process')}
                  disabled={updating}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-between border transition-all ${
                    selectedStatus === 'Process'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Assign / In Progress</span>
                  </span>
                  {selectedStatus === 'Process' && <Check className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange('Done')}
                  disabled={updating}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-between border transition-all ${
                    selectedStatus === 'Done'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark as Resolved</span>
                  </span>
                  {selectedStatus === 'Done' && <Check className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange('Rejected')}
                  disabled={updating}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-between border transition-all ${
                    selectedStatus === 'Rejected'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Ban className="w-3.5 h-3.5" />
                    <span>Reject Request</span>
                  </span>
                  {selectedStatus === 'Rejected' && <Check className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
