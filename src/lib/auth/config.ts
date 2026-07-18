/* ============================================
   Auth Configuration
   Session, cookie, and rate-limit constants.
   ============================================ */

/* ── Session ─────────────────────────────── */

export const SESSION_COOKIE_NAME = "pph-session";

/** JWT signing algorithm. */
export const SESSION_ALG = "HS256";

/** Session lifetime in seconds (7 days). */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

/** Grace period in seconds before a session is considered expired. */
export const SESSION_EXPIRY_THRESHOLD = 60 * 5; // 5 minutes

/* ── Cookie ─────────────────────────────── */

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

/* ── Rate Limiting ───────────────────────── */

export const RATE_LIMIT = {
  MAX_ATTEMPTS: 5,
  WINDOW_MS: 60 * 1000, // 1 minute
  LOCKOUT_MS: 15 * 60 * 1000, // 15 minutes
} as const;

/* ── Timing Attack Prevention ────────────── */

/**
 * Pre-computed dummy bcrypt hash used when a user is not found.
 * Ensures bcrypt.compare always runs, preventing timing attacks
 * that could reveal whether an email is registered.
 */
export const DUMMY_HASH =
  "$2a$12$N9qo8uLOickgx2ZMRZoMy.MrMKxXQ9B7vrYqI2ZdD6J9.7KqYqYq2";
