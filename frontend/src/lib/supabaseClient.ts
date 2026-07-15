import { createClient } from "@supabase/supabase-js";

/**
 * Browser-side Supabase client using the public ANON key (safe to expose —
 * it's restricted by Row Level Security on the Supabase side). Used in
 * Phase 3 for the login form and session handling. Never import the
 * service role key here.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Check your frontend .env file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
