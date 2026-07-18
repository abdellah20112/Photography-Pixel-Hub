import { createClient } from "@supabase/supabase-js";

/**
 * Supabase admin client using the service role key.
 *
 * Bypasses Row Level Security — use ONLY on the server for
 * privileged operations (webhooks, system jobs, seeds).
 * NEVER expose this client to the browser.
 */
export function createSupabaseAdminClient() {
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
