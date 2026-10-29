import React, { useState } from 'react';
import { 
  Building2, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  X, 
  UserPlus, 
  Lock, 
  Mail, 
  ArrowRight, 
  Check, 
  CreditCard, 
  Shield, 
  Megaphone, 
  MessageSquare, 
  Sparkles 
} from 'lucide-react';
import { User } from '../types';
import { societyService } from '../lib/societyService';
import RegisterSociety from './RegisterSociety';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [view, setView] = useState<'login' | 'register'>('login');
  const [loginId, setLoginId] = useState('');
  const [societyId, setSocietyId] = useState('GV2026');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState({ text: '', type: '' });

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage({ text: '', type: '' });

    try {
      const res = await societyService.resetPassword(resetEmail);
      setResetMessage({ text: res.message || 'Password reset link sent to your email.', type: 'success' });
      setResetEmail('');
    } catch (err: any) {
      const msg = String(err?.message || '').toLowerCase();
      if (msg.includes('rate') || msg.includes('limit') || msg.includes('exceeded')) {
        setResetMessage({ text: 'A reset link was recently requested. Please check your inbox or try again shortly.', type: 'success' });
      } else {
        setResetMessage({ text: err.message || 'Failed to send reset link. Please check the email address.', type: 'error' });
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanLoginId = loginId.trim();
    const cleanPassword = password.trim();
    const cleanSocietyId = societyId.trim() || 'GV2026';

    try {
      const result = await societyService.authenticateUser(cleanLoginId, cleanPassword, cleanSocietyId);
      if (result.success && result.user) {
        onLogin(result.user);
        return;
      }
      throw new Error(result.error || 'Invalid User ID or Password. Please verify your credentials.');
    } catch (err: any) {
      const raw = String(err?.message || '');
      if (raw.toLowerCase().includes('rate') || raw.toLowerCase().includes('limit')) {
        setError('Server is processing high traffic. Please retry in a few moments.');
      } else {
        setError(raw || 'Invalid credentials. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (view === 'register') {
    return <RegisterSociety onBack={() => setView('login')} onSuccess={() => setView('login')} />;
  }

  return (
    <div className="fixed inset-0 w-screen h-screen h-[100vh] h-[100dvh] bg-slate-950 font-sans selection:bg-blue-100 selection:text-blue-700 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden m-0 p-0">
      
      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full relative border border-slate-200 animate-in zoom-in-95 duration-150">
            <button 
              onClick={() => {
                setShowForgotModal(false);
                setResetMessage({ text: '', type: '' });
              }}
              className="absolute right-5 top-5 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-5">
              <div className="w-11 h-11 bg-blue-50 text-[#1d72fe] rounded-2xl flex items-center justify-center mb-3.5 border border-blue-100 shadow-2xs">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Reset Password</h3>
              <p className="text-slate-500 text-xs font-medium mt-1">Enter your registered email address to receive a password recovery link.</p>
            </div>
            
            {resetMessage.text && (
              <div className={`p-3 rounded-xl text-xs font-bold mb-4 flex items-center gap-2.5 ${
                resetMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{resetMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#1d72fe] transition-colors" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="resident@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#1d72fe] focus:ring-2 focus:ring-blue-100 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300 text-xs bg-slate-50/50"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setResetMessage({ text: '', type: '' });
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-all text-xs uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-[1.5] bg-[#1d72fe] hover:bg-blue-600 active:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 text-xs uppercase tracking-wider cursor-pointer"
                >
                  {resetLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Send Link'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LEFT COLUMN: LOGIN FORM PANEL */}
      <div className="w-full md:w-[48%] lg:w-[42%] xl:w-[38%] min-h-screen md:min-h-0 md:h-full bg-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between overflow-y-auto z-20 shrink-0 shadow-2xl">
        
        <div>
          {/* Header Title */}
          <div className="mb-5">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-xl bg-[#1d72fe]/10 text-[#1d72fe] flex items-center justify-center font-black text-sm">
                <Building2 className="w-4 h-4" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Login
              </h1>
            </div>
            <p className="text-xs font-medium text-slate-500 ml-0.5">
              Don't have an account?{' '}
              <button 
                type="button" 
                onClick={() => setView('register')} 
                className="text-[#1d72fe] hover:text-blue-700 font-bold hover:underline cursor-pointer transition-colors"
              >
                Register Here
              </button>
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-3.5 w-full">
            
            {/* Society ID Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-0.5">
                SOCIETY ID
              </label>
              <div className="relative group">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[#1d72fe] transition-colors" />
                <input
                  type="text"
                  value={societyId}
                  onChange={(e) => setSocietyId(e.target.value)}
                  placeholder="GV2026"
                  className="w-full pl-10 pr-4 h-10 sm:h-11 rounded-xl border border-slate-200/90 focus:border-[#1d72fe] focus:ring-2 focus:ring-blue-100 outline-none text-xs sm:text-sm font-black text-slate-800 bg-slate-50/50 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            {/* User ID / Email Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-0.5">
                USER ID / EMAIL
              </label>
              <div className="relative group">
                <UserPlus className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[#1d72fe] transition-colors" />
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="Username or Email"
                  className="w-full pl-10 pr-4 h-10 sm:h-11 rounded-xl border border-slate-200/90 focus:border-[#1d72fe] focus:ring-2 focus:ring-blue-100 outline-none text-xs sm:text-sm font-bold text-slate-800 bg-slate-50/50 focus:bg-white transition-all placeholder:text-slate-300"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-0.5">
                PASSWORD
              </label>
              <div className="relative group">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[#1d72fe] transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-10 pr-10 h-10 sm:h-11 rounded-xl border border-slate-200/90 focus:border-[#1d72fe] focus:ring-2 focus:ring-blue-100 outline-none text-xs sm:text-sm font-bold text-slate-800 bg-slate-50/50 focus:bg-white transition-all placeholder:text-slate-300"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between pt-0.5 text-xs">
              <label className="flex items-center gap-2 font-semibold text-slate-600 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#1d72fe] focus:ring-blue-500 cursor-pointer"
                />
                <span>Remember Me</span>
              </label>
              <button 
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="font-bold text-slate-500 hover:text-[#1d72fe] cursor-pointer transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-rose-50 text-rose-600 p-2.5 rounded-xl text-xs font-bold border border-rose-200 flex items-center gap-2 animate-in fade-in duration-150">
                <X className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1d72fe] hover:bg-blue-600 active:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3 px-8 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-500/20 hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>LOGIN</span>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* RIGHT COLUMN: SHORT, BOLD FEATURE PRESENTATION WITH SYMBOLS */}
      <div className="hidden md:flex flex-1 h-full relative overflow-hidden flex-col justify-between p-8 lg:p-12 text-white bg-slate-950 shrink-0 z-10">
        
        {/* Building Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img 
            src="/src/assets/images/building_bg_1791112941582.jpg" 
            alt="TowerTech Platform" 
            className="w-full h-full object-cover object-center opacity-35 mix-blend-luminosity filter contrast-125 brightness-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/85 to-[#0b1739]/85" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-transparent to-[#0b1739]/60" />
        </div>

        {/* Ambient Glows */}
        <div className="absolute top-10 right-10 w-96 h-96 bg-[#1d72fe]/20 rounded-full blur-3xl pointer-events-none z-0" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none z-0" />

        {/* Top Brand Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-lg">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-black text-white tracking-tight block">TowerTech</span>
              <span className="text-[10px] font-extrabold text-blue-200/90 uppercase tracking-widest block">Society System</span>
            </div>
          </div>
        </div>

        {/* Center Short Bold Features Grid */}
        <div className="relative z-10 max-w-xl my-auto py-4 space-y-4">
          <div>
            <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
              All-in-One Residential Platform
            </h2>
            <p className="text-xs text-slate-300 font-bold mt-1">
              Streamline maintenance, security, notices, and helpdesk in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2.5 pt-1 font-sans">
            {/* Feature 1 */}
            <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 hover:bg-white/15 transition-all group">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 border border-orange-400/30 group-hover:scale-105 transition-transform">
                <CreditCard className="w-5 h-5 text-orange-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-extrabold text-white tracking-tight">Maintenance & Online Bills</p>
                <p className="text-[11px] font-bold text-blue-200/90 truncate mt-0.5">Automated billing, instant receipts & payment history</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 hover:bg-white/15 transition-all group">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-400/30 group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-extrabold text-white tracking-tight">Real-Time Visitor Gate Pass</p>
                <p className="text-[11px] font-bold text-blue-200/90 truncate mt-0.5">Pre-approve guests, track deliveries & live gate logs</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 hover:bg-white/15 transition-all group">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-400/30 group-hover:scale-105 transition-transform">
                <Megaphone className="w-5 h-5 text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-extrabold text-white tracking-tight">Notice Management</p>
                <p className="text-[11px] font-bold text-blue-200/90 truncate mt-0.5">Publish circulars, announcements & urgent alerts</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 hover:bg-white/15 transition-all group">
              <div className="w-9 h-9 rounded-xl bg-[#1d72fe]/20 text-blue-300 flex items-center justify-center shrink-0 border border-blue-400/30 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-5 h-5 text-blue-300" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-extrabold text-white tracking-tight">Communication & Helpdesk</p>
                <p className="text-[11px] font-bold text-blue-200/90 truncate mt-0.5">Log complaints, chat in channels & book amenities</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer Badge */}
        <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-xs font-black text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Secure Society Access</span>
          </div>
          <span className="text-[11px] text-blue-200 font-bold">© 2026 TowerTech</span>
        </div>

      </div>

    </div>
  );
}
