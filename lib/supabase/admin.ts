import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client.
 * Bypasses RLS. USE ONLY in server-side code (actions, route handlers).
 * NEVER expose to the browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
