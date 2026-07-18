import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase browser client.
 *
 * Uses the anon key — safe for client-side usage.
 * Respects the user's session via cookies managed by @supabase/ssr.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
