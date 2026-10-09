import React, { useState } from 'react';
import { Building2, Eye, EyeOff, ShieldCheck, X, UserPlus, Lock, Mail, ArrowRight, Check } from 'lucide-react';
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
    <div className="fixed inset-0 w-screen h-screen h-[100vh] h-[100dvh] min-h-[100vh] max-h-[100vh] overflow-hidden bg-slate-950 font-sans selection:bg-purple-100 selection:text-purple-700 flex flex-col md:flex-row border-none m-0 p-0">
      
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
              <div className="w-11 h-11 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-3.5 border border-purple-100 shadow-2xs">
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
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="resident@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300 text-xs bg-slate-50/50"
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
                  className="flex-[1.5] bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:bg-slate-300 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 text-xs uppercase tracking-wider cursor-pointer"
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

      {/* LEFT COLUMN: LOGIN FORM PANEL (Full height corner-to-corner) */}
      <div className="w-full md:w-[50%] lg:w-[45%] xl:w-[42%] h-full bg-white p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 flex flex-col justify-between overflow-hidden relative z-20 shrink-0 shadow-2xl">
        
        <div>
          {/* Header Title */}
          <div className="mb-6">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-sm">
                <Building2 className="w-5 h-5" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Login
              </h1>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-500 ml-0.5">
              Don't have an account?{' '}
              <button 
                type="button" 
                onClick={() => setView('register')} 
                className="text-purple-600 hover:text-purple-700 font-bold hover:underline cursor-pointer transition-colors"
              >
                New User Register Here
              </button>
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4 w-full">
            
            {/* Society ID Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-0.5">
                SOCIETY ID
              </label>
              <div className="relative group">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-purple-600 transition-colors" />
                <input
                  type="text"
                  value={societyId}
                  onChange={(e) => setSocietyId(e.target.value)}
                  placeholder="GV2026"
                  className="w-full pl-10 pr-4 h-11 sm:h-12 rounded-xl border border-slate-200/90 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none text-xs sm:text-sm font-black text-slate-800 bg-slate-50/50 focus:bg-white transition-all"
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
                <UserPlus className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-purple-600 transition-colors" />
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="Username or Email"
                  className="w-full pl-10 pr-4 h-11 sm:h-12 rounded-xl border border-slate-200/90 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none text-xs sm:text-sm font-bold text-slate-800 bg-slate-50/50 focus:bg-white transition-all placeholder:text-slate-300"
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
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-purple-600 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-10 pr-10 h-11 sm:h-12 rounded-xl border border-slate-200/90 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none text-xs sm:text-sm font-bold text-slate-800 bg-slate-50/50 focus:bg-white transition-all placeholder:text-slate-300"
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
            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex items-center gap-2 font-semibold text-slate-600 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <span>Remember Me</span>
              </label>
              <button 
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="font-bold text-slate-500 hover:text-purple-600 cursor-pointer transition-colors"
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
                className="w-full sm:w-auto bg-[#542d87] hover:bg-[#462372] active:bg-[#391c5c] disabled:bg-slate-300 text-white font-bold py-3 px-10 rounded-lg text-xs uppercase tracking-wider transition-all shadow-md shadow-[#542d87]/20 hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
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

      {/* RIGHT COLUMN: FULL-BLEED BUILDING ARTWORK & BRANDING PANEL */}
      <div className="hidden md:flex flex-1 h-full relative overflow-hidden flex-col justify-between p-10 lg:p-14 xl:p-16 text-white bg-slate-950 shrink-0 z-10">
        
        {/* Full-bleed Building Line Art Image Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img 
            src="/src/assets/images/building_bg_1791112941582.jpg" 
            alt="Building Architecture" 
            className="w-full h-full object-cover object-center opacity-45 mix-blend-luminosity filter contrast-125 brightness-110 scale-100"
            referrerPolicy="no-referrer"
          />
          {/* Rich Gradient Overlay for readability and elegant depth */}
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/80 to-purple-950/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-transparent to-purple-950/50" />
        </div>

        {/* Ambient Radial Glows */}
        <div className="absolute top-10 right-10 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none z-0" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none z-0" />

        {/* Top Header Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-lg font-black text-white tracking-tight block">TowerTech</span>
            <span className="text-[10px] font-bold text-purple-200/80 uppercase tracking-widest block">Society Management Platform</span>
          </div>
        </div>

        {/* Center Welcome Text */}
        <div className="relative z-10 max-w-lg my-auto py-8">
          <h2 className="text-4xl lg:text-5xl xl:text-6xl font-black text-white tracking-tight leading-[1.05] drop-shadow-sm">
            Welcome<br />Back.
          </h2>

          <p className="text-xs sm:text-sm font-medium text-slate-200/90 leading-relaxed mt-5 max-w-md">
            Official TowerTech society portal. Access maintenance payments, complaints, visitor passes, notices, and amenity bookings in one unified platform.
          </p>

          <div className="mt-8 flex flex-wrap gap-2.5">
            <span className="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-bold border border-white/15">
              • Maintenance & Ledger
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-bold border border-white/15">
              • Gate Pass & Visitors
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-bold border border-white/15">
              • Helpdesk & Amenities
            </span>
          </div>
        </div>

        {/* Bottom Footer Badge */}
        <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-xs font-bold text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Authorized Access Portal</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">© 2026 TowerTech</span>
        </div>

      </div>

    </div>
  );
}
