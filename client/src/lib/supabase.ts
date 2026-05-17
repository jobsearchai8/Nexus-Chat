/*
 * Supabase Client Configuration
 * ─────────────────────────────
 * Nexus Networks — F&F Chats Supabase Project
 *
 * Uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY env vars if available,
 * otherwise falls back to hardcoded project credentials.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://xrsyikaksivgblfewjug.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhyc3lpa2Frc2l2Z2JsZmV3anVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NTcyMjksImV4cCI6MjA5NDAzMzIyOX0.4cDDcOaCVcYXAcC17PDw6c2NWWV1FM1relQZ8zWGbfY";

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
