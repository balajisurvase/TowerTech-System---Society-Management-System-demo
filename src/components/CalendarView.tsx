import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  Users, 
  Wrench, 
  PartyPopper, 
  ShieldAlert, 
  Info, 
  Megaphone, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  Eye, 
  Filter,
  CalendarDays,
  CalendarRange,
  ListTodo
} from 'lucide-react';
import { SocietyEvent, Notice, User, Resident } from '../types';
import { societyService } from '../lib/societyService';
import { toast } from 'sonner';
import { format, addMonths, subMonths, addWeeks, subWeeks, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, parseISO } from 'date-fns';

interface CalendarViewProps {
  user: User | Resident;
  notices: Notice[];
  onRefresh?: () => void;
  onViewNotice?: (notice: Notice) => void;
}

export default function CalendarView({ user, notices, onRefresh, onViewNotice }: CalendarViewProps) {
  const isAdmin = user.role === 'admin' || Boolean('admin_id' in user && user.admin_id);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month');
  const [events, setEvents] = useState<SocietyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selected Date for Day Details Sidebar / Modal
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDayModal, setShowDayModal] = useState(false);

  // Create / Edit Event Modal
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SocietyEvent | null>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    category: 'Meeting',
    description: '',
    event_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '10:00 AM',
    end_time: '11:30 AM'
  });

  // Selected Item for Details
  const [viewingEvent, setViewingEvent] = useState<SocietyEvent | null>(null);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await societyService.getEvents(user.society_id);
      setEvents(data);
    } catch {
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [user.society_id]);

  // Combine notices that have event_date with society events
  const noticeEvents: SocietyEvent[] = notices
    .filter(n => n.event_date)
    .map(n => ({
      event_id: `notice-evt-${n.notice_id}`,
      title: n.title,
      category: n.category || 'General',
      description: n.description,
      event_date: n.event_date!,
      start_time: n.start_time || '09:00 AM',
      end_time: n.end_time || '05:00 PM',
      posted_by: n.posted_by,
      society_id: n.society_id,
      notice_id: n.notice_id,
      created_at: n.created_at
    }));

  // Merge events and avoid duplicates if notice_id matches
  const allEvents = [...events];
  noticeEvents.forEach(ne => {
    if (!allEvents.some(e => e.notice_id === ne.notice_id || e.event_id === ne.event_id)) {
      allEvents.push(ne);
    }
  });

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Category Colors & Icons
  const getCategoryMeta = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'emergency':
      case 'security':
        return { icon: ShieldAlert, bg: 'bg-rose-500', text: 'text-rose-700', badge: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'maintenance':
      case 'repairs':
        return { icon: Wrench, bg: 'bg-amber-500', text: 'text-amber-700', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'event':
      case 'celebration':
        return { icon: PartyPopper, bg: 'bg-purple-500', text: 'text-purple-700', badge: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'meeting':
        return { icon: Users, bg: 'bg-indigo-600', text: 'text-indigo-700', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      default:
        return { icon: Megaphone, bg: 'bg-blue-600', text: 'text-blue-700', badge: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
  };

  // Event submission
  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title.trim() || !eventForm.event_date) {
      toast.error('Please provide event title and date');
      return;
    }

    try {
      if (editingEvent) {
        await societyService.updateEvent(editingEvent.event_id, {
          ...eventForm,
          society_id: user.society_id || 'GV2026'
        });
        toast.success('Calendar event updated successfully!');
      } else {
        await societyService.createEvent({
          ...eventForm,
          posted_by: user.name || 'Society Admin',
          society_id: user.society_id || 'GV2026'
        });
        toast.success('Calendar event created successfully!');
      }
      setShowEventModal(false);
      setEditingEvent(null);
      await loadEvents();
      if (onRefresh) onRefresh();
    } catch {
      toast.error('Failed to save event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!globalThis.confirm?.('Are you sure you want to delete this calendar event?')) return;
    try {
      await societyService.deleteEvent(eventId, user.society_id);
      toast.success('Event deleted');
      await loadEvents();
      if (onRefresh) onRefresh();
      setViewingEvent(null);
    } catch {
      toast.error('Failed to delete event');
    }
  };

  // Month days calculation
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Week days calculation
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Calendar Header Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={handlePrev}
              className="p-2 rounded-lg bg-white text-slate-700 hover:bg-slate-50 shadow-xs transition-all"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-4 py-2 rounded-lg bg-white text-slate-800 text-xs font-black uppercase tracking-wider hover:bg-slate-50 shadow-xs transition-all"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-lg bg-white text-slate-700 hover:bg-slate-50 shadow-xs transition-all"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>

        {/* View Mode & Admin Create Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                viewMode === 'month' ? 'bg-[#542d87] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                viewMode === 'week' ? 'bg-[#542d87] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              Week
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                viewMode === 'agenda' ? 'bg-[#542d87] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              Agenda
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                setEditingEvent(null);
                setEventForm({
                  title: '',
                  category: 'Meeting',
                  description: '',
                  event_date: format(new Date(), 'yyyy-MM-dd'),
                  start_time: '10:00 AM',
                  end_time: '11:30 AM'
                });
                setShowEventModal(true);
              }}
              className="px-5 py-2.5 bg-[#542d87] hover:bg-[#462372] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-purple-900/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Create Event
            </button>
          )}
        </div>
      </div>

      {/* Category Legend Bar */}
      <div className="bg-white p-3.5 px-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Event Categories:</span>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
            <span className="font-bold text-slate-700">Meeting</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span className="font-bold text-slate-700">Maintenance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-500"></span>
            <span className="font-bold text-slate-700">Celebration / Event</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
            <span className="font-bold text-slate-700">Emergency / Security</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600"></span>
            <span className="font-bold text-slate-700">General Notice</span>
          </div>
        </div>
      </div>

      {/* CALENDAR BODY */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm">
          <div className="w-10 h-10 border-4 border-[#542d87] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading calendar...</p>
        </div>
      ) : viewMode === 'month' ? (
        /* MONTH VIEW GRID */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 py-3">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 bg-slate-100/50">
            {monthDays.map((day, idx) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayEvents = allEvents.filter(e => e.event_date === dateStr);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedDate(day);
                    setShowDayModal(true);
                  }}
                  className={`min-h-[110px] sm:min-h-[130px] p-2 sm:p-3 bg-white flex flex-col justify-between transition-all hover:bg-slate-50/80 cursor-pointer group ${
                    !isCurrentMonth ? 'opacity-40 bg-slate-50/30' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                      isToday
                        ? 'bg-[#542d87] text-white shadow-md shadow-purple-900/30'
                        : 'text-slate-700 group-hover:bg-slate-100'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-purple-50 text-[#542d87]">
                        {dayEvents.length} event{dayEvents.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Event indicators list */}
                  <div className="space-y-1 mt-2 overflow-hidden flex-1">
                    {dayEvents.slice(0, 3).map((evt, eIdx) => {
                      const meta = getCategoryMeta(evt.category);
                      return (
                        <div
                          key={eIdx}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (evt.notice_id) {
                              const targetNotice = notices.find(n => n.notice_id === evt.notice_id);
                              if (targetNotice && onViewNotice) {
                                onViewNotice(targetNotice);
                              } else {
                                setViewingEvent(evt);
                              }
                            } else {
                              setViewingEvent(evt);
                            }
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold truncate flex items-center gap-1.5 shadow-2xs transition-all hover:scale-[1.01] ${meta.badge}`}
                          title={`${evt.title} (${evt.start_time || 'All Day'})`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.bg}`}></span>
                          <span className="truncate">{evt.title}</span>
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <p className="text-[10px] font-bold text-slate-400 pl-1">
                        +{dayEvents.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : viewMode === 'week' ? (
        /* WEEK VIEW */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {weekDays.map((day, idx) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayEvents = allEvents.filter(e => e.event_date === dateStr);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border flex flex-col gap-3 ${
                    isToday ? 'border-purple-300 bg-purple-50/30 ring-2 ring-purple-100' : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="border-b border-slate-200/80 pb-2 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{format(day, 'EEE')}</p>
                      <h4 className="text-base font-black text-slate-900">{format(day, 'dd MMM')}</h4>
                    </div>
                    {isToday && (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-[#542d87] text-white">Today</span>
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    {dayEvents.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4 text-center">No events scheduled</p>
                    ) : (
                      dayEvents.map((evt, eIdx) => {
                        const meta = getCategoryMeta(evt.category);
                        return (
                          <div
                            key={eIdx}
                            onClick={() => {
                              if (evt.notice_id) {
                                const targetNotice = notices.find(n => n.notice_id === evt.notice_id);
                                if (targetNotice && onViewNotice) {
                                  onViewNotice(targetNotice);
                                } else {
                                  setViewingEvent(evt);
                                }
                              } else {
                                setViewingEvent(evt);
                              }
                            }}
                            className={`p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all hover:shadow-md ${meta.badge}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`w-2 h-2 rounded-full ${meta.bg}`}></span>
                              <span className="uppercase text-[9px] font-black tracking-wider">{evt.category}</span>
                            </div>
                            <p className="font-black text-slate-900 line-clamp-2">{evt.title}</p>
                            {evt.start_time && (
                              <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                                <Clock className="w-3 h-3" />
                                {evt.start_time} - {evt.end_time || ''}
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* AGENDA / LIST VIEW */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
            Chronological Society Events & Notice Schedule
          </h3>

          <div className="space-y-3">
            {allEvents.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-medium">No upcoming society events found.</div>
            ) : (
              allEvents.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()).map((evt, idx) => {
                const meta = getCategoryMeta(evt.category);
                const Icon = meta.icon;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (evt.notice_id) {
                        const targetNotice = notices.find(n => n.notice_id === evt.notice_id);
                        if (targetNotice && onViewNotice) {
                          onViewNotice(targetNotice);
                        } else {
                          setViewingEvent(evt);
                        }
                      } else {
                        setViewingEvent(evt);
                      }
                    }}
                    className="p-4 rounded-2xl border border-slate-200/80 hover:border-purple-300 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer bg-white"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 ${meta.bg} shadow-sm`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${meta.badge}`}>
                            {evt.category}
                          </span>
                          {evt.notice_id && (
                            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[9px] font-black uppercase">
                              Linked Notice
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-black text-slate-900 leading-snug">{evt.title}</h4>
                        <p className="text-xs text-slate-500 font-medium line-clamp-1">{evt.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 self-end sm:self-center text-xs font-bold text-slate-600 shrink-0">
                      <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                        <CalendarDays className="w-3.5 h-3.5 text-[#542d87]" />
                        <span>{format(parseISO(evt.event_date), 'dd MMM yyyy')}</span>
                      </div>
                      {evt.start_time && (
                        <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{evt.start_time}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* DAY DETAILS MODAL */}
      {showDayModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-[#542d87] text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black tracking-tight">
                  Events on {format(selectedDate, 'dd MMMM yyyy')}
                </h3>
                <p className="text-purple-200 text-xs font-bold uppercase tracking-widest mt-0.5">
                  Society Schedule & Notices
                </p>
              </div>
              <button
                onClick={() => setShowDayModal(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {allEvents.filter(e => e.event_date === format(selectedDate, 'yyyy-MM-dd')).length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-medium">
                  No events or notices scheduled for this date.
                </div>
              ) : (
                allEvents.filter(e => e.event_date === format(selectedDate, 'yyyy-MM-dd')).map((evt, idx) => {
                  const meta = getCategoryMeta(evt.category);
                  const Icon = meta.icon;

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setShowDayModal(false);
                        if (evt.notice_id) {
                          const targetNotice = notices.find(n => n.notice_id === evt.notice_id);
                          if (targetNotice && onViewNotice) {
                            onViewNotice(targetNotice);
                          } else {
                            setViewingEvent(evt);
                          }
                        } else {
                          setViewingEvent(evt);
                        }
                      }}
                      className="p-4 rounded-2xl border border-slate-200/80 hover:border-purple-300 transition-all bg-slate-50/50 cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${meta.badge}`}>
                          {evt.category}
                        </span>
                        {evt.start_time && (
                          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {evt.start_time} - {evt.end_time || ''}
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-black text-slate-900">{evt.title}</h4>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{evt.description}</p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowDayModal(false)}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW EVENT DETAILS MODAL */}
      {viewingEvent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-[#542d87] text-white flex justify-between items-center">
              <div>
                <span className="px-2.5 py-0.5 rounded bg-white/20 text-white text-[10px] font-black uppercase tracking-wider">
                  {viewingEvent.category} Event
                </span>
                <h3 className="text-xl font-black tracking-tight mt-1">{viewingEvent.title}</h3>
              </div>
              <button
                onClick={() => setViewingEvent(null)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Date</span>
                  <span className="font-bold text-slate-800">{viewingEvent.event_date}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Time</span>
                  <span className="font-bold text-slate-800">{viewingEvent.start_time || 'All Day'} - {viewingEvent.end_time || ''}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Description</span>
                <p className="text-xs font-medium text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  {viewingEvent.description}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              {isAdmin && !viewingEvent.notice_id && (
                <button
                  onClick={() => handleDeleteEvent(viewingEvent.event_id)}
                  className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Event
                </button>
              )}
              <button
                onClick={() => setViewingEvent(null)}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-all ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT EVENT MODAL (ADMIN ONLY) */}
      {showEventModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-[#542d87] text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black tracking-tight">
                  {editingEvent ? 'Edit Calendar Event' : 'Create Society Event'}
                </h3>
                <p className="text-purple-200 text-xs font-bold uppercase tracking-widest mt-0.5">
                  Schedule meeting, maintenance, or celebration
                </p>
              </div>
              <button
                onClick={() => setShowEventModal(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEventSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quarterly RWA Meeting & Budget Review"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500 font-bold text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500 font-bold text-xs text-slate-800"
                  >
                    <option value="Meeting">Meeting</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Event">Celebration / Event</option>
                    <option value="Emergency">Emergency / Security</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Date *</label>
                  <input
                    type="date"
                    required
                    value={eventForm.event_date}
                    onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500 font-bold text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 10:00 AM"
                    value={eventForm.start_time}
                    onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500 font-bold text-xs text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 12:30 PM"
                    value={eventForm.end_time}
                    onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500 font-bold text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                <textarea
                  rows={4}
                  placeholder="Provide event details..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500 font-medium text-xs text-slate-800 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#542d87] text-white text-xs font-black uppercase tracking-wider hover:bg-[#462372] shadow-md shadow-purple-900/20 transition-all active:scale-95"
                >
                  {editingEvent ? 'Update Event' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
