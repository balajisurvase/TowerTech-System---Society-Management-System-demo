import React, { useState } from 'react';
import { LogIn, Building2, Eye, EyeOff, ShieldCheck, X, UserPlus, Lock, Mail } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Theme colors - Fixed to Dark Blue/Indigo
  const themeColor = 'indigo';
  const themeHex = '#4f46e5';
  const themeBg = 'bg-indigo-600';
  const themeHover = 'hover:bg-indigo-700';
  const themeShadow = 'shadow-indigo-100';
  const themeFocus = 'focus:ring-indigo-500/10 focus:border-indigo-500';
  const themeText = 'text-indigo-600';
  const themeIcon = 'text-indigo-400';

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
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-700">
      {/* Background Subtle Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-slate-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-xl shadow-2xl p-8 md:p-10 max-w-md w-full relative border border-slate-100">
            <button 
              onClick={() => {
                setShowForgotModal(false);
                setResetMessage({ text: '', type: '' });
              }}
              className="absolute right-8 top-8 text-slate-400 hover:text-slate-600 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-8">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
                <Lock className={`w-7 h-7 ${themeText}`} />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Reset Password</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">Enter your email to receive a reset link.</p>
            </div>
            
            {resetMessage.text && (
              <div className={`p-4 rounded-2xl text-xs font-bold mb-6 flex items-center gap-3 ${
                resetMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
              }`}>
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                {resetMessage.text}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:${themeText} transition-colors`} />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 ${themeFocus} outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-300 text-sm`}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setResetMessage({ text: '', type: '' });
                  }}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-3.5 rounded-2xl transition-all text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className={`flex-[1.5] ${themeBg} ${themeHover} disabled:bg-slate-300 text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg ${themeShadow} text-xs uppercase tracking-widest`}
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

      <div className="w-full flex-1 min-h-screen grid md:grid-cols-2 bg-white overflow-hidden relative z-10 border-none">
        {/* Left Side - Visual/Branding */}
        <div className="hidden md:flex flex-col justify-between p-12 lg:p-16 bg-slate-900 text-white relative overflow-hidden">
          {/* Hero Background Image with Gradient Scrim */}
          <img 
            src="/src/assets/images/luxury_society_exterior_1790916938422.jpg" 
            alt="TowerTech Luxury Society" 
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity scale-105"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-indigo-950/70" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full -ml-24 -mb-24 blur-2xl" />
          
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-lg">
              <Building2 className={`w-7 h-7 text-indigo-300`} />
            </div>
            <h1 className="text-4xl lg:text-5xl font-black leading-[1.1] tracking-tight mb-1 text-white">
              TowerTech
            </h1>
            <h3 className="text-lg lg:text-xl font-bold text-indigo-300 mb-8">
              Society Management System
            </h3>
            
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-indigo-300">
                  SOCIETY MANAGEMENT SYSTEM
                </p>
                <p className="text-slate-300 text-sm font-medium leading-relaxed max-w-sm">
                  Official portal for Green Park Residency. Manage maintenance payments, complaints, visitor passes, notices, and amenities.
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/10 backdrop-blur-xs rounded-xl flex items-center justify-center border border-white/15">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">Authorized Access Portal</p>
                <p className="text-[10px] text-slate-400">Green Park Residency • Role-based Security</p>
              </div>
            </div>
            <div className="pt-6 border-t border-white/10">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
                © 2026 TowerTech
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="p-8 md:p-10 lg:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-8">
            <div className="md:hidden flex justify-center mb-8">
              <div className={`w-14 h-14 ${themeBg} rounded-2xl flex items-center justify-center shadow-lg ${themeShadow}`}>
                <Building2 className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
              Sign In
            </h2>
            <p className="text-slate-500 text-sm font-bold">Sign in to your society account.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Society ID</label>
                <div className="relative group">
                  <Building2 className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:${themeText} transition-colors`} />
                  <input
                    type="text"
                    value={societyId}
                    onChange={(e) => setSocietyId(e.target.value)}
                    placeholder="GV2026"
                    className={`w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-4 ${themeFocus} outline-none transition-all font-black text-slate-700 placeholder:text-slate-300 text-sm`}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  User ID / Email
                </label>
                <div className="relative group">
                  <UserPlus className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:${themeText} transition-colors`} />
                  <input
                    type="text"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="Enter User ID or Email"
                    className={`w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-4 ${themeFocus} outline-none transition-all font-black text-slate-700 placeholder:text-slate-300 text-sm`}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                  <button 
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className={`text-[10px] font-black ${themeText} hover:opacity-80 uppercase tracking-widest`}
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:${themeText} transition-colors`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-11 pr-11 py-3 rounded-xl border border-slate-200 focus:ring-4 ${themeFocus} outline-none transition-all font-black text-slate-700 placeholder:text-slate-300 text-sm`}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-bold border border-rose-100 flex items-center gap-2">
                <X className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${themeBg} ${themeHover} disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg ${themeShadow} hover:shadow-lg active:scale-[0.98] uppercase tracking-widest text-xs mt-2 cursor-pointer`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-4">
            <button
              onClick={() => setView('register')}
              className={`w-full group flex flex-col items-center gap-1.5 p-4 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-all cursor-pointer`}
            >
              <div className="flex items-center gap-2">
                <UserPlus className={`w-4 h-4 ${themeText}`} />
                <span className={`text-xs font-bold ${themeText} uppercase tracking-wider`}>
                  Register New Society
                </span>
              </div>
              <p className="text-slate-400 text-[10px] font-medium text-center">
                Set up a new society registration with Green Park Residency
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
