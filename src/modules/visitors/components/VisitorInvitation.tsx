import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Share2, 
  Copy, 
  Check, 
  QrCode, 
  X, 
  User, 
  Phone, 
  Car, 
  Users, 
  Sparkles, 
  XCircle,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { VisitorInvitation, VisitorCategory } from '../types/visitor';
import { visitorService } from '../services/visitorService';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface VisitorInvitationProps {
  resident: {
    resident_id: string;
    name: string;
    flat: string;
    tower: string;
  };
  onClose?: () => void;
  onInvitationCreated?: (invitation: VisitorInvitation) => void;
}

export default function VisitorInvitationComponent({
  resident,
  onClose,
  onInvitationCreated
}: VisitorInvitationProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [invitations, setInvitations] = useState<VisitorInvitation[]>([]);

  useEffect(() => {
    if (resident?.resident_id) {
      visitorService.getInvitations(resident.resident_id).then(setInvitations);
    }
  }, [resident?.resident_id]);

  // Form states
  const [visitorName, setVisitorName] = useState('');
  const [visitorMobile, setVisitorMobile] = useState('');
  const [category, setCategory] = useState<VisitorCategory>('guest');
  const [expectedDate, setExpectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [expectedTime, setExpectedTime] = useState('14:00');
  const [validHours, setValidHours] = useState('12');
  const [visitorCount, setVisitorCount] = useState(1);
  const [purpose, setPurpose] = useState('Family Dinner / Personal Visit');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [createdPass, setCreatedPass] = useState<VisitorInvitation | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !visitorMobile.trim()) {
      toast.error('Please enter visitor name and mobile number.');
      return;
    }

    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + (parseInt(validHours, 10) || 12));

    try {
      const newInv = await visitorService.createInvitation({
        visitor_name: visitorName.trim(),
        visitor_mobile: visitorMobile.trim(),
        category,
        resident_id: resident.resident_id,
        resident_name: resident.name,
        flat_number: resident.flat,
        tower: resident.tower,
        expected_date: expectedDate,
        expected_time: expectedTime,
        valid_until: expiryTime.toISOString(),
        visitor_count: visitorCount,
        purpose: purpose.trim(),
        vehicle_number: vehicleNumber.trim() || undefined
      });

      setCreatedPass(newInv);
      const updatedList = await visitorService.getInvitations(resident.resident_id);
      setInvitations(updatedList);
      toast.success(`Pre-approved invitation created for ${newInv.visitor_name}`);
      if (onInvitationCreated) {
        onInvitationCreated(newInv);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create invitation');
    }
  };

  const handleCancel = async (invitationId: string) => {
    await visitorService.cancelInvitation(invitationId);
    const updatedList = await visitorService.getInvitations(resident.resident_id);
    setInvitations(updatedList);
    toast.info('Invitation pass cancelled.');
  };

  const shareText = createdPass ? 
    `TowerTech Society Gate Pass - Green Park Residency\nGuest: ${createdPass.visitor_name}\nFlat: ${createdPass.tower}-${createdPass.flat_number}\nPass Code: ${createdPass.invitation_code}\nValid on: ${createdPass.expected_date}\nShow this QR/Code at Main Gate for direct entry.` : '';

  const handleCopyPass = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    toast.success('Invitation pass details copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden max-w-2xl mx-auto font-sans">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-[#321F5C] via-[#5D31C7] to-[#6339CA] text-white flex justify-between items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-black uppercase tracking-wider text-purple-200 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Pre-Approved Fast Pass</span>
          </div>
          <h3 className="text-xl font-black tracking-tight">Invite Visitor</h3>
          <p className="text-xs text-purple-200 font-medium">
            Flat {resident.flat} (T-{resident.tower}) · {resident.name}
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/15 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 px-6 pt-3 gap-4 text-xs font-black uppercase tracking-wider">
        <button
          type="button"
          onClick={() => {
            setActiveTab('create');
            setCreatedPass(null);
          }}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'create' ? 'border-[#6339CA] text-[#6339CA]' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Create New Pass
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'list' ? 'border-[#6339CA] text-[#6339CA]' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span>Active Passes</span>
          <span className="w-5 h-5 rounded-full bg-purple-100 text-[#6339CA] flex items-center justify-center text-[10px]">
            {invitations.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Create Pass / Generated Pass View */}
      {activeTab === 'create' && (
        createdPass ? (
          <div className="p-6 sm:p-8 space-y-6 text-center animate-in zoom-in-95 duration-150">
            {/* Visual Digital Pass Card */}
            <div className="bg-gradient-to-b from-purple-900 to-[#321F5C] text-white p-6 rounded-3xl shadow-xl border border-purple-800 space-y-4 max-w-sm mx-auto relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-200">
                    Digital Gate Pass
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  PRE-APPROVED
                </span>
              </div>

              {/* QR Code Graphic Simulation */}
              <div className="bg-white p-4 rounded-2xl shadow-inner w-44 h-44 mx-auto flex flex-col items-center justify-center relative">
                <QrCode className="w-32 h-32 text-slate-900" />
                <span className="text-[9px] font-mono font-black text-slate-600 mt-1 uppercase">
                  {createdPass.invitation_code}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-lg font-black text-white">{createdPass.visitor_name}</p>
                <p className="text-xs text-purple-200 font-bold">
                  Flat {createdPass.flat_number} (T-{createdPass.tower}) · Host: {createdPass.resident_name}
                </p>
                <p className="text-[10px] text-purple-300 font-medium">
                  Valid on {createdPass.expected_date} at {createdPass.expected_time}
                </p>
              </div>
            </div>

            {/* Sharing buttons */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleCopyPass}
                className="px-5 py-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#6339CA] border border-purple-200 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied Pass!' : 'Copy Pass Text'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreatedPass(null);
                  setVisitorName('');
                  setVisitorMobile('');
                }}
                className="px-5 py-3 rounded-xl bg-[#6339CA] hover:bg-[#5D31C7] text-white font-black text-xs uppercase tracking-wider shadow-md shadow-purple-500/20 transition-all cursor-pointer"
              >
                Create Another Pass
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs font-sans">
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
                    placeholder="e.g., Ananya Deshmukh"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#6339CA] focus:ring-2 focus:ring-purple-100 outline-none font-bold text-slate-900 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                  Visitor Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={visitorMobile}
                    onChange={(e) => setVisitorMobile(e.target.value)}
                    placeholder="e.g., 9876543210"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#6339CA] focus:ring-2 focus:ring-purple-100 outline-none font-bold text-slate-900 bg-slate-50/50 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as VisitorCategory)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-bold text-slate-800 outline-none"
                >
                  <option value="guest">Guest / Family</option>
                  <option value="delivery">Delivery</option>
                  <option value="cab">Cab</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="vendor">Vendor</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                  Expected Date *
                </label>
                <input
                  type="date"
                  required
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-bold text-slate-800 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                  Expected Time *
                </label>
                <input
                  type="time"
                  required
                  value={expectedTime}
                  onChange={(e) => setExpectedTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-bold text-slate-800 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                  Number of Visitors
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={visitorCount}
                  onChange={(e) => setVisitorCount(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-bold text-slate-800 outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                  Pass Validity
                </label>
                <select
                  value={validHours}
                  onChange={(e) => setValidHours(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-bold text-slate-800 outline-none"
                >
                  <option value="6">6 Hours</option>
                  <option value="12">12 Hours (Same Day)</option>
                  <option value="24">24 Hours</option>
                  <option value="48">48 Hours (Weekend)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                  Vehicle (Optional)
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. MH12AB1234"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-bold text-slate-800 outline-none font-mono uppercase"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                Purpose of Visit
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g., Birthday Celebration, Dinner, Document Sign"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-bold text-slate-800 outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-[#6339CA] hover:bg-[#5D31C7] text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-purple-500/20 transition-all cursor-pointer flex items-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                <span>Generate Fast Pass</span>
              </button>
            </div>
          </form>
        )
      )}

      {/* Tab 2: Existing Passes List */}
      {activeTab === 'list' && (
        <div className="p-6 space-y-3">
          {invitations.map((inv) => (
            <div key={inv.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#6339CA] flex items-center justify-center shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-sm">{inv.visitor_name}</span>
                    <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                      {inv.invitation_code}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {inv.category.toUpperCase()} · Valid on {inv.expected_date} · {inv.visitor_count} person(s)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                  inv.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {inv.status}
                </span>

                {inv.status === 'active' && (
                  <button
                    type="button"
                    onClick={() => handleCancel(inv.id)}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                    title="Cancel Invitation"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {invitations.length === 0 && (
            <div className="text-center py-8 text-slate-400 space-y-1">
              <QrCode className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-xs font-bold">No active visitor invitations.</p>
              <p className="text-[11px]">Generate a pass above to pre-authorize your guests.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
