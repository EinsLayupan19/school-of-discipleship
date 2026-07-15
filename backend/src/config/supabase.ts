import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

/**
 * Server-side Supabase client using the SERVICE ROLE key.
 * This key bypasses Row Level Security — it must NEVER be exposed to the
 * frontend. It's used here for privileged operations like verifying user
 * JWTs and, in later phases, admin-only user management (e.g. creating
 * facilitator accounts).
 */
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
