import React, { useState, useEffect, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { 
  Megaphone, 
  MessageSquare, 
  Send, 
  Users, 
  Search, 
  Trash2, 
  Paperclip, 
  X, 
  ShieldCheck, 
  Building2, 
  Wrench, 
  Info, 
  Clock, 
  CheckCheck, 
  Sparkles,
  RefreshCw,
  Share2,
  Smile,
  AlertCircle,
  Image as ImageIcon,
  Camera,
  FileText,
  Plus,
  Filter,
  CheckCircle2,
  Lock,
  MessageCircle,
  HelpCircle,
  ArrowRight,
  Shield
} from 'lucide-react';
import { Communication, CommunicationChannel, User, Resident, Role } from '../types';
import { societyService } from '../lib/societyService';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface CommunicationCenterProps {
  user: User | Resident;
  onSwitchTab?: (tab: string) => void;
  onRefresh?: () => void;
}

interface ChannelDef {
  id: CommunicationChannel;
  name: string;
  description: string;
  icon: typeof Megaphone;
  color: string;
  badge?: string;
}

const CHANNELS: ChannelDef[] = [
  {
    id: 'broadcast',
    name: 'Official Announcements',
    description: 'Direct alerts & broadcasts from Society Management',
    icon: Megaphone,
    color: 'from-indigo-600 to-blue-700',
    badge: 'Broadcast'
  },
  {
    id: 'general',
    name: 'Community Lounge',
    description: 'Open discussion forum for all society residents',
    icon: MessageSquare,
    color: 'from-slate-700 to-slate-900',
    badge: 'All Residents'
  },
  {
    id: 'maintenance',
    name: 'Maintenance & Facility Desk',
    description: 'Discussions on repairs, water, lifts, and utilities',
    icon: Wrench,
    color: 'from-amber-600 to-orange-700',
    badge: 'Facility'
  },
  {
    id: 'committee',
    name: 'Managing Committee & RWA',
    description: 'Society decisions, AGM topics, and resident queries',
    icon: ShieldCheck,
    color: 'from-emerald-600 to-teal-700',
    badge: 'RWA'
  },
  {
    id: 'tower',
    name: 'Tower Resident Group',
    description: 'Localized tower discussions & neighborhood updates',
    icon: Building2,
    color: 'from-purple-600 to-indigo-800',
    badge: 'Tower'
  }
];

const QUICK_PROMPTS = [
  'Water supply status update?',
  'Elevator maintenance notice check',
  'Visitor parking bay query',
  'Clubhouse booking query',
  'Package delivery security check'
];

export interface SupportTicketReply {
  id: string;
  sender_name: string;
  sender_role: string;
  content: string;
  created_at: string;
  attachment_url?: string;
  attachment_name?: string;
  is_internal_remark?: boolean;
}

export interface SupportTicket {
  id: string;
  ticket_no: string;
  type: 'Query' | 'Complaint' | 'Suggestion' | 'Escalation';
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  subject: string;
  description: string;
  resident_id: string;
  resident_name: string;
  tower: string;
  flat: string;
  created_at: string;
  updated_at: string;
  replies: SupportTicketReply[];
  attachment_url?: string;
  attachment_name?: string;
}

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'T001',
    ticket_no: 'COM-2026-081',
    type: 'Query',
    category: 'Billing & Dues',
    priority: 'Medium',
    status: 'In Progress',
    subject: 'Discrepancy in March 2026 Water Surcharge Calculation',
    description: 'My monthly bill shows a ₹350 extra water surcharge. Kindly clarify the meter reading calculation.',
    resident_id: 'R001',
    resident_name: 'Rahul Sharma',
    tower: 'A',
    flat: '101',
    created_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    attachment_url: 'https://example.com/water_bill_statement.pdf',
    attachment_name: 'Water_Statement_Mar2026.pdf',
    replies: [
      {
        id: 'R1',
        sender_name: 'Rahul Sharma',
        sender_role: 'Resident (Owner)',
        content: 'I have attached my meter reading photo taken on March 25th.',
        created_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
      },
      {
        id: 'R2',
        sender_name: 'Karan Bodake',
        sender_role: 'Treasurer',
        content: 'Reviewed reading. The sub-meter calibration was updated. Re-issuing adjusted receipt.',
        created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'T002',
    ticket_no: 'COM-2026-082',
    type: 'Suggestion',
    category: 'Amenity & Clubhouse',
    priority: 'Low',
    status: 'Open',
    subject: 'EV Charging Station Installation Proposal in Tower B Basement',
    description: 'Proposing 4 dedicated EV charging points near Pillar B-12 for electric vehicles.',
    resident_id: 'R004',
    resident_name: 'Priya Verma',
    tower: 'B',
    flat: '302',
    created_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    replies: [
      {
        id: 'R3',
        sender_name: 'Priya Verma',
        sender_role: 'Resident (Owner)',
        content: 'We can discuss vendor quotations during the upcoming AGM meeting.',
        created_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'T003',
    ticket_no: 'COM-2026-083',
    type: 'Complaint',
    category: 'Gate & Security',
    priority: 'High',
    status: 'Resolved',
    subject: 'Delivery Executive Unannounced Entry at Night',
    description: 'A courier delivered package at 11:30 PM without approval notification on visitor app.',
    resident_id: 'R012',
    resident_name: 'Amit Patel',
    tower: 'C',
    flat: '204',
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    replies: [
      {
        id: 'R4',
        sender_name: 'Amit Patel',
        sender_role: 'Resident (Tenant)',
        content: 'Please ensure night shift guards verify all entries.',
        created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
      },
      {
        id: 'R5',
        sender_name: 'Balaji Survase',
        sender_role: 'Secretary',
        content: 'Night shift security guard reprimanded and strict protocol enforced at Gate #2.',
        created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
      }
    ]
  }
];

export default function CommunicationCenter({ user, onSwitchTab, onRefresh }: CommunicationCenterProps) {
  const isAdmin = user.role === 'admin' || Boolean('admin_id' in user && user.admin_id);
  const isSecurity = user.role === 'security';
  const currentUserId = ('admin_id' in user && user.admin_id) || ('resident_id' in user && user.resident_id) || ('security_id' in user && user.security_id) || ('id' in user && user.id) || '';
  
  const displayRole: string = String(('admin_role' in user && user.admin_role) || (user.role === 'admin' ? 'Chairman' : user.role === 'security' ? 'Security Guard' : 'Resident'));

  const [activeTab, setActiveTab] = useState<'chat' | 'tickets'>('chat');
  const [activeChannel, setActiveChannel] = useState<CommunicationChannel>('broadcast');
  const [messages, setMessages] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Composer state
  const [messageText, setMessageText] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);
  const [sending, setSending] = useState(false);

  // Tickets State
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('All');
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState<string>('All');
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState<string>('All');
  const [showRaiseTicketModal, setShowRaiseTicketModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isInternalRemark, setIsInternalRemark] = useState(false);

  // Raise Ticket Form Data
  const [newTicketData, setNewTicketData] = useState({
    type: 'Query' as 'Query' | 'Complaint' | 'Suggestion' | 'Escalation',
    category: 'Maintenance & Repairs',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Urgent',
    subject: '',
    description: '',
    attachment_url: '',
    attachment_name: ''
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const data = await societyService.getCommunications(user.society_id, activeChannel);
      setMessages(data);
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [user.society_id, activeChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim()) return;

    if (activeChannel === 'broadcast' && !isAdmin) {
      toast.error('Only Society Admins can post in the Official Announcements channel.');
      return;
    }

    setSending(true);
    try {
      const senderTitle = `${user.name || 'User'} (${displayRole})`;
      const newMsg = await societyService.sendCommunication({
        channel: activeChannel,
        sender_id: currentUserId,
        sender_name: senderTitle,
        sender_role: displayRole,
        sender_tower: user.tower || 'A',
        sender_flat: user.flat || '101',
        title: isAnnouncement && announcementTitle ? announcementTitle : undefined,
        content: messageText.trim(),
        attachment_url: attachmentUrl.trim() || undefined,
        attachment_name: attachmentName.trim() || (attachmentUrl ? 'Attached Document' : undefined),
        is_announcement: isAnnouncement,
        society_id: user.society_id || 'GV2026'
      });

      setMessages(prev => [...prev, newMsg]);
      setMessageText('');
      setAnnouncementTitle('');
      setIsAnnouncement(false);
      setAttachmentUrl('');
      setAttachmentName('');
      setShowAttachmentInput(false);
      toast.success('Message posted to channel');
      if (onRefresh) onRefresh();
    } catch {
      toast.error('Failed to post message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await societyService.deleteCommunication(messageId, user.society_id);
      setMessages(prev => prev.filter(m => m.message_id !== messageId));
      toast.success('Message removed');
    } catch {
      toast.error('Failed to remove message');
    }
  };

  // Ticket Handlers
  const handleRaiseTicket = (e: FormEvent) => {
    e.preventDefault();
    if (!newTicketData.subject.trim() || !newTicketData.description.trim()) {
      toast.error('Please enter subject and description');
      return;
    }

    const newTicket: SupportTicket = {
      id: `T00${tickets.length + 1}`,
      ticket_no: `COM-2026-08${tickets.length + 4}`,
      type: newTicketData.type,
      category: newTicketData.category,
      priority: newTicketData.priority,
      status: 'Open',
      subject: newTicketData.subject,
      description: newTicketData.description,
      resident_id: currentUserId,
      resident_name: user.name || 'Resident',
      tower: user.tower || 'A',
      flat: user.flat || '101',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      attachment_url: newTicketData.attachment_url || undefined,
      attachment_name: newTicketData.attachment_name || undefined,
      replies: [
        {
          id: `R${Date.now()}`,
          sender_name: `${user.name || 'Resident'} (${displayRole})`,
          sender_role: displayRole,
          content: newTicketData.description,
          created_at: new Date().toISOString(),
          attachment_url: newTicketData.attachment_url || undefined,
          attachment_name: newTicketData.attachment_name || undefined
        }
      ]
    };

    setTickets(prev => [newTicket, ...prev]);
    setShowRaiseTicketModal(false);
    setNewTicketData({
      type: 'Query',
      category: 'Maintenance & Repairs',
      priority: 'Medium',
      subject: '',
      description: '',
      attachment_url: '',
      attachment_name: ''
    });
    toast.success(`Request ticket ${newTicket.ticket_no} created successfully!`);
  };

  const handleAddReplyToTicket = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    const newReply: SupportTicketReply = {
      id: `R${Date.now()}`,
      sender_name: `${user.name || 'User'} (${displayRole})`,
      sender_role: displayRole,
      content: replyText.trim(),
      created_at: new Date().toISOString(),
      is_internal_remark: isInternalRemark
    };

    const updated = {
      ...selectedTicket,
      updated_at: new Date().toISOString(),
      replies: [...selectedTicket.replies, newReply]
    };

    setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updated : t));
    setSelectedTicket(updated);
    setReplyText('');
    setIsInternalRemark(false);
    toast.success('Reply submitted');
  };

  const handleUpdateTicketStatus = (ticketId: string, status: SupportTicket['status']) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return { ...t, status, updated_at: new Date().toISOString() };
      }
      return t;
    }));
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status, updated_at: new Date().toISOString() });
    }
    toast.success(`Ticket status updated to ${status}`);
  };

  const currentChannelDef = CHANNELS.find(c => c.id === activeChannel) || CHANNELS[0];
  const ChannelIcon = currentChannelDef.icon;

  const filteredMessages = messages.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.content.toLowerCase().includes(q) ||
      m.sender_name.toLowerCase().includes(q) ||
      (m.title && m.title.toLowerCase().includes(q)) ||
      (m.sender_flat && m.sender_flat.toLowerCase().includes(q))
    );
  });

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.ticket_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.resident_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = ticketStatusFilter === 'All' || t.status === ticketStatusFilter;
    const matchesCategory = ticketCategoryFilter === 'All' || t.category === ticketCategoryFilter;
    const matchesPriority = ticketPriorityFilter === 'All' || t.priority === ticketPriorityFilter;

    // Residents only see their own tickets unless admin/security
    const matchesUser = (isAdmin || isSecurity) ? true : t.resident_id === currentUserId;

    return matchesSearch && matchesStatus && matchesCategory && matchesPriority && matchesUser;
  });

  const openTicketCount = tickets.filter(t => t.status === 'Open').length;
  const inProgressTicketCount = tickets.filter(t => t.status === 'In Progress').length;
  const resolvedTicketCount = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full font-sans">
      {/* Top Main Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60">
          <button
            id="tab-notices"
            onClick={() => onSwitchTab && onSwitchTab('notices')}
            className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 hover:text-slate-900 hover:bg-white/80 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Megaphone className="w-4 h-4" />
            Notices
          </button>
          <button
            id="tab-communication"
            onClick={() => setActiveTab('chat')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'chat' 
                ? 'bg-[#542d87] text-white shadow-md shadow-purple-900/20' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chat Channels
          </button>
          <button
            id="tab-support-tickets"
            onClick={() => setActiveTab('tickets')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'tickets' 
                ? 'bg-[#542d87] text-white shadow-md shadow-purple-900/20' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Requests & Tickets</span>
            {openTicketCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center">
                {openTicketCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-purple-50 px-3.5 py-2 rounded-2xl border border-purple-200 text-xs font-bold text-[#542d87]">
            <Shield className="w-4 h-4 text-[#542d87]" />
            <span>Role: <strong>{displayRole}</strong></span>
          </div>
          {activeTab === 'tickets' && (
            <button
              onClick={() => setShowRaiseTicketModal(true)}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-600/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Submit Request
            </button>
          )}
        </div>
      </div>

      {/* VIEW MODE 1: CHAT CHANNELS */}
      {activeTab === 'chat' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[620px]">
          {/* CHANNELS SIDEBAR */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 py-1">
                Communication Channels
              </p>

              <div className="space-y-1.5">
                {CHANNELS.map((ch) => {
                  const Icon = ch.icon;
                  const isActive = activeChannel === ch.id;

                  return (
                    <button
                      key={ch.id}
                      onClick={() => {
                        setActiveChannel(ch.id);
                        setSearchQuery('');
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3.5 relative group cursor-pointer ${
                        isActive
                          ? 'bg-purple-50/70 border-purple-200/80 shadow-sm'
                          : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl text-white bg-gradient-to-br ${ch.color} shrink-0 shadow-sm`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className={`text-xs font-black truncate ${isActive ? 'text-[#542d87]' : 'text-slate-800'}`}>
                            {ch.name}
                          </h4>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                            {ch.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 font-medium">
                          {ch.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Role Guidelines Card */}
            <div className="bg-gradient-to-br from-[#542d87] to-slate-900 text-white p-5 rounded-3xl shadow-md space-y-2">
              <div className="flex items-center gap-2 text-orange-300 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-orange-400" />
                Community Protocol
              </div>
              <p className="text-xs text-purple-100 font-medium leading-relaxed">
                Logged in as <strong>{user.name} ({displayRole})</strong>. Broadcast announcements are reserved for Chairman, Secretary & Treasurer.
              </p>
            </div>
          </div>

          {/* CHAT MESSAGES & COMPOSER AREA */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
            {/* Active Channel Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl text-white bg-gradient-to-br ${currentChannelDef.color}`}>
                  <ChannelIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    {currentChannelDef.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {currentChannelDef.description}
                  </p>
                </div>
              </div>

              {/* In-chat Search */}
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search in channel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#542d87] placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[440px] min-h-[360px] custom-scrollbar bg-[#FDFDFE]">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-slate-400">
                  <div className="w-8 h-8 border-3 border-[#542d87] border-t-transparent rounded-full animate-spin mb-2" />
                  <p className="text-xs font-bold uppercase tracking-wider">Loading conversation...</p>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-400">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                    <ChannelIcon className="w-6 h-6 text-slate-400" />
                  </div>
                  <h4 className="text-sm font-black text-slate-700">No messages in this channel yet</h4>
                  <p className="text-xs font-medium text-slate-400 max-w-xs mt-1">
                    {activeChannel === 'broadcast'
                      ? 'Official admin broadcasts and updates will appear here.'
                      : 'Start the conversation or ask a question below!'}
                  </p>
                </div>
              ) : (
                filteredMessages.map((msg) => {
                  const isMe = msg.sender_id === currentUserId;
                  const isMsgAdmin = msg.sender_role?.toLowerCase().includes('admin') || msg.sender_role === 'Chairman' || msg.sender_role === 'Secretary' || msg.sender_role === 'Treasurer';

                  return (
                    <div
                      key={msg.message_id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                    >
                      {/* Sender Identity & Role Pill */}
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-[11px] font-black text-slate-800">
                          {msg.sender_name}
                        </span>
                        {isMsgAdmin && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-100 text-[#542d87] text-[9px] font-black uppercase tracking-wider border border-purple-200">
                            {msg.sender_role || 'Admin'}
                          </span>
                        )}
                        {msg.sender_flat && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-bold">
                            Tower {msg.sender_tower || 'A'} • Flat {msg.sender_flat}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-medium">
                          {msg.created_at ? format(new Date(msg.created_at), 'HH:mm • dd MMM') : ''}
                        </span>

                        {(isAdmin || isMe) && (
                          <button
                            onClick={() => handleDeleteMessage(msg.message_id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-600 transition-all ml-1"
                            title="Delete message"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Message Bubble */}
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-4 text-xs font-medium leading-relaxed shadow-sm ${
                          msg.is_announcement
                            ? 'bg-gradient-to-br from-[#542d87] to-slate-900 text-white border border-purple-700/50 shadow-purple-900/10'
                            : isMe
                            ? 'bg-[#542d87] text-white rounded-br-xs'
                            : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200/60'
                        }`}
                      >
                        {msg.title && (
                          <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-white/20 text-orange-300 font-black text-xs uppercase tracking-wider">
                            <Megaphone className="w-3.5 h-3.5 text-orange-400" />
                            {msg.title}
                          </div>
                        )}

                        <p className="whitespace-pre-wrap">{msg.content}</p>

                        {msg.attachment_url && (
                          <div className="mt-3 pt-2 border-t border-white/20 flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold underline flex items-center gap-1">
                              <Paperclip className="w-3 h-3" />
                              {msg.attachment_name || 'View Attachment'}
                            </span>
                            <a
                              href={msg.attachment_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded text-[10px] font-black transition-all"
                            >
                              Open
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            <div className="px-5 py-2 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2 overflow-x-auto custom-scrollbar">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">
                Quick Prompts:
              </span>
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => setMessageText(prompt)}
                  className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-[#542d87] hover:border-purple-300 text-[10px] font-bold whitespace-nowrap transition-all shadow-xs cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Composer Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
              {activeChannel === 'broadcast' && !isAdmin ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  This channel is reserved for official broadcasts from Arya Sonawane (Chairman), Balaji Survase (Secretary) & Karan Bodake (Treasurer).
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="space-y-3">
                  {isAdmin && (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="announcement-toggle"
                          checked={isAnnouncement}
                          onChange={(e) => setIsAnnouncement(e.target.checked)}
                          className="w-3.5 h-3.5 text-[#542d87] rounded border-slate-300 focus:ring-[#542d87] cursor-pointer"
                        />
                        <label htmlFor="announcement-toggle" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1">
                          <Megaphone className="w-3 h-3 text-[#542d87]" />
                          Send as Highlighted Admin Broadcast
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowAttachmentInput(!showAttachmentInput)}
                        className="text-xs font-bold text-slate-500 hover:text-[#542d87] flex items-center gap-1 cursor-pointer"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        {showAttachmentInput ? 'Hide Attachment' : 'Add Attachment URL'}
                      </button>
                    </div>
                  )}

                  {isAnnouncement && (
                    <input
                      type="text"
                      placeholder="Announcement Title (e.g. Lift Maintenance Inspection Complete)"
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#542d87]"
                    />
                  )}

                  {showAttachmentInput && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <input
                        type="url"
                        placeholder="Attachment URL (https://...)"
                        value={attachmentUrl}
                        onChange={(e) => setAttachmentUrl(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-[#542d87]"
                      />
                      <input
                        type="text"
                        placeholder="Attachment Label (e.g. Quotation.pdf)"
                        value={attachmentName}
                        onChange={(e) => setAttachmentName(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-[#542d87]"
                      />
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                      <textarea
                        rows={2}
                        placeholder={`Write message in ${currentChannelDef.name}... (Press Enter to send, Shift+Enter for line break)`}
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full p-3 pr-10 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-[#542d87] resize-none custom-scrollbar"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={sending || !messageText.trim()}
                      className="p-3 bg-[#542d87] hover:bg-[#462372] disabled:opacity-40 text-white rounded-2xl shadow-md shadow-purple-900/20 transition-all shrink-0 active:scale-95 cursor-pointer"
                      title="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: REQUESTS & SUPPORT TICKETS DASHBOARD */
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          {/* Dashboard Summary Counter Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#542d87] flex items-center justify-center font-black">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Requests</span>
                <h4 className="text-2xl font-black text-slate-900 font-mono mt-0.5">{tickets.length}</h4>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-black">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Open Tickets</span>
                <h4 className="text-2xl font-black text-slate-900 font-mono mt-0.5">{openTicketCount}</h4>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">In Progress</span>
                <h4 className="text-2xl font-black text-slate-900 font-mono mt-0.5">{inProgressTicketCount}</h4>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resolved / Closed</span>
                <h4 className="text-2xl font-black text-slate-900 font-mono mt-0.5">{resolvedTicketCount}</h4>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ticket #, subject, resident name, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-[#542d87] font-bold text-xs text-slate-800"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={ticketStatusFilter}
                onChange={(e) => setTicketStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-700 outline-none focus:ring-2 focus:ring-[#542d87] cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>

              <select
                value={ticketCategoryFilter}
                onChange={(e) => setTicketCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-700 outline-none focus:ring-2 focus:ring-[#542d87] cursor-pointer"
              >
                <option value="All">All Categories</option>
                <option value="Maintenance & Repairs">Maintenance & Repairs</option>
                <option value="Billing & Dues">Billing & Dues</option>
                <option value="Amenity & Clubhouse">Amenity & Clubhouse</option>
                <option value="Gate & Security">Gate & Security</option>
                <option value="General Feedback">General Feedback</option>
              </select>

              <select
                value={ticketPriorityFilter}
                onChange={(e) => setTicketPriorityFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-700 outline-none focus:ring-2 focus:ring-[#542d87] cursor-pointer"
              >
                <option value="All">All Priorities</option>
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Urgent">Urgent Priority</option>
              </select>
            </div>
          </div>

          {/* Split Layout: Ticket Management List + Selected Ticket Detail Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Tickets Table / Cards */}
            <div className={`${selectedTicket ? 'lg:col-span-5' : 'lg:col-span-12'} transition-all`}>
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#542d87]">
                    Support & Query Tickets ({filteredTickets.length})
                  </h3>
                  <span className="text-[11px] font-bold text-slate-400">
                    {isAdmin ? 'Master Admin Table' : 'My Requests'}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {filteredTickets.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                      <HelpCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-black text-slate-700">No requests found</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Try clearing filters or raise a new support ticket.</p>
                    </div>
                  ) : (
                    filteredTickets.map((t) => {
                      const isSelected = selectedTicket?.id === t.id;
                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTicket(t)}
                          className={`p-4 hover:bg-purple-50/40 transition-colors cursor-pointer flex flex-col gap-2 ${
                            isSelected ? 'bg-purple-50/80 border-l-4 border-l-[#542d87]' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-black text-purple-900">{t.ticket_no}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                              t.status === 'Open' ? 'bg-orange-100 text-orange-800' :
                              t.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                              t.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {t.status}
                            </span>
                          </div>

                          <h4 className="text-xs font-black text-slate-900 line-clamp-1">{t.subject}</h4>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1">
                            <span>{t.resident_name} (T-{t.tower}-{t.flat})</span>
                            <span className="font-bold text-[#542d87]">{t.category}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Dedicated Ticket Timeline & Reply Composer */}
            {selectedTicket && (
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden animate-in fade-in duration-150">
                {/* Header */}
                <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-black text-[#542d87] bg-purple-100 px-2.5 py-1 rounded-lg">
                        {selectedTicket.ticket_no}
                      </span>
                      <span className="ml-2 text-xs font-extrabold text-slate-500 uppercase">{selectedTicket.type} • {selectedTicket.category}</span>
                    </div>
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    {selectedTicket.subject}
                  </h3>

                  {/* Status Progress Bar */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80 text-xs font-bold">
                    <span className="text-slate-500">Status Flow:</span>
                    <div className="flex items-center gap-1.5">
                      {(['Open', 'In Progress', 'Resolved', 'Closed'] as const).map(st => (
                        <button
                          key={st}
                          disabled={!isAdmin}
                          onClick={() => handleUpdateTicketStatus(selectedTicket.id, st)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                            selectedTicket.status === st
                              ? 'bg-[#542d87] text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          } ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Timeline Messages */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[420px] custom-scrollbar bg-[#FAFAFC]">
                  {selectedTicket.replies.map((reply) => {
                    const isInternal = reply.is_internal_remark;
                    return (
                      <div
                        key={reply.id}
                        className={`p-4 rounded-2xl border shadow-2xs space-y-1.5 ${
                          isInternal 
                            ? 'bg-amber-50/80 border-amber-200 text-amber-900' 
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 border-b pb-2 border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs text-slate-900">{reply.sender_name}</span>
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-purple-100 text-[#542d87] uppercase">
                              {reply.sender_role}
                            </span>
                            {isInternal && (
                              <span className="text-[9px] font-black px-2 py-0.5 rounded bg-amber-500 text-white uppercase flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" /> Internal Remark
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {format(new Date(reply.created_at), 'dd MMM yyyy, HH:mm')}
                          </span>
                        </div>

                        <p className="text-xs leading-relaxed font-medium whitespace-pre-wrap">{reply.content}</p>

                        {reply.attachment_url && (
                          <div className="pt-2 flex items-center gap-2">
                            <Paperclip className="w-3.5 h-3.5 text-[#542d87]" />
                            <a
                              href={reply.attachment_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-bold text-[#542d87] hover:underline"
                            >
                              {reply.attachment_name || 'Attached File'}
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleAddReplyToTicket} className="p-4 bg-white border-t border-slate-200 space-y-3">
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="internal-remark-checkbox"
                        checked={isInternalRemark}
                        onChange={(e) => setIsInternalRemark(e.target.checked)}
                        className="w-3.5 h-3.5 text-[#542d87] rounded border-slate-300 focus:ring-[#542d87] cursor-pointer"
                      />
                      <label htmlFor="internal-remark-checkbox" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-600" />
                        Post as Internal Admin Note (Hidden from resident)
                      </label>
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    <textarea
                      rows={2}
                      placeholder="Write response or updates for this ticket..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-[#542d87] resize-none"
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim()}
                      className="px-5 py-3 bg-[#542d87] hover:bg-[#462372] disabled:opacity-40 text-white rounded-xl font-bold text-xs shadow-md transition-all shrink-0 cursor-pointer"
                    >
                      Reply
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RAISE SUPPORT TICKET MODAL */}
      {showRaiseTicketModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-[#542d87] text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">Submit Society Request / Query</h3>
                  <p className="text-purple-200 text-xs font-bold uppercase tracking-widest mt-0.5">
                    TowerTech Management Helpdesk
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRaiseTicketModal(false)}
                className="p-2 hover:bg-white/10 rounded-xl text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRaiseTicket} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</label>
                  <select
                    value={newTicketData.type}
                    onChange={(e) => setNewTicketData({ ...newTicketData, type: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#542d87]"
                  >
                    <option value="Query">Query</option>
                    <option value="Complaint">Complaint</option>
                    <option value="Suggestion">Suggestion</option>
                    <option value="Escalation">Escalation</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                  <select
                    value={newTicketData.category}
                    onChange={(e) => setNewTicketData({ ...newTicketData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#542d87]"
                  >
                    <option value="Maintenance & Repairs">Maintenance & Repairs</option>
                    <option value="Billing & Dues">Billing & Dues</option>
                    <option value="Amenity & Clubhouse">Amenity & Clubhouse</option>
                    <option value="Gate & Security">Gate & Security</option>
                    <option value="General Feedback">General Feedback</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</label>
                  <select
                    value={newTicketData.priority}
                    onChange={(e) => setNewTicketData({ ...newTicketData, priority: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#542d87]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="Summarize your request or query..."
                  value={newTicketData.subject}
                  onChange={(e) => setNewTicketData({ ...newTicketData, subject: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#542d87]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide comprehensive details for society administration..."
                  value={newTicketData.description}
                  onChange={(e) => setNewTicketData({ ...newTicketData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#542d87] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attachment URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newTicketData.attachment_url}
                    onChange={(e) => setNewTicketData({ ...newTicketData, attachment_url: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#542d87]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attachment Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Photo_Receipt.jpg"
                    value={newTicketData.attachment_name}
                    onChange={(e) => setNewTicketData({ ...newTicketData, attachment_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#542d87]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRaiseTicketModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-orange-600/20 cursor-pointer"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
