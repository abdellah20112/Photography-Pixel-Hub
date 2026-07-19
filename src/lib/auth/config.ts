/* ============================================
   Auth Configuration
   Rate-limit constants for login attempts.
   Session management is handled by Supabase Auth.
   ============================================ */

/* ── Rate Limiting ───────────────────────── */

export const RATE_LIMIT = {
  MAX_ATTEMPTS: 5,
  WINDOW_MS: 60 * 1000, // 1 minute
  LOCKOUT_MS: 15 * 60 * 1000, // 15 minutes
} as const;
