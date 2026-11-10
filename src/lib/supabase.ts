import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  !supabaseUrl.includes('your_supabase') &&
  !supabaseKey.includes('your_supabase')
);

if (!isSupabaseConfigured) {
  console.warn(
    '[TowerTech] Supabase environment variables missing or incomplete. ' +
    'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your deployment environment.'
  );
}

// Safely initialize Supabase client
// When properly configured with real credentials, creates the active Supabase client.
// If env vars are temporarily unset (e.g. initial build step before env injection),
// a placeholder client is instantiated to avoid crashing the JavaScript execution.
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : createClient(
      supabaseUrl || 'https://mniarauxuzqcmdrplgiz.supabase.co',
      supabaseKey || 'sb_publishable_placeholder',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );

