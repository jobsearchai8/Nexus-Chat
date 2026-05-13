/*
 * Supabase Client Configuration
 * ─────────────────────────────
 * Midnight Command theme — Nexus Networks
 *
 * Users must set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 * in their .env file for Supabase to work.
 * In demo mode (no env vars), the app uses mock data.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

let supabase: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}

export { supabase };
export default supabase;
