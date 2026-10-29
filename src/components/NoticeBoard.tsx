import React, { useState, useEffect, useRef, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { 
  Megaphone, 
  Search, 
  Plus, 
  Pin, 
  Trash2, 
  Edit3, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Calendar as CalendarIcon, 
  Users, 
  Paperclip, 
  ExternalLink, 
  X, 
  Check, 
  Clock, 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Printer, 
  Upload, 
  ShieldAlert, 
  Wrench, 
  PartyPopper, 
  Info, 
  FileText, 
  Building,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  getDay, 
  addMonths, 
  subMonths, 
  isSameDay, 
  isToday, 
  parseISO 
} from 'date-fns';
import { Notice, NoticeCategory, NoticePriority, NoticeStatus, User, Resident } from '../types';
import { societyService } from '../lib/societyService';
import { initialAdmins, initialResidents } from '../data';
import { toast } from 'sonner';

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
  const currentUserId = ('resident_id' in user && user.resident_id) || ('admin_id' in user && user.admin_id) || ('id' in user && user.id) || '';

  // Data state
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  
  // Creative Small Calendar filter state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarDateField, setCalendarDateField] = useState<'posted_date' | 'expiry_date'>('posted_date');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
  const calendarContainerRef = useRef<HTMLDivElement>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [viewingNotice, setViewingNotice] = useState<Notice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Notice Form State
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
    attachment_name: '',
    attachment_type: '',
    attachment_size: undefined as number | undefined
  });

  // Track session views to avoid duplicate calls in same session
  const trackedViewsRef = useRef<Set<string>>(new Set());

  // Load notices from service
  const loadNotices = async () => {
    setLoading(true);
    try {
      const data = await societyService.getNotices(user.society_id);
      setNotices(data);
    } catch {
      toast.error('Failed to load notices from society database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, [user.society_id]);

  // Click outside to close calendar popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarContainerRef.current && !calendarContainerRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    }
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  // Helper to resolve real publisher details
  const getPublisherDetails = (notice: Notice) => {
    // Check if notice has stored role and avatar
    let name = notice.posted_by || 'Society Admin';
    let role = notice.publisher_role || 'Society Administration';
    let avatar = notice.publisher_avatar || '';

    // Match with admin records
    const matchedAdmin = initialAdmins.find(a => 
      a.admin_id === notice.publisher_id || 
      a.name.toLowerCase() === notice.posted_by.toLowerCase()
    );
    if (matchedAdmin) {
      name = matchedAdmin.name;
      role = matchedAdmin.admin_id === 'A001' ? 'Society Chairman' : matchedAdmin.admin_id === 'A002' ? 'Society Secretary' : 'Maintenance Head';
    } else {
      // Match with residents
      const matchedRes = initialResidents.find(r => 
        r.resident_id === notice.publisher_id || 
        r.name.toLowerCase() === notice.posted_by.toLowerCase()
      );
      if (matchedRes) {
        name = matchedRes.name;
        role = `${matchedRes.role || matchedRes.occupancy_type || 'Resident'} (Tower ${matchedRes.tower}-${matchedRes.flat})`;
        avatar = avatar || matchedRes.profile_photo || (matchedRes as any).avatar || '';
      }
    }

    return { name, role, avatar };
  };

  // Helper for Category icon & styling
  const getCategoryMeta = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'emergency':
        return { icon: ShieldAlert, bg: 'bg-[#FF5A0A]/10', text: 'text-[#FF5A0A]', border: 'border-[#FF5A0A]/30' };
      case 'maintenance':
        return { icon: Wrench, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
      case 'event':
        return { icon: PartyPopper, bg: 'bg-[#E7B0DE]/30', text: 'text-[#400849]', border: 'border-[#E7B0DE]' };
      case 'meeting':
        return { icon: Users, bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };
      case 'security':
        return { icon: ShieldAlert, bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200' };
      case 'financial':
        return { icon: FileText, bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' };
      default:
        return { icon: Info, bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
    }
  };

  // Helper for Priority badge
  const getPriorityBadge = (p: string) => {
    switch (p.toLowerCase()) {
      case 'urgent':
        return 'bg-[#FF5A0A] text-white';
      case 'important':
        return 'bg-amber-500 text-white';
      case 'normal':
        return 'bg-[#400849] text-white';
      default:
        return 'bg-slate-600 text-white';
    }
  };

  // Count metrics loaded directly from actual database records
  const publishedCount = notices.filter(n => n.status !== 'Draft').length;
  const urgentCount = notices.filter(n => n.priority === 'Urgent').length;
  const eventsCount = notices.filter(n => n.category === 'Event' || n.category === 'Meeting' || Boolean(n.expiry_date && new Date(n.expiry_date) >= new Date())).length;

  // Track unique notice view on open
  const handleOpenNotice = async (notice: Notice) => {
    setViewingNotice(notice);

    if (!currentUserId) return;
    const viewKey = `${notice.notice_id}_${currentUserId}`;
    if (trackedViewsRef.current.has(viewKey)) return;

    // Check if user already in notice.views
    const existingViews = Array.isArray(notice.views) ? notice.views : [];
    if (!existingViews.includes(currentUserId)) {
      trackedViewsRef.current.add(viewKey);
      try {
        const updated = await societyService.recordNoticeView(notice.notice_id, currentUserId, user.society_id);
        if (updated) {
          setViewingNotice(updated);
          setNotices(prev => prev.map(n => n.notice_id === updated.notice_id ? updated : n));
        }
      } catch {
        // silent fail
      }
    }
  };

  // Filter notices based on search, category, priority, status, and calendar date
  const filteredNotices = useMemo(() => {
    return notices.filter(n => {
      // 1. Search filter
      const search = searchQuery.toLowerCase().trim();
      const matchesSearch = !search || 
        n.title.toLowerCase().includes(search) ||
        n.description.toLowerCase().includes(search) ||
        n.notice_id.toLowerCase().includes(search) ||
        n.posted_by.toLowerCase().includes(search) ||
        (n.category && n.category.toLowerCase().includes(search));

      // 2. Category filter
      const matchesCategory = selectedCategory === 'All' || n.category === selectedCategory;

      // 3. Priority filter
      const matchesPriority = selectedPriority === 'All' || n.priority === selectedPriority;

      // 4. Status filter
      const matchesStatus = selectedStatus === 'All' ? (isAdmin ? true : n.status === 'Active') : (n.status === selectedStatus);

      // 5. Calendar date filter
      let matchesDate = true;
      if (selectedDate) {
        if (calendarDateField === 'posted_date') {
          if (n.posted_date) {
            try {
              matchesDate = isSameDay(parseISO(n.posted_date), selectedDate);
            } catch {
              matchesDate = false;
            }
          } else {
            matchesDate = false;
          }
        } else {
          // Event or Expiry date
          if (n.expiry_date) {
            try {
              matchesDate = isSameDay(parseISO(n.expiry_date), selectedDate);
            } catch {
              matchesDate = false;
            }
          } else {
            matchesDate = false;
          }
        }
      }

      return matchesSearch && matchesCategory && matchesPriority && matchesStatus && matchesDate;
    }).sort((a, b) => {
      // Pinned notices first
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      // Newest publication date first
      const dateA = new Date(a.posted_date || a.created_at || 0).getTime();
      const dateB = new Date(b.posted_date || b.created_at || 0).getTime();
      return dateB - dateA;
    });
  }, [notices, searchQuery, selectedCategory, selectedPriority, selectedStatus, selectedDate, calendarDateField, isAdmin]);

  // Calendar dates with active notices/events for indicator dots
  const datesWithNotices = useMemo(() => {
    const datesMap = new Map<string, { count: number; hasUrgent: boolean }>();
    notices.forEach(n => {
      const targetDateStr = calendarDateField === 'posted_date' ? n.posted_date : n.expiry_date;
      if (!targetDateStr) return;
      try {
        const d = parseISO(targetDateStr);
        const key = format(d, 'yyyy-MM-dd');
        const existing = datesMap.get(key) || { count: 0, hasUrgent: false };
        existing.count += 1;
        if (n.priority === 'Urgent') {
          existing.hasUrgent = true;
        }
        datesMap.set(key, existing);
      } catch {
        // ignore
      }
    });
    return datesMap;
  }, [notices, calendarDateField]);

  // Handle Create / Edit open
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
      attachment_name: '',
      attachment_type: '',
      attachment_size: undefined
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
      is_pinned: Boolean(notice.is_pinned),
      description: notice.description || '',
      attachment_url: notice.attachment_url || '',
      attachment_name: notice.attachment_name || '',
      attachment_type: notice.attachment_type || '',
      attachment_size: notice.attachment_size
    });
    setShowCreateModal(true);
  };

  // Handle Attachment Upload
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const uploaded = await societyService.uploadNoticeAttachment(file, user.society_id);
      setFormData(prev => ({
        ...prev,
        attachment_url: uploaded.attachment_url,
        attachment_name: uploaded.attachment_name,
        attachment_type: uploaded.attachment_type,
        attachment_size: uploaded.attachment_size
      }));
      toast.success(`Attached: ${uploaded.attachment_name}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'File upload failed';
      toast.error(msg);
    } finally {
      setUploadingFile(false);
    }
  };

  // Submit Notice Form
  const handleSubmitNotice = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please enter notice title and description');
      return;
    }

    setSubmitting(true);
    try {
      const publisherDetails = getPublisherDetails({
        ...formData,
        posted_by: user.name || 'Society Admin',
        notice_id: '',
        posted_date: new Date().toISOString().split('T')[0],
        society_id: user.society_id || 'GV2026'
      });

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
          publisher_id: currentUserId,
          publisher_role: publisherDetails.role,
          society_id: user.society_id || 'GV2026'
        });
        toast.success('Notice published to community board!');
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

  // Delete Notice
  const handleDeleteNotice = async (noticeId: string) => {
    if (!globalThis.confirm?.('Are you sure you want to permanently delete this notice?')) return;
    try {
      await societyService.deleteNotice(noticeId, user.society_id);
      toast.success('Notice deleted');
      if (viewingNotice?.notice_id === noticeId) {
        setViewingNotice(null);
      }
      await loadNotices();
      if (onRefresh) onRefresh();
    } catch {
      toast.error('Failed to delete notice');
    }
  };

  // Toggle Pin Status
  const handleTogglePin = async (notice: Notice) => {
    try {
      const newPinState = !notice.is_pinned;
      await societyService.togglePinNotice(notice.notice_id, newPinState, user.society_id);
      toast.success(newPinState ? 'Notice pinned to top' : 'Notice unpinned');
      await loadNotices();
      if (viewingNotice?.notice_id === notice.notice_id) {
        setViewingNotice(prev => prev ? { ...prev, is_pinned: newPinState } : null);
      }
    } catch {
      toast.error('Failed to update pin status');
    }
  };

  // Acknowledge notice
  const handleAcknowledge = async (noticeId: string) => {
    if (!currentUserId) return;
    try {
      await societyService.acknowledgeNotice(noticeId, currentUserId, user.society_id);
      toast.success('Notice acknowledged');
      await loadNotices();
      if (viewingNotice?.notice_id === noticeId) {
        setViewingNotice(prev => prev ? {
          ...prev,
          acknowledgements: Array.from(new Set([...(prev.acknowledgements || []), currentUserId]))
        } : null);
      }
    } catch {
      toast.error('Failed to record acknowledgement');
    }
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedPriority('All');
    setSelectedStatus('All');
    setSelectedDate(null);
    setIsCalendarOpen(false);
  };

  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'All' || selectedPriority !== 'All' || selectedStatus !== 'All' || selectedDate !== null;

  // Calendar Day Generation
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentCalendarMonth);
    const monthEnd = endOfMonth(monthStart);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDayOfWeek = getDay(monthStart); // 0 = Sunday
    return { daysInMonth, startDayOfWeek };
  }, [currentCalendarMonth]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full font-sans animate-in fade-in duration-200">
      
      {/* =========================================================================
          1. PAGE HEADER (Clean Horizontal Single Row, Back to Dashboard, + Create)
          ========================================================================= */}
      <header className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => onSwitchTab ? onSwitchTab('dashboard') : window.history.back()}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-[#400849] hover:text-white text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs group shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          </button>
          
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Notices & Communication
              </h1>
              <span className="hidden sm:inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#E7B0DE]/30 text-[#400849] border border-[#E7B0DE] rounded-full">
                Green Park Residency
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Society announcements, circulars and community updates
            </p>
          </div>
        </div>

        {/* Right Action: + Create Notice for Admin / Authorized publishers */}
        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 sm:px-5 py-2.5 bg-[#400849] hover:bg-[#32063a] active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Notice</span>
            </button>
          )}
        </div>
      </header>

      {/* =========================================================================
          2. NOTICE SUMMARY (3 Small Compact Equal-Height Cards from Database)
          ========================================================================= */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Card 1: Total Published Notices */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#400849]/10 text-[#400849] flex items-center justify-center font-black shrink-0">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total Published Notices
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">
                {publishedCount}
              </span>
              <span className="text-[11px] font-medium text-slate-500">active circulars</span>
            </div>
          </div>
        </div>

        {/* Card 2: Urgent Notices */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#FF5A0A]/10 text-[#FF5A0A] flex items-center justify-center font-black shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Urgent Notices
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">
                {urgentCount}
              </span>
              <span className="text-[11px] font-medium text-[#FF5A0A]">high priority alerts</span>
            </div>
          </div>
        </div>

        {/* Card 3: Scheduled Events */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#E7B0DE]/30 text-[#400849] flex items-center justify-center font-black shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Scheduled Events
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">
                {eventsCount}
              </span>
              <span className="text-[11px] font-medium text-slate-500">meetings & programmes</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. COMPACT FILTER TOOLBAR WITH CREATIVE SMALL CALENDAR POPOVER
          ========================================================================= */}
      <section className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Controls group */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search notices by title, description or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#400849] focus:bg-white focus:ring-1 focus:ring-[#400849] text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 outline-none focus:border-[#400849] cursor-pointer"
              title="Filter by category"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Priority Dropdown */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 outline-none focus:border-[#400849] cursor-pointer"
              title="Filter by priority"
            >
              <option value="All">All Priorities</option>
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 outline-none focus:border-[#400849] cursor-pointer"
              title="Filter by publication status"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Published</option>
              {isAdmin && <option value="Draft">Drafts</option>}
              <option value="Expired">Expired</option>
            </select>

            {/* CREATIVE SMALL CALENDAR FILTER BUTTON & ANCHORED POPOVER */}
            <div className="relative" ref={calendarContainerRef}>
              <button
                type="button"
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                  selectedDate 
                    ? 'bg-[#400849] text-white border-[#400849] shadow-xs' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title="Filter notices by calendar date"
              >
                <CalendarIcon className={`w-3.5 h-3.5 ${selectedDate ? 'text-[#E7B0DE]' : 'text-[#400849]'}`} />
                <span>
                  {selectedDate ? format(selectedDate, 'dd MMM yyyy') : 'Select date'}
                </span>
                {selectedDate && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDate(null);
                    }}
                    className="ml-0.5 p-0.5 hover:bg-white/20 rounded-full"
                    title="Clear date"
                  >
                    <X className="w-3 h-3 text-white" />
                  </span>
                )}
              </button>

              {/* Anchored Small Calendar Popover (Compact ~290px wide) */}
              {isCalendarOpen && (
                <div 
                  className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 z-50 w-[290px] sm:w-[310px] bg-white rounded-2xl shadow-xl border border-slate-200/90 p-3.5 animate-in fade-in zoom-in-95 duration-150"
                  style={{ maxWidth: 'calc(100vw - 2rem)' }}
                >
                  {/* Calendar Mode Switcher (Published vs Event/Expiry) */}
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg mb-3">
                    <button
                      type="button"
                      onClick={() => setCalendarDateField('posted_date')}
                      className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-all ${
                        calendarDateField === 'posted_date'
                          ? 'bg-white text-[#400849] shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Published Date
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarDateField('expiry_date')}
                      className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-all ${
                        calendarDateField === 'expiry_date'
                          ? 'bg-white text-[#400849] shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Event / Expiry
                    </button>
                  </div>

                  {/* Popover Header: Month & Navigation */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <button
                      type="button"
                      onClick={() => setCurrentCalendarMonth(prev => subMonths(prev, 1))}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                      title="Previous month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-800">
                        {format(currentCalendarMonth, 'MMMM yyyy')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentCalendarMonth(new Date())}
                        className="text-[10px] font-bold text-[#400849] bg-[#E7B0DE]/30 px-1.5 py-0.5 rounded cursor-pointer hover:bg-[#E7B0DE]/50 transition-colors"
                        title="Jump to today"
                      >
                        Today
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentCalendarMonth(prev => addMonths(prev, 1))}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                      title="Next month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Weekday Labels */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1">
                    <span>Su</span>
                    <span>Mo</span>
                    <span>Tu</span>
                    <span>We</span>
                    <span>Th</span>
                    <span>Fr</span>
                    <span>Sa</span>
                  </div>

                  {/* 7-column Date Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Empty cells before month start */}
                    {Array.from({ length: calendarDays.startDayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-8" />
                    ))}

                    {/* Day buttons */}
                    {calendarDays.daysInMonth.map(day => {
                      const dateKey = format(day, 'yyyy-MM-dd');
                      const noticeMeta = datesWithNotices.get(dateKey);
                      const isSelected = selectedDate && isSameDay(day, selectedDate);
                      const isCurrentDay = isToday(day);

                      return (
                        <button
                          key={dateKey}
                          type="button"
                          onClick={() => setSelectedDate(day)}
                          className={`h-8 w-full rounded-lg text-xs font-semibold flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#400849] text-white font-bold shadow-2xs'
                              : isCurrentDay
                              ? 'bg-[#E7B0DE]/20 text-[#400849] font-bold ring-1 ring-[#400849]/30'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="leading-none">{format(day, 'd')}</span>
                          {/* Dot for dates with actual notices */}
                          {noticeMeta && (
                            <span 
                              className={`w-1 h-1 rounded-full absolute bottom-1 ${
                                isSelected 
                                  ? 'bg-[#E7B0DE]' 
                                  : noticeMeta.hasUrgent 
                                  ? 'bg-[#FF5A0A]' 
                                  : 'bg-[#400849]'
                              }`}
                              title={`${noticeMeta.count} notice(s)`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Calendar Footer: Clear & Apply Actions */}
                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate(null);
                        setIsCalendarOpen(false);
                      }}
                      className="px-2.5 py-1 text-slate-500 hover:text-slate-800 font-bold transition-colors cursor-pointer"
                    >
                      Clear
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCalendarOpen(false)}
                      className="px-3.5 py-1 bg-[#400849] hover:bg-[#32063a] text-white font-bold rounded-lg transition-all shadow-2xs cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Clear All Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="px-2.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer"
                title="Reset all search & filter controls"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Result counter indicator */}
          <div className="text-[11px] font-bold text-slate-500 tabular-nums ml-auto shrink-0">
            Showing <strong className="text-slate-900">{filteredNotices.length}</strong> of {notices.length} notices
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. NOTICE CARDS LIST (Primary Focus, Elegant Horizontal Cards)
          ========================================================================= */}
      {loading ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200/90 shadow-xs">
          <div className="w-8 h-8 border-3 border-[#400849] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Loading notices...</p>
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 sm:p-16 text-center border border-slate-200/90 shadow-xs space-y-3">
          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <Megaphone className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No notices found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {hasActiveFilters
              ? 'No announcements match your search keywords or calendar date filter. Try clearing filters.'
              : 'There are currently no circulars or notices posted on the society board.'}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="mt-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredNotices.map((notice) => {
            const catMeta = getCategoryMeta(notice.category);
            const CatIcon = catMeta.icon;
            const publisher = getPublisherDetails(notice);
            const viewCount = (notice.views?.length || 0) + (notice.views_count || 0);
            const isAcknowledged = currentUserId ? notice.acknowledgements?.includes(currentUserId) : false;

            return (
              <article
                key={notice.notice_id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-[#400849]/50 transition-all p-4 sm:p-5 shadow-xs hover:shadow-sm flex flex-col justify-between gap-3 group"
              >
                {/* 1. TOP ROW: Category Label & Icon, Notice Title, Priority Badge (aligned right) */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap flex-1 min-w-0">
                    {/* Category Label */}
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${catMeta.bg} ${catMeta.text} ${catMeta.border} border`}>
                      <CatIcon className="w-3 h-3" />
                      <span>{notice.category}</span>
                    </span>

                    {/* Notice Title */}
                    <h2
                      onClick={() => handleOpenNotice(notice)}
                      className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#400849] transition-colors cursor-pointer leading-snug line-clamp-1"
                      title={notice.title}
                    >
                      {notice.title}
                    </h2>

                    {/* Pinned Indicator Icon */}
                    {notice.is_pinned && (
                      <span 
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md"
                        title="Pinned announcement"
                      >
                        <Pin className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>Pinned</span>
                      </span>
                    )}
                  </div>

                  {/* Priority Badge aligned to the right */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPriorityBadge(notice.priority)}`}>
                      {notice.priority}
                    </span>
                  </div>
                </div>

                {/* 2. MIDDLE ROW: Short Description Preview (Max 2 lines with truncation) */}
                <div>
                  <p 
                    onClick={() => handleOpenNotice(notice)}
                    className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed font-normal cursor-pointer hover:text-slate-800 transition-colors"
                  >
                    {notice.description}
                  </p>
                </div>

                {/* 3. BOTTOM ROW: Publisher DP Avatar, Name & Role, Published Date, View Count, Attachments, Read Notice */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  {/* Left Group: Publisher Identity, Date, Views & Attachments */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                    
                    {/* Publisher DP & Name/Role */}
                    <div className="flex items-center gap-2">
                      {publisher.avatar ? (
                        <img 
                          src={publisher.avatar} 
                          alt={publisher.name}
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 rounded-full object-cover border border-slate-200 shadow-2xs" 
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[#400849] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                          {publisher.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="leading-tight">
                        <span className="font-bold text-slate-800 block text-xs">{publisher.name}</span>
                        <span className="text-[10px] text-slate-400 block">{publisher.role}</span>
                      </div>
                    </div>

                    <span className="hidden sm:inline text-slate-300">·</span>

                    {/* Published Date */}
                    <div className="flex items-center gap-1 text-slate-600 font-medium">
                      <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{notice.posted_date ? format(new Date(notice.posted_date), 'dd MMM yyyy') : 'Recent'}</span>
                    </div>

                    <span className="hidden sm:inline text-slate-300">·</span>

                    {/* View Count with eye icon */}
                    <div className="flex items-center gap-1 text-slate-600 font-medium tabular-nums" title={`${viewCount} unique verified resident view(s)`}>
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>{viewCount} {viewCount === 1 ? 'view' : 'views'}</span>
                    </div>

                    {/* Attachment Icon & Count if media is attached */}
                    {notice.attachment_url && (
                      <>
                        <span className="hidden sm:inline text-slate-300">·</span>
                        <div 
                          className="flex items-center gap-1 text-[#400849] font-semibold bg-[#E7B0DE]/20 px-2 py-0.5 rounded-md"
                          title={notice.attachment_name || 'Attached official document'}
                        >
                          <Paperclip className="w-3 h-3 text-[#400849]" />
                          <span className="text-[11px] truncate max-w-[140px]">
                            {notice.attachment_type?.includes('pdf') || notice.attachment_name?.endsWith('.pdf') ? 'PDF' : 'Image'} Attached
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Right Group: Read Notice Action & Admin Tools */}
                  <div className="flex items-center gap-2 ml-auto">
                    {/* Admin Actions */}
                    {isAdmin && (
                      <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">
                        <button
                          type="button"
                          onClick={() => handleTogglePin(notice)}
                          className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                            notice.is_pinned 
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                          }`}
                          title={notice.is_pinned ? 'Unpin Notice' : 'Pin to top'}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(notice)}
                          className="p-1.5 bg-white text-slate-600 hover:text-[#400849] hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                          title="Edit Notice"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteNotice(notice.notice_id)}
                          className="p-1.5 bg-white text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                          title="Delete Notice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Primary Read Notice Action */}
                    <button
                      type="button"
                      onClick={() => handleOpenNotice(notice)}
                      className="px-3.5 py-1.5 bg-[#400849] hover:bg-[#32063a] text-white text-xs font-bold rounded-lg transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <span>Read Notice</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          5. NOTICE DETAIL MODAL (Read Notice Full View, Media Preview & Downloads)
          ========================================================================= */}
      {viewingNotice && (() => {
        const catMeta = getCategoryMeta(viewingNotice.category);
        const CatIcon = catMeta.icon;
        const publisher = getPublisherDetails(viewingNotice);
        const viewCount = (viewingNotice.views?.length || 0) + (viewingNotice.views_count || 0);
        const isAcknowledged = currentUserId ? viewingNotice.acknowledgements?.includes(currentUserId) : false;
        const isPdf = viewingNotice.attachment_type?.includes('pdf') || viewingNotice.attachment_name?.toLowerCase().endsWith('.pdf');
        const isImage = viewingNotice.attachment_type?.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(viewingNotice.attachment_url || '');

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-3 sm:p-5">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
              
              {/* Modal Top Banner */}
              <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-start justify-between gap-4 border-b border-slate-800">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${catMeta.bg} ${catMeta.text}`}>
                      {viewingNotice.category}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPriorityBadge(viewingNotice.priority)}`}>
                      {viewingNotice.priority}
                    </span>
                    {viewingNotice.is_pinned && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white flex items-center gap-1">
                        <Pin className="w-3 h-3 fill-white" />
                        Pinned
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-snug">
                    {viewingNotice.title}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingNotice(null)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white cursor-pointer shrink-0"
                  title="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Publisher & Metadata Bar */}
              <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  {publisher.avatar ? (
                    <img 
                      src={publisher.avatar} 
                      alt={publisher.name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover border border-slate-300"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#400849] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {publisher.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-800 text-xs leading-none">{publisher.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{publisher.role}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-slate-600 text-xs">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>{viewingNotice.posted_date ? format(new Date(viewingNotice.posted_date), 'dd MMM yyyy') : 'Recent'}</span>
                  </div>
                  <span className="text-slate-300">·</span>
                  <div className="flex items-center gap-1" title="Authenticated Unique Views">
                    <Eye className="w-3.5 h-3.5 text-[#400849]" />
                    <span className="font-bold text-slate-800 tabular-nums">{viewCount} views</span>
                  </div>
                  {viewingNotice.target_audience && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                        {viewingNotice.target_audience}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Modal Body / Full Description */}
              <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-xs sm:text-sm leading-relaxed">
                <div className="whitespace-pre-wrap font-normal text-slate-800 bg-slate-50/60 p-5 rounded-2xl border border-slate-200">
                  {viewingNotice.description}
                </div>

                {/* Media Attachment View & Download Section */}
                {viewingNotice.attachment_url && (
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                        <Paperclip className="w-4 h-4 text-[#400849]" />
                        <span>Official Notice Attachment</span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {viewingNotice.attachment_size ? `${(viewingNotice.attachment_size / (1024 * 1024)).toFixed(1)} MB` : 'Attached file'}
                      </span>
                    </div>

                    {/* Image Preview */}
                    {isImage && (
                      <div className="rounded-xl overflow-hidden border border-slate-200 max-h-64 bg-slate-900 flex items-center justify-center">
                        <img 
                          src={viewingNotice.attachment_url} 
                          alt="Notice media preview"
                          referrerPolicy="no-referrer"
                          className="max-h-64 object-contain w-full"
                        />
                      </div>
                    )}

                    {/* Download & View Actions */}
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <p className="text-xs font-semibold text-slate-700 truncate max-w-sm">
                        {viewingNotice.attachment_name || 'Official Circular Document'}
                      </p>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={viewingNotice.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                          <span>View Document</span>
                        </a>
                        <a
                          href={viewingNotice.attachment_url}
                          download={viewingNotice.attachment_name || 'notice_document'}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 rounded-lg bg-[#400849] hover:bg-[#32063a] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Acknowledgements Section */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-700">
                      {viewingNotice.acknowledgements?.length || 0} residents acknowledged
                    </span>
                  </div>

                  {!isAdmin && currentUserId && (
                    <button
                      type="button"
                      onClick={() => handleAcknowledge(viewingNotice.notice_id)}
                      disabled={isAcknowledged}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isAcknowledged 
                          ? 'bg-emerald-100 text-emerald-800 cursor-default'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isAcknowledged ? 'Acknowledged' : 'Acknowledge Notice'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => globalThis.print?.()}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>Print Circular</span>
                </button>

                <div className="flex items-center gap-2 ml-auto">
                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const n = viewingNotice;
                          setViewingNotice(null);
                          handleOpenEdit(n);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteNotice(viewingNotice.notice_id)}
                        className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setViewingNotice(null)}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          6. CREATE / EDIT NOTICE MODAL (Validated Media Upload, Clean Typography)
          ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-[#400849] text-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight">
                    {editingNotice ? 'Edit Society Notice' : 'Create Society Notice'}
                  </h3>
                  <p className="text-[#E7B0DE] text-xs font-semibold">
                    Publish official communication to society residents
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitNotice} className="p-6 space-y-4 overflow-y-auto">
              {/* Notice Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Notice Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled Water Tank Cleaning & Supply Interruption"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#400849] focus:ring-1 focus:ring-[#400849] text-xs font-semibold text-slate-800 outline-none"
                />
              </div>

              {/* Category, Priority, Target Audience */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as NoticeCategory })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#400849] text-xs font-semibold text-slate-800 outline-none bg-white cursor-pointer"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Priority Level *</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as NoticePriority })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#400849] text-xs font-semibold text-slate-800 outline-none bg-white cursor-pointer"
                  >
                    {PRIORITIES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Target Audience *</label>
                  <select
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-[#400849] text-xs font-semibold text-slate-800 outline-none bg-white cursor-pointer"
                  >
                    {AUDIENCES.map(aud => (
                      <option key={aud} value={aud}>{aud}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Expiry Date & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Event / Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-[#400849] text-xs font-semibold text-slate-800 outline-none bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Publication Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as NoticeStatus })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-[#400849] text-xs font-semibold text-slate-800 outline-none bg-white cursor-pointer"
                  >
                    <option value="Active">Active (Publish immediately)</option>
                    <option value="Draft">Draft (Save privately)</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>

              {/* Pin notice checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pin-notice-chk"
                  checked={formData.is_pinned}
                  onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                  className="w-4 h-4 text-[#400849] rounded border-slate-300 focus:ring-[#400849] cursor-pointer"
                />
                <label htmlFor="pin-notice-chk" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5">
                  <Pin className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pin this notice to top of the board</span>
                </label>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Notice Body & Details *</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Enter full notice announcement details, timings, action required, or guidelines..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#400849] focus:ring-1 focus:ring-[#400849] text-xs text-slate-800 leading-relaxed outline-none"
                />
              </div>

              {/* File Attachment Upload (PDF or Image, max 10MB) */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-[#400849]" />
                      <span>Attach PDF or Image (Optional)</span>
                    </label>
                    <p className="text-[11px] text-slate-500">Supported: PDF, JPG, PNG, WEBP (Max 10 MB)</p>
                  </div>

                  <label className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-slate-600" />
                    <span>{uploadingFile ? 'Uploading...' : 'Choose File'}</span>
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      className="hidden"
                    />
                  </label>
                </div>

                {formData.attachment_name && (
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-[#400849] shrink-0" />
                      <span className="font-bold text-slate-800 truncate">{formData.attachment_name}</span>
                      {formData.attachment_size && (
                        <span className="text-[10px] text-slate-400">({(formData.attachment_size / 1024).toFixed(0)} KB)</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, attachment_url: '', attachment_name: '', attachment_type: '', attachment_size: undefined }))}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Remove attachment"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Submission Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingFile}
                  className="px-6 py-2.5 bg-[#400849] hover:bg-[#32063a] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingNotice ? 'Update Notice' : 'Publish Notice'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
