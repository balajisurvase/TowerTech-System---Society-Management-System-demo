import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Resident, Booking, Amenity } from '../types';
import { societyService } from '../lib/societyService';
import { format } from 'date-fns';

interface AmenityBookingProps {
  resident: Resident;
  onRefresh: () => void;
}

export default function AmenityBooking({ resident, onRefresh }: AmenityBookingProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [amenitiesList, setAmenitiesList] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    amenity_name: '',
    event_name: '',
    booking_date: '',
    start_time: '18:00',
    end_time: '22:00'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsData, amenitiesData] = await Promise.all([
        societyService.getResidentBookings(resident.resident_id),
        societyService.getAmenities(resident.society_id)
      ]);
      setBookings((bookingsData || []).sort((a, b) => {
        const idA = String(a.booking_id || a.id || '');
        const idB = String(b.booking_id || b.id || '');
        const idCompare = idB.localeCompare(idA, undefined, { numeric: true });
        if (idCompare !== 0) return idCompare;

        const dateA = new Date(a.booking_date || a.created_at || 0).getTime();
        const dateB = new Date(b.booking_date || b.created_at || 0).getTime();
        return dateB - dateA;
      }));
      setAmenitiesList(amenitiesData);
      
      if (amenitiesData.length > 0 && !formData.amenity_name) {
        setFormData(prev => ({ ...prev, amenity_name: amenitiesData[0].name }));
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [resident.resident_id, resident.society_id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateHours = () => {
    if (!formData.start_time || !formData.end_time) return 0;
    const start = new Date(`2000-01-01T${formData.start_time}`);
    const end = new Date(`2000-01-01T${formData.end_time}`);
    let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (diff < 0) diff += 24;
    return diff;
  };

  const getCharges = () => {
    const selectedAmenity = amenitiesList.find(a => a.name === formData.amenity_name);
    if (!selectedAmenity) return { base: 0, extra: 0, total: 0, hours: 0 };

    const hours = calculateHours();
    const baseHours = selectedAmenity.base_hours || 4;
    const basePrice = selectedAmenity.price;
    const extraCharge = selectedAmenity.extra_hour_charge || 0;

    let total = basePrice;
    if (hours > baseHours) {
      total += Math.ceil(hours - baseHours) * extraCharge;
    }

    return {
      base: basePrice,
      extra: extraCharge,
      total: total,
      hours: hours
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!formData.event_name || !formData.booking_date || !formData.start_time || !formData.end_time) {
      toast.error('Please fill in all fields');
      return;
    }

    const selectedAmenity = amenitiesList.find(a => a.name === formData.amenity_name);
    if (!selectedAmenity) return;

    // Check for slot conflicts
    const formatTime = (time: string) => {
      const [h, m] = time.split(':');
      const hour = parseInt(h);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${m} ${ampm}`;
    };

    const newStartTime = formatTime(formData.start_time);
    const newEndTime = formatTime(formData.end_time);

    const conflict = bookings.find(b => 
      b.amenity_name === formData.amenity_name && 
      b.booking_date === formData.booking_date &&
      b.status !== 'Rejected' &&
      ((newStartTime >= b.start_time && newStartTime < b.end_time) ||
       (newEndTime > b.start_time && newEndTime <= b.end_time) ||
       (newStartTime <= b.start_time && newEndTime >= b.end_time))
    );

    if (conflict) {
      toast.error('This slot is already booked for the selected amenity. Please choose another time.');
      return;
    }

    setSubmitting(true);
    try {
      const { total } = getCharges();
      
      await societyService.addBooking({
        resident_id: resident.resident_id,
        name: resident.name,
        tower: resident.tower,
        flat: resident.flat,
        amenity_name: formData.amenity_name,
        amenity_type: selectedAmenity.description || 'Amenity',
        event_name: formData.event_name,
        booking_date: formData.booking_date,
        start_time: newStartTime,
        end_time: newEndTime,
        charges: total,
        status: 'Pending',
        society_id: resident.society_id
      });

      setSuccessMessage('Booking request submitted successfully!');
      setShowSuccessModal(true);
      setFormData(prev => ({
        ...prev,
        event_name: '',
        booking_date: '',
      }));
      fetchData();
      onRefresh();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error: any) {
      toast.error('Booking failed: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const charges = getCharges();

  return (
    <div className="flex flex-col gap-3 h-full max-h-[calc(100vh-5.5rem)]">
      {/* Header Bar */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-base lg:text-lg font-black text-slate-900 leading-tight">Amenity Bookings</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Book and track society amenities in real-time</p>
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Booking Successful!</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Your request for {formData.amenity_name || 'the amenity'} has been submitted and is pending approval.</p>
              </div>
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-emerald-600 text-white font-black py-2.5 rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 uppercase tracking-widest text-xs"
              >
                Great, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Single-Frame 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        {/* Left Column: Compact Reservation Form */}
        <div className="lg:col-span-6 xl:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 flex justify-between items-center shrink-0 bg-slate-50/50">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">New Reservation</h3>
              <p className="text-[10px] text-slate-500 font-medium">Select amenity & reserve slot</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black border border-indigo-100">
              <span>{resident.name}</span>
              <span className="text-indigo-300">•</span>
              <span>{resident.tower}-{resident.flat}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-3.5 flex-1 flex flex-col justify-between gap-2.5 overflow-y-auto custom-scrollbar">
            {/* Form Fields Grid */}
            <div className="space-y-2.5">
              {/* Row 1: Select Amenity */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Select Amenity</label>
                <div className="relative">
                  <select
                    name="amenity_name"
                    value={formData.amenity_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none transition-all font-bold text-xs text-slate-800 appearance-none bg-slate-50/80 cursor-pointer"
                  >
                    {amenitiesList.map(a => (
                      <option key={a.amenity_id} value={a.name}>{a.name} ({a.description || 'Amenity'})</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                  </div>
                </div>
              </div>

              {/* Row 2: Event Name & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Event / Purpose</label>
                  <input
                    type="text"
                    name="event_name"
                    value={formData.event_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Birthday Party"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none transition-all font-bold text-xs text-slate-800 bg-slate-50/80"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Booking Date</label>
                  <input
                    type="date"
                    name="booking_date"
                    value={formData.booking_date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none transition-all font-bold text-xs text-slate-800 bg-slate-50/80"
                  />
                </div>
              </div>

              {/* Row 3: Start & End Time */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Start Time</label>
                  <input
                    type="time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none transition-all font-bold text-xs text-slate-800 bg-slate-50/80"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">End Time</label>
                  <input
                    type="time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none transition-all font-bold text-xs text-slate-800 bg-slate-50/80"
                  />
                </div>
              </div>
            </div>

            {/* Compact Pricing Calculation & Summary Card */}
            <div className="bg-indigo-50/70 rounded-xl p-2.5 border border-indigo-100/80 space-y-1.5">
              <div className="grid grid-cols-3 gap-1 text-[11px]">
                <div className="bg-white/80 p-1.5 rounded-lg text-center border border-indigo-100/50">
                  <span className="text-[9px] font-black text-slate-400 uppercase block">Duration</span>
                  <span className="font-black text-slate-800">{charges.hours}h</span>
                </div>
                <div className="bg-white/80 p-1.5 rounded-lg text-center border border-indigo-100/50">
                  <span className="text-[9px] font-black text-slate-400 uppercase block">Base Fee</span>
                  <span className="font-black text-slate-800">₹{charges.base}</span>
                </div>
                <div className="bg-white/80 p-1.5 rounded-lg text-center border border-indigo-100/50">
                  <span className="text-[9px] font-black text-slate-400 uppercase block">Extra Rate</span>
                  <span className="font-black text-slate-800">₹{charges.extra}/h</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-indigo-100/80 px-1">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Total Charges:</span>
                <span className="text-base font-black text-indigo-600">₹{charges.total}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-black py-2.5 rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs shrink-0 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  SUBMITTING...
                </>
              ) : (
                'Confirm & Book Slot'
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Booking History & Rules in One Frame */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col gap-3 min-h-0">
          {/* Booking History Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 flex justify-between items-center shrink-0 bg-slate-50/50">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">My Booking History</h3>
                <p className="text-[10px] text-slate-500 font-medium">Track your reservations</p>
              </div>
              <span className="text-[10px] font-bold text-slate-400">{bookings.length} Total</span>
            </div>

            <div className="overflow-y-auto flex-1 min-h-0 custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-wider sticky top-0 border-b border-slate-100">
                  <tr>
                    <th className="px-3.5 py-2">ID</th>
                    <th className="px-3.5 py-2">Amenity</th>
                    <th className="px-3.5 py-2">Date & Time</th>
                    <th className="px-3.5 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center">
                        <div className="flex justify-center items-center gap-2 text-indigo-600">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span className="font-bold text-xs">Loading bookings...</span>
                        </div>
                      </td>
                    </tr>
                  ) : bookings.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400 font-bold text-xs">
                        No previous bookings found.
                      </td>
                    </tr>
                  ) : (
                    bookings.map((b) => (
                      <tr key={b.id || b.booking_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3.5 py-2 font-black text-indigo-600 text-[11px]">
                          {(b.booking_id || '').slice(0, 7)}
                        </td>
                        <td className="px-3.5 py-2">
                          <p className="font-bold text-slate-800 text-xs leading-tight">{b.amenity_name}</p>
                          <p className="text-[9px] text-slate-400 font-medium truncate max-w-[140px]">{b.event_name || b.amenity_type}</p>
                        </td>
                        <td className="px-3.5 py-2">
                          <div className="flex items-center gap-1.5 text-slate-800 font-bold text-[11px]">
                            <Calendar className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span>{format(new Date(b.booking_date), 'dd MMM yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[10px]">
                            <Clock className="w-2.5 h-2.5 shrink-0" />
                            <span>{b.time_slot || `${b.start_time} - ${b.end_time}`}</span>
                          </div>
                        </td>
                        <td className="px-3.5 py-2">
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase inline-block ${
                            b.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 
                            b.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {b.status || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Compact Booking Rules Widget */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 shrink-0">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
              <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Booking Guidelines</h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-600 font-medium">
              <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                <span className="font-black text-indigo-600 mr-1">1.</span>
                Book ≥ 1 day ahead
              </div>
              <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                <span className="font-black text-indigo-600 mr-1">2.</span>
                Max 8h per session
              </div>
              <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                <span className="font-black text-indigo-600 mr-1">3.</span>
                Extra rate past base
              </div>
              <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                <span className="font-black text-indigo-600 mr-1">4.</span>
                Admin approval req.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
