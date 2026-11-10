import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { isSupabaseConfigured } from './lib/supabase';

const root = createRoot(document.getElementById('root')!);

if (!isSupabaseConfigured) {
  root.render(
    <div className="min-h-screen bg-[#30204F] text-white flex items-center justify-center p-6 font-sans">
      <div className="bg-white text-slate-900 p-8 rounded-3xl shadow-2xl max-w-lg w-full border border-purple-100 text-center">
        <div className="w-16 h-16 bg-purple-50 text-[#6339CA] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-100 font-black text-2xl">
          TT
        </div>
        <h2 className="text-2xl font-black text-[#30204F] mb-2 tracking-tight">Configuration Required</h2>
        <p className="text-slate-600 text-xs leading-relaxed mb-6">
          TowerTech could not connect to Supabase because the required environment variables are missing in this environment.
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left mb-6 text-xs font-mono space-y-1.5">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Required Environment Variables:</p>
          <p className="text-purple-700 font-semibold">• VITE_SUPABASE_URL</p>
          <p className="text-purple-700 font-semibold">• VITE_SUPABASE_ANON_KEY</p>
        </div>
        <p className="text-[11px] text-slate-500 mb-6">
          If you are deploying to Netlify, add these in <span className="font-semibold text-slate-700">Site configuration → Environment variables</span> and trigger a new deployment.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 bg-[#6339CA] hover:bg-[#5229B8] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
        >
          Check Connection Again
        </button>
      </div>
    </div>
  );
} else {
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}
