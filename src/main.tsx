import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { isSupabaseConfigured } from './lib/supabase';

const root = createRoot(document.getElementById('root')!);

if (!isSupabaseConfigured) {
  root.render(
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-rose-100 text-center">
        <h2 className="text-xl font-black text-rose-600 mb-4">Configuration Error</h2>
        <p className="text-slate-600 text-sm">
          The application is not correctly configured. Please check the Supabase environment variables.
        </p>
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
