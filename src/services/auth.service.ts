import { createSupabaseServerClient } from "@/lib/supabase/server";
import { userRepository } from "@/repositories/user.repository";
import { activityService } from "@/services/activity.service";
import { destroySession } from "@/lib/auth/session";
import { checkRateLimit, recordFailedAttempt, clearRateLimit } from "@/lib/auth/rate-limit";
import {
  InvalidCredentialsError,
  RateLimitExceededError,
} from "@/lib/auth/errors";
import type { AuthenticatedUser } from "@/types/auth";

/* ============================================
   Auth Service
   Business logic for authentication flows.
   Uses Supabase Auth for credential verification
   and session management. Prisma User table
   stores profile information only.
   ============================================ */

export const authService = {
  /**
   * Authenticate a user with email and password via Supabase Auth.
   *
   * Security measures:
   * - Rate limited per IP
   * - Does not reveal whether email exists
   * - Logs all attempts to audit log
   *
   * @returns The authenticated user (without password).
   * @throws InvalidCredentialsError | RateLimitExceededError
   */
  async login(
    email: string,
    password: string,
    options?: { ip?: string; userAgent?: string }
  ): Promise<AuthenticatedUser> {
    const rateLimitKey = options?.ip ?? email;

    checkRateLimit(rateLimitKey);

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      recordFailedAttempt(rateLimitKey);
      throw new InvalidCredentialsError();
    }

    // Fetch Prisma profile by Supabase Auth UID
    const user = await userRepository.findBySupabaseUid(data.user.id);

    if (!user) {
      // Supabase auth succeeded but no Prisma profile exists
      recordFailedAttempt(rateLimitKey);
      throw new InvalidCredentialsError();
    }

    // Success — clear rate limit
    clearRateLimit(rateLimitKey);

    // Log successful login (non-fatal — don't fail login if logging fails)
    try {
      await activityService.log({
        userId: user.id,
        type: "LOGIN",
        entity: "auth",
        entityId: user.id,
        metadata: {
          success: true,
          ip: options?.ip,
          userAgent: options?.userAgent,
        },
      });
    } catch {
      // Logging is non-critical — swallow errors
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    };
  },

  /**
   * Log out the current user by signing out of Supabase Auth
   * and logging the event.
   */
  async logout(userId?: string): Promise<void> {
    await destroySession();

    if (userId) {
      await activityService.log({
        userId,
        type: "LOGOUT",
        entity: "auth",
        entityId: userId,
        metadata: {},
      });
    }
  },
};
