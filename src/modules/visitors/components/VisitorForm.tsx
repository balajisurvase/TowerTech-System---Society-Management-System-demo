import React, { useState, useEffect } from 'react';
import { 
  User, 
  Phone, 
  Building2, 
  Car, 
  Users, 
  Clock, 
  Shield, 
  CheckCircle2, 
  X, 
  Camera, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { VisitorCategory, VisitorGate, FlatWithResident } from '../types/visitor';
import { visitorService } from '../services/visitorService';
import { uploadVisitorPhoto } from '../services/visitorPhotoService';
import VisitorPhotoCaptureModal from './VisitorPhotoCaptureModal';
import { toast } from 'sonner';

interface VisitorFormProps {
  onSuccess: (newVisitor: any) => void;
  onCancel: () => void;
  securityUser: {
    name: string;
    phone?: string;
    shift?: string;
    gate_name?: string;
  };
}

export default function VisitorForm({ onSuccess, onCancel, securityUser }: VisitorFormProps) {
  const [flats, setFlats] = useState<FlatWithResident[]>([]);
  const [gates, setGates] = useState<VisitorGate[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form states
  const [visitorName, setVisitorName] = useState('');
  const [visitorMobile, setVisitorMobile] = useState('');
  const [category, setCategory] = useState<VisitorCategory>('guest');
  const [selectedFlatId, setSelectedFlatId] = useState('');
  const [selectedResident, setSelectedResident] = useState<FlatWithResident | null>(null);
  const [purpose, setPurpose] = useState('');
  const [visitorCount, setVisitorCount] = useState<number>(1);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [selectedGate, setSelectedGate] = useState('Main Gate');
  const [expectedDuration, setExpectedDuration] = useState('2 hours');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Success summary modal
  const [createdSummary, setCreatedSummary] = useState<any | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [flatsData, gatesData] = await Promise.all([
          visitorService.getFlatsWithResidents(),
          visitorService.getGates()
        ]);
        setFlats(flatsData);
        setGates(gatesData);
        if (gatesData.length > 0) {
          setSelectedGate(gatesData[0].gate_name);
        }
        if (flatsData.length > 0) {
          // Pre-select first valid flat
          setSelectedFlatId(flatsData[0].flat_id);
          setSelectedResident(flatsData[0]);
        }
      } catch (err) {
        console.warn('Failed to load flats and gates:', err);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadData();
  }, []);

  // Handle Dynamic Flat Selection
  const handleFlatChange = (flatId: string) => {
    setSelectedFlatId(flatId);
    const found = flats.find(f => f.flat_id === flatId);
    setSelectedResident(found || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validations
    if (!visitorName.trim()) {
      setErrorMessage('Please enter visitor full name.');
      return;
    }
    if (!visitorMobile.trim() || visitorMobile.trim().length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!selectedResident) {
      setErrorMessage('Please select a valid destination flat with an authorized resident.');
      return;
    }
    if (!purpose.trim()) {
      setErrorMessage('Please specify the purpose of the visit.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Process & Upload captured live photo if present
      let profilePhotoUrl: string | undefined = undefined;
      if (capturedPhoto) {
        setUploadingPhoto(true);
        const uploadResult = await uploadVisitorPhoto(capturedPhoto, visitorName.trim());
        if (uploadResult.success && uploadResult.url) {
          profilePhotoUrl = uploadResult.url;
        } else if (uploadResult.error) {
          console.warn('Photo upload warning:', uploadResult.error);
        }
      }

      // 2. Submit visitor request to database
      const result = await visitorService.createVisitorRequest({
        visitor_name: visitorName.trim(),
        visitor_mobile: visitorMobile.trim(),
        category,
        resident_id: selectedResident.resident_id,
        resident_name: selectedResident.resident_name,
        flat_number: selectedResident.flat_number,
        tower: selectedResident.tower,
        purpose: purpose.trim(),
        visitor_count: visitorCount,
        vehicle_number: vehicleNumber.trim() || undefined,
        profile_photo: profilePhotoUrl,
        gate_name: selectedGate,
        expected_duration: expectedDuration,
        security_user_name: securityUser.name,
        security_user_mobile: securityUser.phone,
        security_user_shift: securityUser.shift || 'Morning'
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Database registration failed.');
      }

      toast.success('Visitor request successfully submitted.', {
        description: `Visitor ID #${result.data.visitor_id} · Awaiting approval from ${selectedResident.resident_name}`
      });

      setCreatedSummary(result.data);
    } catch (err: any) {
      console.warn('Submit warning:', err);
      setErrorMessage(err?.message || 'Failed to submit visitor request. Please check database connection.');
    } finally {
      setSubmitting(false);
      setUploadingPhoto(false);
    }
  };

  if (createdSummary) {
    return (
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl max-w-xl mx-auto space-y-6 text-center animate-in zoom-in-95 duration-150">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
            Request Pending Resident Approval
          </span>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight pt-2">
            Visitor Request Successfully Submitted
          </h3>
          <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
            The resident has received an instant notification to authorize entry. The record has been created in the database.
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-left space-y-2">
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-400 font-bold">Visitor ID:</span>
            <span className="font-mono font-black text-[#6339CA]">#{createdSummary.visitor_id}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-400 font-bold">Visitor Name:</span>
            <span className="font-black text-slate-900">{createdSummary.visitor_name}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-400 font-bold">Visiting Flat:</span>
            <span className="font-bold text-slate-800">Flat {createdSummary.flat_number} (T-{createdSummary.tower})</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-400 font-bold">Host Resident:</span>
            <span className="font-bold text-slate-800">{createdSummary.resident_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-bold">Actual Database Status:</span>
            <span className="font-black text-amber-600 uppercase">PENDING APPROVAL</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSuccess(createdSummary)}
          className="w-full py-3.5 bg-[#6339CA] hover:bg-[#5D31C7] text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
        >
          Done & Return to Gate Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden max-w-2xl mx-auto">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-[#321F5C] via-[#5D31C7] to-[#6339CA] text-white flex justify-between items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-black uppercase tracking-wider text-purple-200 mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Security Gate Registration</span>
          </div>
          <h3 className="text-xl font-black tracking-tight">Register New Visitor</h3>
          <p className="text-xs text-purple-200 font-medium">
            Gate: {selectedGate} · Guard: {securityUser.name}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 text-white/80 hover:text-white hover:bg-white/15 rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-sans">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-2 font-bold animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Visitor Details: Name & Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
              Visitor Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="e.g., Karan Patil"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#6339CA] focus:ring-2 focus:ring-purple-100 outline-none font-bold text-slate-900 bg-slate-50/50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
              Mobile Number *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                value={visitorMobile}
                onChange={(e) => setVisitorMobile(e.target.value)}
                placeholder="e.g., 9000000010"
                maxLength={10}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#6339CA] focus:ring-2 focus:ring-purple-100 outline-none font-bold text-slate-900 bg-slate-50/50 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Visitor Category & Number of Visitors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
              Visitor Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as VisitorCategory)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#6339CA] focus:ring-2 focus:ring-purple-100 outline-none font-bold text-slate-900 bg-slate-50/50 uppercase text-xs"
            >
              <option value="guest">Guest</option>
              <option value="delivery">Delivery (Amazon, Swiggy, etc.)</option>
              <option value="cab">Cab (Uber, Ola)</option>
              <option value="maintenance">Maintenance / Technician</option>
              <option value="vendor">Vendor / Contractor</option>
              <option value="domestic_help">Domestic Help / Maid</option>
              <option value="other">Other Visit</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
              Number of Visitors *
            </label>
            <div className="relative">
              <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min={1}
                max={20}
                value={visitorCount}
                onChange={(e) => setVisitorCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#6339CA] focus:ring-2 focus:ring-purple-100 outline-none font-bold text-slate-900 bg-slate-50/50 font-mono"
              />
            </div>
          </div>
        </div>

        {/* LIVE VISITOR PHOTO CAPTURE SECTION */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-white border border-purple-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-[#6339CA] uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-amber-500" />
              <span>Live Visitor Photo Verification</span>
            </span>
            <span className="text-[10px] font-bold text-slate-500">Security Requirement</span>
          </div>

          {capturedPhoto ? (
            <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-purple-200">
              <div className="flex items-center gap-3">
                <img 
                  src={capturedPhoto} 
                  alt="Captured visitor" 
                  className="w-14 h-14 rounded-xl object-cover border-2 border-emerald-400 shadow-sm"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-black text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Live Photo Attached</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    Will be uploaded securely to Supabase Storage & sent to resident
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCameraModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-[#6339CA] font-bold text-xs transition-colors cursor-pointer border border-purple-200"
                >
                  Retake Photo
                </button>
                <button
                  type="button"
                  onClick={() => setCapturedPhoto(null)}
                  className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Remove Photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/80 p-3 rounded-xl border border-dashed border-purple-300">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-100/70 text-[#6339CA] flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">No Photo Captured Yet</p>
                  <p className="text-[11px] text-slate-500">
                    Capture visitor's face directly using webcam/device camera
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCameraModal(true)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-[#6339CA] to-[#5229AB] hover:from-[#5229AB] hover:to-[#3e1f86] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <Camera className="w-4 h-4 text-amber-300" />
                <span>Capture Live Photo</span>
              </button>
            </div>
          )}
        </div>

        {/* DYNAMIC FLAT SELECTION & AUTHORIZED RESIDENT */}
        <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-[#6339CA] uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Dynamic Destination Flat Selection</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400">{flats.length} Flats Active</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                Select Destination Flat *
              </label>
              <select
                value={selectedFlatId}
                onChange={(e) => handleFlatChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-black text-xs text-purple-900 outline-none focus:ring-2 focus:ring-purple-300"
              >
                {flats.map((f) => (
                  <option key={f.flat_id} value={f.flat_id}>
                    Flat {f.flat_number} (Tower {f.tower}) · {f.resident_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                Authorized Resident (Retrieved from Supabase)
              </label>
              <div className="px-3 py-2 rounded-xl bg-white border border-purple-200 flex items-center justify-between">
                <div>
                  <p className="font-black text-xs text-slate-900">
                    {selectedResident?.resident_name || 'No Resident Found'}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 font-mono">
                    ID: {selectedResident?.resident_id} · {selectedResident?.role}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                  Verified
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Purpose of Visit & Vehicle Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
              Purpose of Visit *
            </label>
            <input
              type="text"
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g., Personal Visit, Package Delivery, AC Repair"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#6339CA] focus:ring-2 focus:ring-purple-100 outline-none font-bold text-slate-900 bg-slate-50/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
              Vehicle Number (Optional)
            </label>
            <div className="relative">
              <Car className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                placeholder="e.g., MH12KP2026"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#6339CA] focus:ring-2 focus:ring-purple-100 outline-none font-bold text-slate-900 bg-slate-50/50 font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* Entry Gate & Expected Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
              Entry Gate *
            </label>
            <select
              value={selectedGate}
              onChange={(e) => setSelectedGate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#6339CA] outline-none font-bold text-slate-900 bg-slate-50/50"
            >
              {gates.map((g) => (
                <option key={g.id} value={g.gate_name}>
                  {g.gate_name} ({g.gate_code})
                </option>
              ))}
              {gates.length === 0 && <option value="Main Gate">Main Gate</option>}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
              Expected Duration
            </label>
            <select
              value={expectedDuration}
              onChange={(e) => setExpectedDuration(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#6339CA] outline-none font-bold text-slate-900 bg-slate-50/50"
            >
              <option value="15-30 mins">15 - 30 mins (Quick Delivery/Drop)</option>
              <option value="1-2 hours">1 - 2 hours (Standard Visit)</option>
              <option value="Half Day">Half Day (3 - 5 hours)</option>
              <option value="Full Day">Full Day</option>
              <option value="Overnight Stay">Overnight Stay</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting || loadingInitial}
            className="px-6 py-3 rounded-xl bg-[#6339CA] hover:bg-[#5D31C7] active:scale-[0.98] disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Submitting to Database...</span>
              </>
            ) : (
              <>
                <span>Submit Visitor Request</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Live Webcam & Camera Capture Modal */}
      <VisitorPhotoCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={(photoDataUrl) => {
          setCapturedPhoto(photoDataUrl);
          toast.success('Live photo captured successfully');
        }}
        visitorName={visitorName || 'Visitor'}
      />
    </div>
  );
}
