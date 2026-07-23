import { createSupabaseServerClient } from "@/lib/supabase/server";
import { userRepository } from "@/repositories/user.repository";
import {
  UnauthorizedError,
  ExpiredSessionError,
  ForbiddenError,
} from "@/lib/auth/errors";
import type { SessionUser, UserRole } from "@/types/auth";

/* ============================================
   Session Utilities
   Supabase Auth-based session management.
   Supabase manages the session cookies; we read
   the session and fetch the Prisma user profile.
   ============================================ */

/**
 * Get the currently authenticated user.
 *
 * Reads the Supabase session, then fetches the
 * corresponding Prisma User profile by supabaseUid.
 * Returns `null` if not authenticated.
 */
export async function getCurrentUser(): Promise<SessionUser> {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) return null;

    const user = await userRepository.findBySupabaseUid(supabaseUser.id);

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    };
  } catch {
    return null;
  }
}

/**
 * Require an authenticated user.
 * Throws `UnauthorizedError` if no valid session exists.
 */
export async function requireUser(): Promise<NonNullable<SessionUser>> {
  const user = await getCurrentUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  return user;
}

/**
 * Require the authenticated user to have one of the specified roles.
 * Throws `UnauthorizedError` if not logged in, `ForbiddenError` if
 * the user's role is not in the allowed list.
 */
export async function requireRole(
  ...allowedRoles: UserRole[]
): Promise<NonNullable<SessionUser>> {
  const user = await requireUser();

  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenError();
  }

  return user;
}

/**
 * @deprecated Supabase Auth manages the session automatically
 * via `signInWithPassword()`. This function is kept as a no-op
 * for backward compatibility with code that still imports it.
 */
export async function createSession(_user: {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string | null;
}): Promise<void> {
  // No-op — Supabase Auth manages session creation
}

/**
 * Destroy the session by signing out of Supabase Auth.
 */
export async function destroySession(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}
