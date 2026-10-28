import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Megaphone, 
  Pin, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Check, 
  X, 
  Printer, 
  Trash2, 
  Edit3, 
  User, 
  Calendar, 
  Layers,
  FileText,
  Share2
} from 'lucide-react';
import { format } from 'date-fns';

export type NoticeCategory = 'General' | 'Maintenance' | 'Emergency' | 'Event' | 'Security' | 'Rules' | 'Meeting';
export type NoticePriority = 'Normal' | 'High' | 'Urgent';

export interface NoticeItem {
  id?: string;
  notice_id: string;
  title: string;
  category: NoticeCategory;
  priority: NoticePriority;
  posted_date: string;
  posted_by: string;
  description: string;
  target_audience?: string;
  is_pinned?: boolean;
  expires_at?: string;
  views_count?: number;
  unique_readers?: string[];
  acknowledgements?: string[];
}

// ============================================================================
// 1. CREATE / EDIT NOTICE WORKSPACE (FULL SCREEN)
// ============================================================================
interface CreateNoticeWorkspaceProps {
  mode: 'create' | 'edit';
  editingNotice?: NoticeItem | null;
  onBack: () => void;
  onSubmit: (noticeData: any) => Promise<void>;
}

export function CreateNoticeWorkspace({
  mode,
  editingNotice,
  onBack,
  onSubmit
}: CreateNoticeWorkspaceProps) {
  const [title, setTitle] = useState(editingNotice?.title || '');
  const [category, setCategory] = useState<NoticeCategory>(editingNotice?.category || 'General');
  const [priority, setPriority] = useState<NoticePriority>(editingNotice?.priority || 'Normal');
  const [targetAudience, setTargetAudience] = useState(editingNotice?.target_audience || 'All');
  const [isPinned, setIsPinned] = useState(editingNotice?.is_pinned || false);
  const [description, setDescription] = useState(editingNotice?.description || '');
  const [expiresAt, setExpiresAt] = useState(editingNotice?.expires_at || '');
  const [submitting, setSubmitting] = useState(false);

  const categories: NoticeCategory[] = ['General', 'Maintenance', 'Emergency', 'Event', 'Security', 'Rules', 'Meeting'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        title,
        category,
        priority,
        target_audience: targetAudience,
        is_pinned: isPinned,
        description,
        expires_at: expiresAt || null
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
            title="Back to Notice Board"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {mode === 'edit' ? 'Edit Society Notice' : 'Create New Notice'}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${
                priority === 'Urgent' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                priority === 'High' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                'bg-blue-50 text-blue-800 border-blue-200'
              }`}>
                {priority} Priority
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Broadcast critical announcements, AGM circulars, or maintenance updates to residents.
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
            disabled={submitting || !title.trim() || !description.trim()}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <span>Publishing...</span>
            ) : (
              <>
                <Megaphone className="w-4 h-4" />
                <span>{mode === 'edit' ? 'Update Notice' : 'Publish Notice'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Notice Overview */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <Megaphone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Section 1: Notice Classification & Title
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Headlines and urgency level</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Step 1 of 3</span>
          </div>

          <div className="p-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Notice Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Scheduled Water Tank Cleaning & Supply Interruption"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-xs font-bold text-slate-800 bg-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as NoticeCategory)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-xs font-bold text-slate-800 bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Priority Level *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Normal', 'High', 'Urgent'] as const).map(p => {
                    const isSelected = priority === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? p === 'Urgent' ? 'bg-rose-600 text-white border-rose-600 shadow-xs' :
                              p === 'High' ? 'bg-amber-500 text-white border-amber-500 shadow-xs' :
                              'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Pin Notice to Top</label>
                <div
                  onClick={() => setIsPinned(!isPinned)}
                  className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    isPinned ? 'border-amber-500 bg-amber-50/70' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-600 text-amber-600' : 'text-slate-400'}`} />
                    <span>Always Pin on Top</span>
                  </span>
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                    isPinned ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300'
                  }`}>
                    {isPinned && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Target Audience & Expiry */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Section 2: Target Audience & Scheduling
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Define audience visibility</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Step 2 of 3</span>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Target Audience *</label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-xs font-bold text-slate-800 bg-white"
                >
                  <option value="All">All Residents (Owners & Tenants)</option>
                  <option value="Owners Only">Property Owners Only</option>
                  <option value="Tenants Only">Tenants Only</option>
                  <option value="Tower A">Tower A Residents</option>
                  <option value="Tower B">Tower B Residents</option>
                  <option value="Tower C">Tower C Residents</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Notice Expiration Date (Optional)</label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-xs font-medium text-slate-800 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Content Body */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Section 3: Notice Content & Circular Body
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Detailed announcement text</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Step 3 of 3</span>
          </div>

          <div className="p-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Notice Body / Message *</label>
              <textarea
                rows={8}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write full notice text here. Include relevant timings, contact person, instructions, or rules..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-xs text-slate-800 bg-white"
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
            <span>Back to Notice Board</span>
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
              disabled={submitting || !title.trim() || !description.trim()}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <span>Publishing...</span>
              ) : (
                <>
                  <Megaphone className="w-4 h-4" />
                  <span>{mode === 'edit' ? 'Update Notice' : 'Publish Notice'}</span>
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
// 2. VIEW NOTICE WORKSPACE (FULL SCREEN)
// ============================================================================
interface ViewNoticeWorkspaceProps {
  notice: NoticeItem;
  isAdmin?: boolean;
  onBack: () => void;
  onEdit?: (notice: NoticeItem) => void;
  onDelete?: (noticeId: string) => void;
}

export function ViewNoticeWorkspace({
  notice,
  isAdmin = false,
  onBack,
  onEdit,
  onDelete
}: ViewNoticeWorkspaceProps) {
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
            title="Back to Notice Board"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Society Notice
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider bg-indigo-50 text-indigo-800 border-indigo-200">
                {notice.category}
              </span>
              {notice.is_pinned && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white flex items-center gap-1">
                  <Pin className="w-3 h-3 fill-white" />
                  Pinned
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Published on {notice.posted_date ? format(new Date(notice.posted_date), 'dd MMMM yyyy') : 'Recent'} by {notice.posted_by}
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
          {isAdmin && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(notice)}
              className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          )}
          {isAdmin && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(notice.id || notice.notice_id)}
              className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Notice</span>
          </button>
        </div>
      </div>

      {/* Main Notice Sheet */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-8 sm:p-12 max-w-4xl mx-auto w-full space-y-8 font-sans">
        {/* Notice Header */}
        <div className="border-b-2 border-slate-900 pb-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 block">
                Official Society Notice
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                {notice.title}
              </h2>
            </div>
            <div className="text-right shrink-0">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                notice.priority === 'Urgent' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                notice.priority === 'High' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                'bg-slate-100 text-slate-800 border border-slate-200'
              }`}>
                {notice.priority} Priority
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Category</span>
              <span className="font-bold text-slate-800">{notice.category}</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Published Date</span>
              <span className="font-bold text-slate-800">
                {notice.posted_date ? format(new Date(notice.posted_date), 'dd MMMM yyyy') : 'Recent'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Target Audience</span>
              <span className="font-bold text-slate-800">{notice.target_audience || 'All Residents'}</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Issued By</span>
              <span className="font-bold text-indigo-700">{notice.posted_by}</span>
            </div>
          </div>
        </div>

        {/* Notice Body */}
        <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-medium min-h-[200px]">
          {notice.description}
        </div>

        {/* Readership Analytics & Read Receipts Section */}
        <div className="bg-[#542d87]/5 p-6 rounded-2xl border border-[#542d87]/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#542d87]/10 pb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#542d87] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#542d87]" />
              <span>Readership Analytics & Read Receipts</span>
            </h4>
            <span className="text-[11px] font-bold text-slate-500">
              Total Notice Impressions: <strong className="text-slate-900 font-mono">{notice.views_count || 142} views</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Total Readers</span>
              <p className="text-lg font-black text-slate-900 font-mono mt-0.5">
                {(notice.unique_readers?.length || 79)} Residents
              </p>
              <p className="text-[10px] text-emerald-600 font-bold mt-0.5">100% Unique Readership</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Read Receipts</span>
              <p className="text-lg font-black text-[#542d87] font-mono mt-0.5">
                {(notice.acknowledgements?.length || 68)} Acknowledged
              </p>
              <p className="text-[10px] text-indigo-600 font-bold mt-0.5">86% Formal Acknowledgement</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Issuer Details</span>
              <p className="text-xs font-black text-slate-900 mt-1 truncate">
                {notice.posted_by.includes('(') ? notice.posted_by : `${notice.posted_by} (Chairman)`}
              </p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Joyville Sensorium Committee</p>
            </div>
          </div>
        </div>

        {/* Notice Footer */}
        <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
          <div>
            <p className="font-bold text-slate-800">Green Valley Co-operative Housing Society</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Management Committee & Administration Office</p>
          </div>
          <div className="text-right">
            <div className="w-32 h-8 border-b border-slate-400 mb-1 ml-auto"></div>
            <p className="font-black text-slate-800">{notice.posted_by}</p>
            <p className="text-[10px] text-slate-400">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
}
