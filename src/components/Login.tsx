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
import TowerTechLogo from './TowerTechLogo';
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
    <div className="fixed inset-0 w-screen h-screen h-[100vh] h-[100dvh] bg-[#6339CA] font-sans selection:bg-purple-100 selection:text-purple-900 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden m-0 p-0">
      
      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-purple-950/60 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full relative border border-purple-100 animate-in zoom-in-95 duration-150">
            <button 
              onClick={() => {
                setShowForgotModal(false);
                setResetMessage({ text: '', type: '' });
              }}
              className="absolute right-5 top-5 p-1.5 text-slate-400 hover:text-purple-800 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-5">
              <div className="w-11 h-11 bg-purple-50 text-[#6339CA] rounded-2xl flex items-center justify-center mb-3.5 border border-purple-100 shadow-2xs">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-[#6339CA] tracking-tight">Reset Password</h3>
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
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#6339CA] transition-colors" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="resident@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#6339CA] focus:ring-2 focus:ring-purple-100 outline-none transition-all font-bold text-purple-900 placeholder:text-slate-300 text-xs bg-slate-50/50"
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
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-purple-800 font-bold py-2.5 rounded-xl transition-all text-xs uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-[1.5] bg-[#6339CA] hover:bg-[#5D31C7] active:bg-purple-800 disabled:bg-slate-300 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 text-xs uppercase tracking-wider cursor-pointer"
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
      <div className="w-full md:w-[48%] lg:w-[42%] xl:w-[38%] min-h-screen md:min-h-0 md:h-full bg-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between overflow-y-auto z-20 shrink-0 shadow-2xl font-sans">
        
        <div className="my-auto py-2">
          {/* Header Title */}
          <div className="mb-6">
            <div className="flex items-center gap-3.5 mb-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border border-purple-100 shadow-sm p-1.5 bg-[#30204F]">
                <TowerTechLogo className="w-full h-full text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#30204F] tracking-tight">
                  TowerTech
                </h1>
                <p className="text-[11px] font-black uppercase tracking-widest text-[#777383]">Society Management System</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-[#777383] mt-1">
              Green Park Residency Portal.{' '}
              <button 
                type="button" 
                onClick={() => setView('register')} 
                className="text-[#6841C6] hover:text-[#5531ab] font-black hover:underline cursor-pointer transition-colors"
              >
                Register Here
              </button>
            </p>
          </div>

          {/* Quick Demo Access Bar */}
          <div className="mb-5 p-3 rounded-2xl bg-[#EEE8FA]/60 border border-[#c4afee]/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#30204F]">
                Quick Test Credentials
              </span>
              <span className="text-[10px] text-[#777383] font-bold">1-Click Auto-Fill</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSocietyId('GV2026');
                  setLoginId('A001');
                  setPassword('admin123');
                }}
                className="px-2 py-1.5 bg-white hover:bg-[#30204F] hover:text-white text-[#30204F] rounded-lg text-[10px] font-black border border-purple-200 transition-all shadow-2xs text-center cursor-pointer active:scale-95"
              >
                Admin (A001)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSocietyId('GV2026');
                  setLoginId('R001');
                  setPassword('resident123');
                }}
                className="px-2 py-1.5 bg-white hover:bg-[#6841C6] hover:text-white text-[#6841C6] rounded-lg text-[10px] font-black border border-purple-200 transition-all shadow-2xs text-center cursor-pointer active:scale-95"
              >
                Owner (R001)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSocietyId('GV2026');
                  setLoginId('T001');
                  setPassword('tenant123');
                }}
                className="px-2 py-1.5 bg-white hover:bg-[#6841C6] hover:text-white text-[#6841C6] rounded-lg text-[10px] font-black border border-purple-200 transition-all shadow-2xs text-center cursor-pointer active:scale-95"
              >
                Tenant (T001)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSocietyId('GV2026');
                  setLoginId('S001');
                  setPassword('security123');
                }}
                className="px-2 py-1.5 bg-white hover:bg-emerald-700 hover:text-white text-emerald-700 rounded-lg text-[10px] font-black border border-emerald-200 transition-all shadow-2xs text-center cursor-pointer active:scale-95"
              >
                Security (S001)
              </button>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4 w-full">
            
            {/* Society ID Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-[#777383] uppercase tracking-widest block ml-0.5">
                SOCIETY ID
              </label>
              <div className="relative group">
                <Building2 className="w-4 h-4 text-[#777383] absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[#6841C6] transition-colors" />
                <input
                  type="text"
                  value={societyId}
                  onChange={(e) => setSocietyId(e.target.value)}
                  placeholder="GV2026"
                  className="w-full pl-10 pr-4 h-11 rounded-xl border border-slate-200 focus:border-[#6841C6] focus:ring-4 focus:ring-[#6841C6]/10 outline-none text-xs sm:text-sm font-black text-[#272333] bg-slate-50/60 focus:bg-white transition-all shadow-2xs placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            {/* User ID / Email Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-[#777383] uppercase tracking-widest block ml-0.5">
                USER ID / EMAIL / FLAT NO
              </label>
              <div className="relative group">
                <Mail className="w-4 h-4 text-[#777383] absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[#6841C6] transition-colors" />
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. A001, R001, T001, S001 or 101"
                  className="w-full pl-10 pr-4 h-11 rounded-xl border border-slate-200 focus:border-[#6841C6] focus:ring-4 focus:ring-[#6841C6]/10 outline-none text-xs sm:text-sm font-bold text-[#272333] bg-slate-50/60 focus:bg-white transition-all shadow-2xs placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-[#777383] uppercase tracking-widest block ml-0.5">
                PASSWORD
              </label>
              <div className="relative group">
                <Lock className="w-4 h-4 text-[#777383] absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[#6841C6] transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full pl-10 pr-10 h-11 rounded-xl border border-slate-200 focus:border-[#6841C6] focus:ring-4 focus:ring-[#6841C6]/10 outline-none text-xs sm:text-sm font-bold text-[#272333] bg-slate-50/60 focus:bg-white transition-all shadow-2xs placeholder:text-slate-400"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#777383] hover:text-[#272333] transition-colors cursor-pointer p-1"
                  title={showPassword ? "Hide Password" : "Show Password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex items-center gap-2 font-bold text-[#777383] cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#6841C6] focus:ring-[#6841C6] cursor-pointer"
                />
                <span>Remember Me</span>
              </label>
              <button 
                type="button" 
                onClick={() => setShowForgotModal(true)}
                className="font-black text-[#6841C6] hover:text-[#5531ab] cursor-pointer transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs font-bold border border-rose-200 flex items-center gap-2 animate-in fade-in duration-150">
                <X className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#6841C6] hover:bg-[#5531ab] active:scale-[0.99] disabled:bg-slate-300 text-white font-black py-3.5 px-6 rounded-xl text-xs sm:text-sm uppercase tracking-widest transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>LOGIN TO DASHBOARD</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer Note */}
        <div className="pt-4 text-center border-t border-slate-100 text-[10px] font-black text-[#777383] uppercase tracking-widest">
          TowerTech Platform • Green Park Residency
        </div>

      </div>

      {/* RIGHT COLUMN: BRANDING & FEATURE CARDS */}
      <div className="hidden md:flex flex-1 h-full relative overflow-hidden flex-col justify-between p-8 lg:p-12 text-white bg-[#30204F] shrink-0 z-10">
        
        {/* Building Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img 
            src="/src/assets/images/building_bg_1791112941582.jpg" 
            alt="TowerTech Platform" 
            className="w-full h-full object-cover object-center opacity-25 mix-blend-overlay filter brightness-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#30204F] via-[#30204F]/95 to-[#6841C6]/50" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#30204F] via-transparent to-[#30204F]/90" />
        </div>

        {/* Ambient Glows */}
        <div className="absolute top-10 right-10 w-96 h-96 bg-[#6841C6]/20 rounded-full blur-3xl pointer-events-none z-0" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#F4B740]/10 rounded-full blur-3xl pointer-events-none z-0" />

        {/* Top Brand Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl p-2">
              <TowerTechLogo className="w-full h-full" />
            </div>
            <div>
              <span className="text-2xl font-black text-white tracking-tight block">TowerTech</span>
              <span className="text-[11px] font-black text-[#EEE8FA] uppercase tracking-[0.2em] block opacity-90">Green Park Residency</span>
            </div>
          </div>
        </div>

        {/* Center Short Bold Features Grid */}
        <div className="relative z-10 max-w-xl my-auto py-6 space-y-6">
          <div>
            <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              Simplified Society Living
            </h2>
            <p className="text-sm text-purple-100 font-bold mt-2 opacity-90 uppercase tracking-wide">
              Manage everything from maintenance to visitors.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-2 font-sans">
            {/* Feature 1 */}
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 hover:bg-white/15 transition-all group shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                <CreditCard className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-base font-black text-white tracking-tight">Maintenance & Bills</p>
                <p className="text-[11px] font-bold text-white/80 mt-1 uppercase tracking-wider">Fast payments & instant receipts</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 hover:bg-white/15 transition-all group shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-purple-400 text-[#6339CA] flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-base font-black text-white tracking-tight">Security & Visitors</p>
                <p className="text-[11px] font-bold text-white/80 mt-1 uppercase tracking-wider">Gate pass & live activity logs</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 hover:bg-white/15 transition-all group shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-400 text-[#6339CA] flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                <Megaphone className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-base font-black text-white tracking-tight">Society Notices</p>
                <p className="text-[11px] font-bold text-white/80 mt-1 uppercase tracking-wider">Important alerts & announcements</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer Badge */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs font-black text-purple-200 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Verified Secure Portal</span>
          </div>
          <span className="text-[11px] text-white">© 2026 TowerTech</span>
        </div>

      </div>

    </div>
  );
}
