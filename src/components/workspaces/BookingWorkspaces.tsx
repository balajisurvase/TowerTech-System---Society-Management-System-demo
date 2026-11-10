import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  Check, 
  X, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  IndianRupee, 
  Layers,
  Building2,
  Trash2
} from 'lucide-react';
import { Booking, Amenity, User as UserType } from '../../types';
import { format } from 'date-fns';

// ============================================================================
// 1. BOOK AMENITY / ADD SERVICE WORKSPACE (FULL SCREEN)
// ============================================================================
interface BookAmenityWorkspaceProps {
  user: UserType;
  amenities: Amenity[];
  onBack: () => void;
  onSubmit: (bookingData: {
    amenity_name: string;
    amenity_type: string;
    event_name: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    time_slot: string;
    charges: number;
  }) => Promise<void>;
}

export function BookAmenityWorkspace({
  user,
  amenities,
  onBack,
  onSubmit
}: BookAmenityWorkspaceProps) {
  const defaultAmenity = amenities[0] || {
    id: '1',
    amenity_id: 'AM001',
    name: 'Clubhouse & Party Hall',
    description: 'Spacious air-conditioned hall for celebrations and gatherings',
    pricing: 2500,
    status: 'Available'
  };

  const [selectedAmenityId, setSelectedAmenityId] = useState<string>(defaultAmenity.id || '1');
  const [eventName, setEventName] = useState<string>('Family Gathering');
  const [bookingDate, setBookingDate] = useState<string>(
    format(new Date(Date.now() + 86400000), 'yyyy-MM-dd')
  );
  const [timeSlot, setTimeSlot] = useState<string>('Evening (04:00 PM - 08:00 PM)');
  const [submitting, setSubmitting] = useState(false);

  const selectedAmenity = amenities.find(a => (a.id === selectedAmenityId || a.amenity_id === selectedAmenityId)) || defaultAmenity;

  const timeSlots = [
    { label: 'Morning (08:00 AM - 12:00 PM)', start: '08:00', end: '12:00' },
    { label: 'Afternoon (12:00 PM - 04:00 PM)', start: '12:00', end: '16:00' },
    { label: 'Evening (04:00 PM - 08:00 PM)', start: '16:00', end: '20:00' },
    { label: 'Night (08:00 PM - 11:00 PM)', start: '20:00', end: '23:00' },
    { label: 'Full Day (09:00 AM - 09:00 PM)', start: '09:00', end: '21:00' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const slot = timeSlots.find(s => s.label === timeSlot) || timeSlots[2];
      await onSubmit({
        amenity_name: selectedAmenity.name,
        amenity_type: selectedAmenity.name.includes('Hall') ? 'Hall' : selectedAmenity.name.includes('Pool') ? 'Pool' : 'Sports',
        event_name: eventName,
        booking_date: bookingDate,
        start_time: slot.start,
        end_time: slot.end,
        time_slot: timeSlot,
        charges: Number((selectedAmenity as any).pricing || (selectedAmenity as any).charges) || 1500
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
            title="Back to Bookings"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-[#321F5C] tracking-tight">
                Book Society Amenity / Facility
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider bg-gold/10 text-gold border-gold/20">
                Reservation
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Reserve society facilities for events, personal celebrations, or sports.
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
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-[#FAA928] hover:bg-[#FBAE17] text-slate-950 font-bold transition-all shadow-md shadow-gold/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <span>Reserving...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Confirm Reservation</span>
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Facility Selection */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gold/10 text-gold flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#321F5C] uppercase tracking-wider">
                  Section 1: Select Facility
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Choose available society amenities</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Step 1 of 3</span>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {amenities.map(a => {
                const isSelected = selectedAmenity.id === a.id || selectedAmenity.amenity_id === a.amenity_id;
                return (
                  <div
                    key={a.id || a.amenity_id}
                    onClick={() => setSelectedAmenityId(a.id || a.amenity_id)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between h-32 ${
                      isSelected
                        ? 'border-gold bg-gold/5 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-black text-[#321F5C]">{a.name}</h4>
                        <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{a.description}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${
                        isSelected ? 'border-amber-600 bg-amber-600' : 'border-slate-300'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100/80">
                      <span className="text-xs font-mono font-black text-amber-700">₹{Number((a as any).pricing || a.charges || 0).toLocaleString('en-IN')} / slot</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Available</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION 2: Date & Slot */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#321F5C] uppercase tracking-wider">
                  Section 2: Booking Schedule & Event Particulars
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Select date and duration slot</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Step 2 of 3</span>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Reservation Date *</label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none text-xs font-bold text-slate-800 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Time Slot *</label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none text-xs font-bold text-slate-800 bg-white"
                >
                  {timeSlots.map(s => (
                    <option key={s.label} value={s.label}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Event / Purpose Name *</label>
              <input
                type="text"
                required
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g. Birthday Celebration, Society Committee Meeting, Yoga Workshop"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none text-xs font-bold text-slate-800 bg-white"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Cost Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <IndianRupee className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#321F5C] uppercase tracking-wider">
                  Section 3: Pricing Summary
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Charges and deposit details</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Step 3 of 3</span>
          </div>

          <div className="p-6">
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">Total Facility Charge</span>
                <h2 className="text-3xl font-black text-amber-950 font-mono mt-1">₹{Number((selectedAmenity as any).pricing || (selectedAmenity as any).charges || 1500).toLocaleString('en-IN')}</h2>
                <p className="text-xs text-amber-800/80 mt-0.5">
                  Includes housekeeping and maintenance for {timeSlot}
                </p>
              </div>
              <div className="text-xs text-slate-600 bg-white p-4 rounded-xl border border-amber-200 space-y-1">
                <p><strong>Resident:</strong> {user.name} (Tower {user.tower || 'A'}-{user.flat || '101'})</p>
                <p><strong>Status on submission:</strong> Pending Admin Approval</p>
              </div>
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
            <span>Back to Bookings</span>
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
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#FAA928] hover:bg-[#FBAE17] text-slate-950 font-bold transition-all shadow-md shadow-gold/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirm Reservation</span>
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
// 2. VIEW BOOKING WORKSPACE (FULL SCREEN)
// ============================================================================
interface ViewBookingWorkspaceProps {
  booking: Booking;
  isAdmin?: boolean;
  onBack: () => void;
  onUpdateStatus?: (bookingId: string, status: 'Approved' | 'Rejected', comment?: string) => Promise<void>;
}

export function ViewBookingWorkspace({
  booking,
  isAdmin = false,
  onBack,
  onUpdateStatus
}: ViewBookingWorkspaceProps) {
  const [comment, setComment] = useState(booking.admin_comment || '');
  const [updating, setUpdating] = useState(false);

  const handleAction = async (status: 'Approved' | 'Rejected') => {
    if (!onUpdateStatus) return;
    setUpdating(true);
    try {
      await onUpdateStatus(booking.booking_id || booking.id!, status, comment);
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
            title="Back to Bookings"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-[#321F5C] tracking-tight">
                Booking #{booking.booking_id}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${
                booking.status === 'Approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                booking.status === 'Rejected' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {booking.status}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              {booking.amenity_name} • Booked by {booking.name} (Tower {booking.tower}, Flat {booking.flat})
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
            Back to Bookings
          </button>

          {isAdmin && booking.status === 'Pending' && (
            <>
              <button
                type="button"
                onClick={() => handleAction('Approved')}
                disabled={updating}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>Approve Booking</span>
              </button>
              <button
                type="button"
                onClick={() => handleAction('Rejected')}
                disabled={updating}
                className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                <span>Reject</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Reservation Specifications
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 text-xs">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Facility / Amenity</p>
                <p className="font-black text-[#321F5C] mt-0.5 text-sm">{booking.amenity_name}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Event Purpose</p>
                <p className="font-bold text-slate-800 mt-0.5">{booking.event_name}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Reserved Date</p>
                <p className="font-bold text-slate-800 mt-0.5">{format(new Date(booking.booking_date), 'dd MMMM yyyy')}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Time Slot</p>
                <p className="font-bold text-slate-800 mt-0.5">{booking.time_slot || `${booking.start_time} - ${booking.end_time}`}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Booking Charges</p>
                <p className="font-mono font-black text-amber-700 mt-0.5">₹{Number(booking.charges).toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Booking Status</p>
                <p className={`font-bold mt-0.5 ${booking.status === 'Approved' ? 'text-emerald-600' : booking.status === 'Rejected' ? 'text-rose-600' : 'text-amber-600'}`}>
                  {booking.status}
                </p>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Admin Remarks / Instruction for Resident
              </h3>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add special instructions, security deposit terms, or gate pass requirements..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none text-xs text-slate-800 bg-white"
              />
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Resident Information
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Resident:</span>
                <span className="font-bold text-slate-800">{booking.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Unit:</span>
                <span className="font-bold text-slate-800">Tower {booking.tower}, Flat {booking.flat}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Resident ID:</span>
                <span className="font-mono font-bold text-slate-800">{booking.resident_id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
