import React, { useState, useEffect, useRef, type FormEvent, type KeyboardEvent, type ChangeEvent } from 'react';
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
  FileText,
  Plus,
  Pin,
  MoreVertical,
  VolumeX,
  Volume2,
  Check,
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
    color: 'from-slate-700 to-slate-900',
    badge: 'Broadcast'
  },
  {
    id: 'general',
    name: 'Community Lounge',
    description: 'Open discussion forum for all society residents',
    icon: MessageSquare,
    color: 'from-slate-600 to-slate-800',
    badge: 'All Residents'
  },
  {
    id: 'maintenance',
    name: 'Maintenance & Facility Desk',
    description: 'Discussions on repairs, water, lifts, and utilities',
    icon: Wrench,
    color: 'from-slate-700 to-zinc-800',
    badge: 'Facility'
  },
  {
    id: 'committee',
    name: 'Managing Committee & RWA',
    description: 'Society decisions, AGM topics, and resident queries',
    icon: ShieldCheck,
    color: 'from-slate-800 to-zinc-900',
    badge: 'RWA'
  },
  {
    id: 'tower',
    name: 'Tower Resident Group',
    description: 'Localized tower discussions & neighborhood updates',
    icon: Building2,
    color: 'from-zinc-700 to-slate-900',
    badge: 'Tower'
  }
];

export default function CommunicationCenter({ user, onSwitchTab, onRefresh }: CommunicationCenterProps) {
  const isAdmin = user.role === 'admin' || Boolean('admin_id' in user && user.admin_id);
  const isSecurity = user.role === 'security';
  const currentUserId = ('admin_id' in user && user.admin_id) || ('resident_id' in user && user.resident_id) || ('security_id' in user && user.security_id) || ('id' in user && user.id) || '';
  
  const displayRole: string = String(('admin_role' in user && user.admin_role) || (user.role === 'admin' ? 'Chairman' : user.role === 'security' ? 'Security Guard' : 'Resident'));

  const [activeChannel, setActiveChannel] = useState<CommunicationChannel>('broadcast');
  const [messages, setMessages] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Composer state
  const [messageText, setMessageText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentType, setAttachmentType] = useState('');
  const [attachmentSize, setAttachmentSize] = useState<number | undefined>(undefined);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat Options State (Pinned, Muted, Info Modal, Menu)
  const [pinnedChannels, setPinnedChannels] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('towertech_pinned_channels') || '[]');
    } catch {
      return [];
    }
  });

  const [mutedChannels, setMutedChannels] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('towertech_muted_channels') || '[]');
    } catch {
      return [];
    }
  });

  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showChatInfoModal, setShowChatInfoModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  // File Upload Handler
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit.');
      return;
    }

    setUploadingFile(true);
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      setAttachmentUrl(res);
      setAttachmentName(file.name);
      setAttachmentType(file.type);
      setAttachmentSize(file.size);
      setUploadingFile(false);
      toast.success('File attached successfully');
    };
    reader.onerror = () => {
      setUploadingFile(false);
      toast.error('Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() && !attachmentUrl) return;

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
        content: messageText.trim() || '[Attachment]',
        attachment_url: attachmentUrl || undefined,
        attachment_name: attachmentName || undefined,
        society_id: user.society_id || 'GV2026'
      });

      setMessages(prev => [...prev, newMsg]);
      setMessageText('');
      setAttachmentUrl('');
      setAttachmentName('');
      setAttachmentType('');
      setAttachmentSize(undefined);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Message sent');
      if (onRefresh) onRefresh();
    } catch {
      toast.error('Failed to send message');
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

  // Chat Options Handlers
  const togglePinChannel = (chId: string) => {
    const updated = pinnedChannels.includes(chId)
      ? pinnedChannels.filter(id => id !== chId)
      : [...pinnedChannels, chId];
    setPinnedChannels(updated);
    localStorage.setItem('towertech_pinned_channels', JSON.stringify(updated));
    toast.success(pinnedChannels.includes(chId) ? 'Channel unpinned' : 'Channel pinned');
    setShowOptionsMenu(false);
  };

  const toggleMuteChannel = (chId: string) => {
    const updated = mutedChannels.includes(chId)
      ? mutedChannels.filter(id => id !== chId)
      : [...mutedChannels, chId];
    setMutedChannels(updated);
    localStorage.setItem('towertech_muted_channels', JSON.stringify(updated));
    toast.success(mutedChannels.includes(chId) ? 'Channel unmuted' : 'Channel muted');
    setShowOptionsMenu(false);
  };

  const handleDeleteChat = () => {
    setMessages([]);
    setShowDeleteConfirm(false);
    setShowOptionsMenu(false);
    toast.success('Chat history hidden from view');
  };

  const currentChannelDef = CHANNELS.find(c => c.id === activeChannel) || CHANNELS[0];
  const ChannelIcon = currentChannelDef.icon;

  const filteredMessages = messages.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.content.toLowerCase().includes(q) ||
      m.sender_name.toLowerCase().includes(q) ||
      (m.sender_flat && m.sender_flat.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full font-sans animate-in fade-in duration-200">
      {/* Top Main Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-[#EAE6DE] shadow-xs">
        <div className="flex flex-wrap items-center gap-2 bg-[#EAE6DE]/30 p-1.5 rounded-2xl border border-[#EAE6DE]">
          <button
            type="button"
            onClick={() => onSwitchTab && onSwitchTab('notices')}
            className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 hover:text-slate-900 hover:bg-white flex items-center gap-2 transition-all cursor-pointer"
          >
            <Megaphone className="w-4 h-4" />
            Notices
          </button>
          <button
            type="button"
            className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-[#226192] text-white shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#226192]/10 px-3.5 py-2 rounded-2xl border border-[#226192]/20 text-xs font-bold text-[#226192]">
            <Shield className="w-4 h-4 text-[#226192]" />
            <span>Role: <strong>{displayRole}</strong></span>
          </div>
        </div>
      </div>

      {/* CHAT VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[620px]">
        {/* CHANNELS SIDEBAR */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="bg-white p-4 rounded-3xl border border-[#EAE6DE] shadow-xs flex flex-col gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 py-1">
              Communication Channels
            </p>

            <div className="space-y-1.5">
              {CHANNELS.map((ch) => {
                const Icon = ch.icon;
                const isActive = activeChannel === ch.id;
                const isPinned = pinnedChannels.includes(ch.id);
                const isMuted = mutedChannels.includes(ch.id);

                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setActiveChannel(ch.id);
                      setSearchQuery('');
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3.5 relative group cursor-pointer ${
                      isActive
                        ? 'bg-[#226192]/10 border-[#226192]/30 shadow-xs'
                        : 'bg-white border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="p-2.5 rounded-xl text-white bg-slate-700 shrink-0 shadow-xs">
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className={`text-xs font-black truncate ${isActive ? 'text-[#226192]' : 'text-slate-800'}`}>
                          {ch.name}
                        </h4>
                        <div className="flex items-center gap-1">
                          {isPinned && <Pin className="w-3 h-3 text-[#226192] fill-[#226192]" />}
                          {isMuted && <VolumeX className="w-3 h-3 text-slate-400" />}
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {ch.badge}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 font-medium">
                        {ch.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* CHAT MESSAGES & COMPOSER AREA */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#EAE6DE] shadow-xs flex flex-col overflow-hidden">
          {/* Active Channel Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl text-white bg-slate-800">
                <ChannelIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  {currentChannelDef.name}
                  {pinnedChannels.includes(activeChannel) && <Pin className="w-3.5 h-3.5 text-[#226192] fill-[#226192]" />}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {currentChannelDef.description}
                </p>
              </div>
            </div>

            {/* In-chat Search & Three-dot menu */}
            <div className="flex items-center gap-2.5">
              <div className="relative w-full sm:w-52">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search in chat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-[#226192] placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Three-dot Options Menu Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                  className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors cursor-pointer"
                  title="Chat Options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {/* Dropdown Menu */}
                {showOptionsMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onClick={() => togglePinChannel(activeChannel)}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Pin className="w-3.5 h-3.5 text-[#226192]" />
                      <span>{pinnedChannels.includes(activeChannel) ? 'Unpin Chat' : 'Pin Chat'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowChatInfoModal(true);
                        setShowOptionsMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5 text-slate-500" />
                      <span>Chat Info</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleMuteChannel(activeChannel)}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      {mutedChannels.includes(activeChannel) ? <Volume2 className="w-3.5 h-3.5 text-slate-500" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{mutedChannels.includes(activeChannel) ? 'Unmute Chat' : 'Mute Chat'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        toast.success('All messages marked as read');
                        setShowOptionsMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Mark as Read</span>
                    </button>

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(true);
                        setShowOptionsMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Chat History</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[460px] min-h-[380px] custom-scrollbar bg-[#F8F9FA]">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center p-12 text-slate-400">
                <div className="w-8 h-8 border-3 border-[#226192] border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-xs font-bold uppercase tracking-wider">Loading conversation...</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-slate-200/70 flex items-center justify-center mb-3 text-slate-500">
                  <ChannelIcon className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-slate-700">No messages in this chat yet</h4>
                <p className="text-xs font-medium text-slate-400 max-w-xs mt-1">
                  Start the conversation or share updates with fellow residents below!
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
                        <span className="px-1.5 py-0.5 rounded bg-[#226192]/10 text-[#226192] text-[9px] font-black uppercase tracking-wider border border-[#226192]/20">
                          {msg.sender_role || 'Admin'}
                        </span>
                      )}
                      {msg.sender_flat && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600 text-[9px] font-bold">
                          Tower {msg.sender_tower || 'A'} • Flat {msg.sender_flat}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-medium">
                        {msg.created_at ? format(new Date(msg.created_at), 'HH:mm • dd MMM') : ''}
                      </span>

                      {(isAdmin || isMe) && (
                        <button
                          onClick={() => handleDeleteMessage(msg.message_id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-all ml-1 cursor-pointer"
                          title="Delete message"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Message Bubble with Refined Colors */}
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-4 text-xs font-medium leading-relaxed shadow-xs ${
                        isMe
                          ? 'bg-[#226192] text-white rounded-br-xs shadow-xs'
                          : 'bg-white text-slate-800 rounded-bl-xs border border-slate-200/90 shadow-xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>

                      {msg.attachment_url && (
                        <div className={`mt-3 pt-2.5 border-t ${isMe ? 'border-white/20' : 'border-slate-200/80'} flex items-center justify-between gap-3`}>
                          <div className="flex items-center gap-2 truncate">
                            <Paperclip className={`w-3.5 h-3.5 ${isMe ? 'text-white' : 'text-[#226192]'} shrink-0`} />
                            <span className={`font-bold underline truncate text-[11px] ${isMe ? 'text-white' : 'text-slate-800'}`}>
                              {msg.attachment_name || 'Attached File'}
                            </span>
                          </div>
                          <a
                            href={msg.attachment_url}
                            target="_blank"
                            rel="noreferrer"
                            className={`px-3 py-1 ${isMe ? 'bg-white text-[#226192] hover:bg-slate-100' : 'bg-[#226192] text-white hover:bg-[#1a4d75]'} text-[10px] font-black rounded-lg transition-all shrink-0`}
                          >
                            Open / Download
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

          {/* Composer Input Area with Media Upload */}
          <div className="p-4 bg-white border-t border-slate-200/80">
            {activeChannel === 'broadcast' && !isAdmin ? (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                This channel is reserved for official broadcasts from Society Administration.
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-3">
                {/* File Preview before sending */}
                {attachmentName && (
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-[#226192] shrink-0" />
                      <span className="font-bold text-slate-800 truncate">{attachmentName}</span>
                      {attachmentSize && (
                        <span className="text-[10px] text-slate-400">({(attachmentSize / 1024).toFixed(0)} KB)</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachmentUrl('');
                        setAttachmentName('');
                        setAttachmentType('');
                        setAttachmentSize(undefined);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="Remove attachment"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-end gap-2">
                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,.pdf"
                    className="hidden"
                  />

                  {/* Attachment Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-colors cursor-pointer shrink-0"
                    title="Upload image or PDF attachment"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <div className="flex-1 relative">
                    <textarea
                      rows={2}
                      placeholder={`Write message in ${currentChannelDef.name}... (Press Enter to send, Shift+Enter for line break)`}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:ring-1 focus:ring-[#226192] resize-none custom-scrollbar"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending || uploadingFile || (!messageText.trim() && !attachmentUrl)}
                    className="p-3 bg-[#226192] hover:bg-[#1a4d75] disabled:opacity-40 text-white rounded-2xl shadow-sm transition-all shrink-0 active:scale-95 cursor-pointer"
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

      {/* Chat Info Modal */}
      {showChatInfoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl text-white bg-slate-800">
                  <ChannelIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{currentChannelDef.name}</h3>
                  <p className="text-[11px] text-slate-500">Green Park Residency Chat</p>
                </div>
              </div>
              <button
                onClick={() => setShowChatInfoModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900">Description</p>
                <p className="text-slate-600">{currentChannelDef.description}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-900">Channel Type</span>
                <span className="px-2 py-0.5 rounded bg-[#226192]/10 text-[#226192] font-bold">Group Discussion</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-900">Total Participants</span>
                <span className="font-bold text-slate-800">124 Residents</span>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                onClick={() => setShowChatInfoModal(false)}
                className="px-5 py-2 bg-[#226192] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Chat Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900">Hide / Clear Chat History</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to clear the message history for this channel from your view? Other participants' records remain intact.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChat}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-sm cursor-pointer"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
