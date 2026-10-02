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
  AlertCircle
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

export default function CommunicationCenter({ user, onSwitchTab, onRefresh }: CommunicationCenterProps) {
  const isAdmin = user.role === 'admin' || Boolean('admin_id' in user && user.admin_id);
  const currentUserId = ('admin_id' in user && user.admin_id) || ('resident_id' in user && user.resident_id) || ('id' in user && user.id) || '';

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

    // Check if channel is broadcast and user is not admin
    if (activeChannel === 'broadcast' && !isAdmin) {
      toast.error('Only Society Admins can post in the Official Announcements channel.');
      return;
    }

    setSending(true);
    try {
      const newMsg = await societyService.sendCommunication({
        channel: activeChannel,
        sender_id: currentUserId,
        sender_name: user.name || (isAdmin ? 'Society Admin' : 'Resident'),
        sender_role: user.role,
        sender_tower: user.tower,
        sender_flat: user.flat,
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
      toast.success('Message posted');
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

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Top Header Switcher: [ Notices ] [ Communication ] */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 w-fit">
          <button
            id="tab-notices"
            onClick={() => onSwitchTab && onSwitchTab('notices')}
            className="px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider text-slate-600 hover:text-slate-900 hover:bg-white/80 flex items-center gap-2 transition-all"
          >
            <Megaphone className="w-4 h-4" />
            Notices
          </button>
          <button
            id="tab-communication"
            className="px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider bg-indigo-600 text-white shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            Communication
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time Society Comm Hub</span>
        </div>
      </div>

      {/* Main Communication Grid: Channels Sidebar + Chat Stream */}
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
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3.5 relative group ${
                      isActive
                        ? 'bg-indigo-50/70 border-indigo-200/80 shadow-sm'
                        : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl text-white bg-gradient-to-br ${ch.color} shrink-0 shadow-sm`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className={`text-xs font-black truncate ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>
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

          {/* Quick Help Card */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-3xl shadow-md space-y-2">
            <div className="flex items-center gap-2 text-indigo-200 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Community Guidelines
            </div>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              Maintain courtesy and respect in all channels. For urgent maintenance escalations, contact the management desk directly.
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
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
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
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
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
                const isMsgAdmin = msg.sender_role === 'admin';

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
                        <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase tracking-wider">
                          Admin
                        </span>
                      )}
                      {msg.sender_flat && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-bold">
                          Flat {msg.sender_flat}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-medium">
                        {msg.created_at ? format(new Date(msg.created_at), 'HH:mm • dd MMM') : ''}
                      </span>

                      {/* Delete action (Admin or author) */}
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
                          ? 'bg-gradient-to-br from-indigo-900 to-slate-900 text-white border border-indigo-700/50 shadow-indigo-900/10'
                          : isMe
                          ? 'bg-indigo-600 text-white rounded-br-xs'
                          : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200/60'
                      }`}
                    >
                      {/* Announcement Title if present */}
                      {msg.title && (
                        <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-white/20 text-amber-300 font-black text-xs uppercase tracking-wider">
                          <Megaphone className="w-3.5 h-3.5" />
                          {msg.title}
                        </div>
                      )}

                      <p className="whitespace-pre-wrap">{msg.content}</p>

                      {/* Attachment in Message */}
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
              Quick:
            </span>
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => setMessageText(prompt)}
                className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 text-[10px] font-bold whitespace-nowrap transition-all shadow-xs"
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
                This channel is reserved for official admin announcements. You can chat in the Community Lounge or Maintenance desk.
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-3">
                {/* Admin Announcement options */}
                {isAdmin && (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="announcement-toggle"
                        checked={isAnnouncement}
                        onChange={(e) => setIsAnnouncement(e.target.checked)}
                        className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      />
                      <label htmlFor="announcement-toggle" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1">
                        <Megaphone className="w-3 h-3 text-indigo-600" />
                        Send as Highlighted Announcement
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAttachmentInput(!showAttachmentInput)}
                      className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      {showAttachmentInput ? 'Hide Attachment' : 'Add Attachment URL'}
                    </button>
                  </div>
                )}

                {/* Announcement Title if checked */}
                {isAnnouncement && (
                  <input
                    type="text"
                    placeholder="Announcement Title (e.g. Lift Service Completed)"
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}

                {/* Attachment Inputs */}
                {showAttachmentInput && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <input
                      type="url"
                      placeholder="Attachment URL (https://...)"
                      value={attachmentUrl}
                      onChange={(e) => setAttachmentUrl(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Attachment Label (e.g. Report.pdf)"
                      value={attachmentName}
                      onChange={(e) => setAttachmentName(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {/* Main text box & Send button */}
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      rows={2}
                      placeholder={`Write message in ${currentChannelDef.name}... (Enter to send, Shift+Enter for new line)`}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full p-3 pr-10 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 resize-none custom-scrollbar"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending || !messageText.trim()}
                    className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-2xl shadow-md shadow-indigo-600/20 transition-all shrink-0 active:scale-95"
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
    </div>
  );
}
