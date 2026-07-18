import bcrypt from "bcryptjs";

import { userRepository } from "@/repositories/user.repository";
import { activityService } from "@/services/activity.service";
import { createSession, destroySession } from "@/lib/auth/session";
import { checkRateLimit, recordFailedAttempt, clearRateLimit } from "@/lib/auth/rate-limit";
import { DUMMY_HASH } from "@/lib/auth/config";
import {
  InvalidCredentialsError,
  RateLimitExceededError,
} from "@/lib/auth/errors";
import type { AuthenticatedUser } from "@/types/auth";

/* ============================================
   Auth Service
   Business logic for authentication flows.
   Uses userRepository for DB access and
   activityService for audit logging.
   ============================================ */

export const authService = {
  /**
   * Authenticate a user with email and password.
   *
   * Security measures:
   * - Rate limited per IP
   * - Timing attack prevention (always runs bcrypt.compare)
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

    const user = await userRepository.findByEmail(email);

    // Always run bcrypt.compare — even if user not found —
    // to prevent timing attacks that reveal email existence.
    const hashToCompare = user?.password ?? DUMMY_HASH;
    const isValid = await bcrypt.compare(password, hashToCompare);

    if (!user || !isValid) {
      recordFailedAttempt(rateLimitKey);

      // Log failed login attempt (without revealing whether email exists)
      if (user) {
        await activityService.log({
          userId: user.id,
          type: "LOGIN",
          entity: "auth",
          entityId: user.id,
          metadata: {
            success: false,
            ip: options?.ip,
            userAgent: options?.userAgent,
          },
        });
      }

      throw new InvalidCredentialsError();
    }

    // Success — clear rate limit and create session
    clearRateLimit(rateLimitKey);

    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    });

    // Log successful login
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

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    };
  },

  /**
   * Log out the current user by destroying the session
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
