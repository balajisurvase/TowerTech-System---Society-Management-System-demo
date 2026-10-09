import React, { useState, useEffect, type FormEvent } from 'react';
import { 
  Bell, 
  MessageSquare, 
  Search, 
  Plus, 
  Pin, 
  PinOff, 
  Trash2, 
  Edit3, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Users, 
  Filter, 
  Paperclip, 
  ExternalLink, 
  X, 
  Check, 
  Sparkles,
  Megaphone,
  ShieldAlert,
  Wrench,
  PartyPopper,
  Info,
  Layers,
  FileText,
  Building,
  RefreshCw,
  Printer
} from 'lucide-react';
import { Notice, NoticeCategory, NoticePriority, NoticeStatus, User, Resident, Role } from '../types';
import { societyService } from '../lib/societyService';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CreateNoticeWorkspace, ViewNoticeWorkspace, NoticeItem } from './workspaces/NoticeWorkspaces';

interface NoticeBoardProps {
  user: User | Resident;
  onSwitchTab?: (tab: string) => void;
  onRefresh?: () => void;
}

const CATEGORIES: NoticeCategory[] = ['General', 'Maintenance', 'Emergency', 'Event', 'Meeting', 'Rules', 'Security', 'Financial'];
const PRIORITIES: NoticePriority[] = ['Urgent', 'Important', 'Normal', 'Low'];
const AUDIENCES = ['All Residents', 'Tower A', 'Tower B', 'Tower C', 'Tower D', 'Owners Only', 'Tenants Only'];

export default function NoticeBoard({ user, onSwitchTab, onRefresh }: NoticeBoardProps) {
  const isAdmin = user.role === 'admin' || Boolean('admin_id' in user && user.admin_id);
  const residentId = ('resident_id' in user && user.resident_id) || ('id' in user && user.id) || '';

  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedAudience, setSelectedAudience] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [viewingNotice, setViewingNotice] = useState<Notice | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: 'General' as NoticeCategory,
    priority: 'Normal' as NoticePriority,
    target_audience: 'All Residents',
    expiry_date: '',
    status: 'Active' as NoticeStatus,
    is_pinned: false,
    description: '',
    attachment_url: '',
    attachment_name: ''
  });

  const loadNotices = async () => {
    setLoading(true);
    try {
      const data = await societyService.getNotices(user.society_id);
      setNotices(data);
    } catch {
      toast.error('Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, [user.society_id]);

  const handleOpenCreate = () => {
    setEditingNotice(null);
    setFormData({
      title: '',
      category: 'General',
      priority: 'Normal',
      target_audience: 'All Residents',
      expiry_date: '',
      status: 'Active',
      is_pinned: false,
      description: '',
      attachment_url: '',
      attachment_name: ''
    });
    setShowCreateModal(true);
  };

  const handleOpenEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      category: (notice.category as NoticeCategory) || 'General',
      priority: (notice.priority as NoticePriority) || 'Normal',
      target_audience: notice.target_audience || 'All Residents',
      expiry_date: notice.expiry_date || '',
      status: (notice.status as NoticeStatus) || 'Active',
      is_pinned: !!notice.is_pinned,
      description: notice.description || '',
      attachment_url: notice.attachment_url || '',
      attachment_name: notice.attachment_name || ''
    });
    setShowCreateModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      if (editingNotice) {
        await societyService.updateNotice(editingNotice.notice_id, {
          ...formData,
          society_id: user.society_id || 'GV2026'
        });
        toast.success('Notice updated successfully!');
      } else {
        await societyService.createNotice({
          ...formData,
          posted_by: user.name || 'Society Admin',
          society_id: user.society_id || 'GV2026'
        });
        toast.success('Notice published successfully!');
      }
      setShowCreateModal(false);
      setEditingNotice(null);
      await loadNotices();
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (noticeId: string) => {
    if (!globalThis.confirm?.('Are you sure you want to delete this notice?')) return;
    try {
      await societyService.deleteNotice(noticeId, user.society_id);
      toast.success('Notice deleted');
      await loadNotices();
      if (onRefresh) onRefresh();
    } catch {
      toast.error('Failed to delete notice');
    }
  };

  const handleTogglePin = async (notice: Notice) => {
    try {
      await societyService.togglePinNotice(notice.notice_id, !notice.is_pinned, user.society_id);
      toast.success(notice.is_pinned ? 'Notice unpinned' : 'Notice pinned to top');
      await loadNotices();
    } catch {
      toast.error('Failed to update pin status');
    }
  };

  const handleAcknowledge = async (noticeId: string) => {
    if (!residentId) return;
    try {
      await societyService.acknowledgeNotice(noticeId, residentId, user.society_id);
      toast.success('Notice acknowledged');
      await loadNotices();
    } catch {
      toast.error('Failed to acknowledge');
    }
  };

  // Category Icon & Colors
  const getCategoryMeta = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'emergency':
        return { icon: ShieldAlert, bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' };
      case 'maintenance':
        return { icon: Wrench, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' };
      case 'event':
        return { icon: PartyPopper, bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' };
      case 'meeting':
        return { icon: Users, bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' };
      case 'security':
        return { icon: ShieldAlert, bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200' };
      case 'financial':
        return { icon: FileText, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' };
      default:
        return { icon: Info, bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p.toLowerCase()) {
      case 'urgent':
        return 'bg-rose-500 text-white shadow-rose-200';
      case 'important':
        return 'bg-amber-500 text-white shadow-amber-200';
      case 'normal':
        return 'bg-indigo-600 text-white shadow-indigo-200';
      default:
        return 'bg-slate-600 text-white shadow-slate-200';
    }
  };

  // Filter Notices
  const filteredNotices = notices.filter(n => {
    const matchesSearch = 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.notice_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.posted_by.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || n.category === selectedCategory;
    const matchesPriority = selectedPriority === 'All' || n.priority === selectedPriority;
    const matchesAudience = selectedAudience === 'All' || n.target_audience === selectedAudience || n.target_audience === 'All Residents';
    
    // Non-admin can only see active notices
    const matchesStatus = isAdmin ? true : (n.status === 'Active');

    return matchesSearch && matchesCategory && matchesPriority && matchesAudience && matchesStatus;
  }).sort((a, b) => {
    // Pinned notices first
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    // Then newest first
    return new Date(b.posted_date || b.created_at || 0).getTime() - new Date(a.posted_date || a.created_at || 0).getTime();
  });

  const totalCount = notices.length;
  const activeCount = notices.filter(n => n.status === 'Active').length;
  const urgentCount = notices.filter(n => n.priority === 'Urgent' || n.priority === 'Important').length;
  const pinnedCount = notices.filter(n => n.is_pinned).length;

  if (showCreateModal || editingNotice) {
    return (
      <CreateNoticeWorkspace
        mode={editingNotice ? 'edit' : 'create'}
        editingNotice={editingNotice ? {
          notice_id: editingNotice.notice_id,
          title: editingNotice.title,
          category: editingNotice.category as any,
          priority: editingNotice.priority as any,
          posted_date: editingNotice.posted_date || '',
          posted_by: editingNotice.posted_by || 'Admin',
          description: editingNotice.description || '',
          target_audience: editingNotice.target_audience,
          is_pinned: editingNotice.is_pinned,
          expires_at: editingNotice.expiry_date
        } : null}
        onBack={() => {
          setShowCreateModal(false);
          setEditingNotice(null);
        }}
        onSubmit={async (nData) => {
          try {
            setSubmitting(true);
            if (editingNotice) {
              await societyService.updateNotice(editingNotice.notice_id, {
                title: nData.title,
                category: nData.category,
                priority: nData.priority,
                target_audience: nData.target_audience,
                expiry_date: nData.expires_at || null,
                is_pinned: Boolean(nData.is_pinned),
                description: nData.description,
                society_id: user.society_id
              });
              toast.success('Notice updated successfully!');
            } else {
              await societyService.createNotice({
                title: nData.title,
                category: nData.category,
                priority: nData.priority,
                target_audience: nData.target_audience,
                expiry_date: nData.expires_at || null,
                status: 'Active',
                is_pinned: Boolean(nData.is_pinned),
                description: nData.description,
                posted_by: user.name || 'Society Admin',
                society_id: user.society_id || 'GV2026'
              });
              toast.success('Notice published successfully!');
            }
            setShowCreateModal(false);
            setEditingNotice(null);
            await loadNotices();
            if (onRefresh) onRefresh();
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Operation failed';
            toast.error(msg);
          } finally {
            setSubmitting(false);
          }
        }}
      />
    );
  }

  if (viewingNotice) {
    return (
      <ViewNoticeWorkspace
        notice={{
          notice_id: viewingNotice.notice_id,
          title: viewingNotice.title,
          category: viewingNotice.category as any,
          priority: viewingNotice.priority as any,
          posted_date: viewingNotice.posted_date || '',
          posted_by: viewingNotice.posted_by || 'Admin',
          description: viewingNotice.description || '',
          target_audience: viewingNotice.target_audience,
          is_pinned: viewingNotice.is_pinned,
          expires_at: viewingNotice.expiry_date
        }}
        isAdmin={isAdmin}
        onBack={() => setViewingNotice(null)}
        onEdit={() => {
          const currentViewing = viewingNotice;
          setViewingNotice(null);
          setEditingNotice(currentViewing);
        }}
        onDelete={(id) => {
          setViewingNotice(null);
          handleDelete(id);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Top Header Switcher: [ Notices ] [ Communication ] */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 w-fit">
          <button
            id="tab-notices"
            className="px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider bg-indigo-600 text-white shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all"
          >
            <Megaphone className="w-4 h-4" />
            Notices
          </button>
          <button
            id="tab-communication"
            onClick={() => onSwitchTab && onSwitchTab('communication')}
            className="px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider text-slate-600 hover:text-slate-900 hover:bg-white/80 flex items-center gap-2 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            Communication
          </button>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCreate}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Create Notice
            </button>
          </div>
        )}
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Notices</p>
            <h4 className="text-2xl font-black text-slate-900 mt-0.5">{totalCount}</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Board</p>
            <h4 className="text-2xl font-black text-slate-900 mt-0.5">{activeCount}</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">High Priority</p>
            <h4 className="text-2xl font-black text-slate-900 mt-0.5">{urgentCount}</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
            <Pin className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pinned Alerts</p>
            <h4 className="text-2xl font-black text-slate-900 mt-0.5">{pinnedCount}</h4>
          </div>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notice title, description, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs text-slate-800 transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 font-bold text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Priority */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 font-bold text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="All">All Priorities</option>
            {PRIORITIES.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/* Audience */}
          <select
            value={selectedAudience}
            onChange={(e) => setSelectedAudience(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 font-bold text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="All">All Audiences</option>
            {AUDIENCES.map(aud => (
              <option key={aud} value={aud}>{aud}</option>
            ))}
          </select>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 ml-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="Grid View"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="List View"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Notices List / Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-100 shadow-sm">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading notices...</p>
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-800">No notices found</h3>
          <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto mt-1">
            {searchQuery || selectedCategory !== 'All' || selectedPriority !== 'All'
              ? 'Try adjusting your filters or search keywords.'
              : 'There are currently no active announcements published on the society noticeboard.'}
          </p>
          {isAdmin && (
            <button
              onClick={handleOpenCreate}
              className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
            >
              Create First Notice
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotices.map((notice) => {
            const meta = getCategoryMeta(notice.category);
            const CategoryIcon = meta.icon;
            const isAcknowledged = residentId ? notice.acknowledgements?.includes(residentId) : false;

            return (
              <div
                key={notice.notice_id}
                className={`bg-white rounded-3xl border transition-all duration-300 hover:shadow-xl flex flex-col justify-between overflow-hidden relative group ${
                  notice.is_pinned ? 'border-amber-200 ring-2 ring-amber-100' : 'border-slate-200/80 hover:border-indigo-200'
                }`}
              >
                {/* Pinned Accent Ribbon */}
                {notice.is_pinned && (
                  <div className="bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Pin className="w-3 h-3 fill-white" />
                      Pinned Announcement
                    </span>
                    <span className="opacity-80">Official Priority</span>
                  </div>
                )}

                <div className="p-6">
                  {/* Card Header Tags */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${meta.bg} ${meta.text} border ${meta.border}`}>
                      <CategoryIcon className="w-3 h-3" />
                      {notice.category}
                    </span>

                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm ${getPriorityBadge(notice.priority)}`}>
                      {notice.priority}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 
                    onClick={() => setViewingNotice(notice)}
                    className="text-base font-black text-slate-900 line-clamp-2 leading-snug cursor-pointer hover:text-indigo-600 transition-colors mb-2"
                  >
                    {notice.title}
                  </h3>

                  {/* Body preview */}
                  <p className="text-xs text-slate-500 font-medium line-clamp-3 leading-relaxed mb-4">
                    {notice.description}
                  </p>

                  {/* Metadata pill list */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Posted Date:
                      </span>
                      <span className="font-bold text-slate-700">
                        {notice.posted_date ? format(new Date(notice.posted_date), 'dd MMM yyyy') : 'Recent'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                        <Building className="w-3 h-3 text-slate-400" />
                        Audience:
                      </span>
                      <span className="font-bold text-indigo-600">
                        {notice.target_audience || 'All Residents'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                        <Users className="w-3 h-3 text-slate-400" />
                        Posted By:
                      </span>
                      <span className="font-bold text-slate-700">
                        {notice.posted_by}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setViewingNotice(notice)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Read Details
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Acknowledge button for residents */}
                    {!isAdmin && (
                      <button
                        onClick={() => handleAcknowledge(notice.notice_id)}
                        disabled={isAcknowledged}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all ${
                          isAcknowledged 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        {isAcknowledged ? 'Acknowledged' : 'Acknowledge'}
                      </button>
                    )}

                    {/* Admin actions */}
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleTogglePin(notice)}
                          title={notice.is_pinned ? 'Unpin' : 'Pin to top'}
                          className={`p-1.5 rounded-lg border text-slate-600 hover:text-slate-900 transition-all ${
                            notice.is_pinned ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(notice)}
                          title="Edit Notice"
                          className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(notice.notice_id)}
                          title="Delete Notice"
                          className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Title & Details</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Target Audience</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredNotices.map((notice) => {
                  const meta = getCategoryMeta(notice.category);
                  const isAcknowledged = residentId ? notice.acknowledgements?.includes(residentId) : false;

                  return (
                    <tr key={notice.notice_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 max-w-md">
                        <div className="flex items-start gap-2.5">
                          {notice.is_pinned && (
                            <Pin className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p 
                              onClick={() => setViewingNotice(notice)}
                              className="font-black text-slate-900 text-xs hover:text-indigo-600 cursor-pointer transition-colors"
                            >
                              {notice.title}
                            </p>
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                              {notice.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${meta.bg} ${meta.text}`}>
                          {notice.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${getPriorityBadge(notice.priority)}`}>
                          {notice.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-700">
                        {notice.target_audience || 'All Residents'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-500">
                        {notice.posted_date ? format(new Date(notice.posted_date), 'dd MMM yyyy') : 'Recent'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingNotice(notice)}
                            className="p-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg transition-all"
                            title="View Notice"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {!isAdmin && (
                            <button
                              onClick={() => handleAcknowledge(notice.notice_id)}
                              disabled={isAcknowledged}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                isAcknowledged ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-900 text-white hover:bg-slate-800'
                              }`}
                            >
                              {isAcknowledged ? '✓' : 'Ack'}
                            </button>
                          )}
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleTogglePin(notice)}
                                className={`p-1.5 rounded-lg transition-all ${
                                  notice.is_pinned ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                                title="Pin"
                              >
                                <Pin className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(notice)}
                                className="p-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg transition-all"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(notice.notice_id)}
                                className="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-lg transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT NOTICE MODAL (ADMIN ONLY) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">
                    {editingNotice ? 'Edit Society Notice' : 'Create New Notice'}
                  </h3>
                  <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mt-0.5">
                    Broadcast to society residents
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notice Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled Water Tank Cleaning & Supply Cut"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as NoticeCategory })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs text-slate-800"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as NoticePriority })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs text-slate-800"
                  >
                    {PRIORITIES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Audience</label>
                  <select
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs text-slate-800"
                  >
                    {AUDIENCES.map(aud => (
                      <option key={aud} value={aud}>{aud}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as NoticeStatus })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs text-slate-800"
                  >
                    <option value="Active">Active (Publish Now)</option>
                    <option value="Draft">Draft (Save for later)</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="pin-checkbox"
                  checked={formData.is_pinned}
                  onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="pin-checkbox" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5">
                  <Pin className="w-3.5 h-3.5 text-amber-500" />
                  Pin this notice to the top of the notice board
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notice Content / Description *</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Provide comprehensive details for the residents..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-xs text-slate-800 resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attachment URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://example.com/circular.pdf"
                    value={formData.attachment_url}
                    onChange={(e) => setFormData({ ...formData, attachment_url: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs text-slate-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attachment Label</label>
                  <input
                    type="text"
                    placeholder="e.g. AGM_Agenda_2026.pdf"
                    value={formData.attachment_name}
                    onChange={(e) => setFormData({ ...formData, attachment_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {editingNotice ? 'Update Notice' : 'Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW NOTICE FULL DETAILS MODAL */}
      {viewingNotice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white relative">
              <div className="flex items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getCategoryMeta(viewingNotice.category).bg} ${getCategoryMeta(viewingNotice.category).text}`}>
                    {viewingNotice.category}
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${getPriorityBadge(viewingNotice.priority)}`}>
                    {viewingNotice.priority}
                  </span>
                  {viewingNotice.is_pinned && (
                    <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white flex items-center gap-1">
                      <Pin className="w-3 h-3 fill-white" />
                      Pinned
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setViewingNotice(null)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <h2 className="text-xl font-black tracking-tight mt-4 text-white leading-snug">
                {viewingNotice.title}
              </h2>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-300 font-bold">
                <span>By {viewingNotice.posted_by}</span>
                <span>•</span>
                <span>{viewingNotice.posted_date ? format(new Date(viewingNotice.posted_date), 'dd MMMM yyyy') : 'Recent'}</span>
                <span>•</span>
                <span>Audience: {viewingNotice.target_audience || 'All'}</span>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-slate-700 text-sm font-medium leading-relaxed whitespace-pre-wrap">
                {viewingNotice.description}
              </div>

              {/* Attachment if present */}
              {viewingNotice.attachment_url && (
                <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Paperclip className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-indigo-900">
                        {viewingNotice.attachment_name || 'Official Attached Circular Document'}
                      </p>
                      <p className="text-[10px] text-indigo-500 font-bold">Click to view document</p>
                    </div>
                  </div>
                  <a
                    href={viewingNotice.attachment_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View
                  </a>
                </div>
              )}

              {/* Acknowledgements Section */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-700">
                    {viewingNotice.acknowledgements?.length || 0} residents acknowledged
                  </span>
                </div>

                {!isAdmin && residentId && (
                  <button
                    onClick={() => handleAcknowledge(viewingNotice.notice_id)}
                    disabled={viewingNotice.acknowledgements?.includes(residentId)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                      viewingNotice.acknowledgements?.includes(residentId)
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    {viewingNotice.acknowledgements?.includes(residentId) ? 'Acknowledged' : 'Acknowledge Notice'}
                  </button>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingNotice(null)}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
