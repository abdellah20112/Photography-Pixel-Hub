import { RATE_LIMIT } from "@/lib/auth/config";
import { RateLimitExceededError } from "@/lib/auth/errors";

/* ============================================
   Rate Limiter
   In-memory rate limiting for login attempts.
   Tracks attempts per IP address within a sliding
   window. Suitable for single-instance deployments.
   ============================================ */

type AttemptRecord = {
  count: number;
  windowStart: number;
  lockedUntil: number;
};

const attempts = new Map<string, AttemptRecord>();

/**
 * Periodically prune stale entries to prevent memory leaks.
 * Runs on every check — O(n) but n is bounded by unique IPs
 * in the current window.
 */
function pruneStale(now: number): void {
  for (const [key, record] of attempts.entries()) {
    if (now > record.windowStart + RATE_LIMIT.WINDOW_MS && now > record.lockedUntil) {
      attempts.delete(key);
    }
  }
}

/**
 * Check if an IP is within the allowed rate limit.
 * Throws `RateLimitExceededError` if the limit is exceeded.
 *
 * @param key - Typically the client IP address.
 */
export function checkRateLimit(key: string): void {
  const now = Date.now();
  pruneStale(now);

  const record = attempts.get(key);

  if (record) {
    // Still in lockout period
    if (now < record.lockedUntil) {
      throw new RateLimitExceededError();
    }

    // Window has expired — reset
    if (now > record.windowStart + RATE_LIMIT.WINDOW_MS) {
      attempts.set(key, {
        count: 1,
        windowStart: now,
        lockedUntil: 0,
      });
      return;
    }

    // Within window — increment
    record.count++;

    if (record.count > RATE_LIMIT.MAX_ATTEMPTS) {
      record.lockedUntil = now + RATE_LIMIT.LOCKOUT_MS;
      throw new RateLimitExceededError();
    }
  } else {
    attempts.set(key, {
      count: 1,
      windowStart: now,
      lockedUntil: 0,
    });
  }
}

/**
 * Record a failed login attempt for a key.
 * This increments the counter for rate limiting.
 */
export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  pruneStale(now);

  const record = attempts.get(key);

  if (record) {
    if (now > record.windowStart + RATE_LIMIT.WINDOW_MS) {
      attempts.set(key, {
        count: 1,
        windowStart: now,
        lockedUntil: 0,
      });
    } else {
      record.count++;
      if (record.count >= RATE_LIMIT.MAX_ATTEMPTS) {
        record.lockedUntil = now + RATE_LIMIT.LOCKOUT_MS;
      }
    }
  } else {
    attempts.set(key, {
      count: 1,
      windowStart: now,
      lockedUntil: 0,
    });
  }
}

/**
 * Clear rate-limit records for a key after a successful login.
 */
export function clearRateLimit(key: string): void {
  attempts.delete(key);
}

/* ── Test Utilities ──────────────────────── */

/**
 * Reset all rate-limit state. For testing only.
 */
export function _resetRateLimit(): void {
  attempts.clear();
}
