import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mniarauxuzqcmdrplgiz.supabase.co'
const supabaseKey = 'sb_publishable_lyGIIhz89nFb_vMNQVfLCA_HvJeEk_5'

export const supabase = createClient(supabaseUrl, supabaseKey)

export const isSupabaseConfigured = true;
