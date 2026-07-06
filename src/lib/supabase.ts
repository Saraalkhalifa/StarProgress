import { createClient } from '@supabase/supabase-js';

// Only the public anon key belongs here — NEVER the service role key.
// The anon key is safe to expose in frontend code; the service role key is not.
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

// Both values must be present and non-empty; a missing or whitespace-only value
// means Supabase is not configured and the app falls back to localStorage.
export const isSupabaseConfigured = !!(url && key);

// createClient is only called when both values are confirmed non-empty above.
export const supabase = isSupabaseConfigured
  ? createClient(url!, key!)
  : null;
