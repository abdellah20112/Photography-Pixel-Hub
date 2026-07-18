import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

import {
  SESSION_COOKIE_NAME,
  SESSION_ALG,
  SESSION_MAX_AGE,
  cookieOptions,
} from "@/lib/auth/config";
import {
  UnauthorizedError,
  ExpiredSessionError,
  ForbiddenError,
} from "@/lib/auth/errors";
import type { SessionUser, UserRole } from "@/types/auth";

/* ============================================
   Session Utilities
   JWT-based session management using jose.
   Works in both Node.js and Edge runtimes.
   ============================================ */

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is required");
  }
  return new TextEncoder().encode(secret);
}

/** JWT payload shape (internal). */
type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string | null;
  iat: number;
  exp: number;
};

/**
 * Create a signed session JWT and set it as an httpOnly cookie.
 * Call this after successful authentication.
 */
export async function createSession(user: {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string | null;
}): Promise<void> {
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.avatar ?? null,
  })
    .setProtectedHeader({ alg: SESSION_ALG })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, cookieOptions);
}

/**
 * Verify and decode the session JWT from the cookie.
 * Returns `null` if no session exists or the token is invalid.
 */
export async function getSession(): Promise<SessionUser> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: [SESSION_ALG],
    });

    return {
      id: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as UserRole,
      avatar: (payload.avatar as string | null) ?? null,
    };
  } catch {
    // Token is expired, malformed, or signature mismatch
    return null;
  }
}

/**
 * Get the currently authenticated user.
 * Returns `null` if not authenticated — does not throw.
 */
export async function getCurrentUser(): Promise<SessionUser> {
  return getSession();
}

/**
 * Require an authenticated user. Throws `UnauthorizedError` if
 * no valid session exists, or `ExpiredSessionError` if the
 * session token is present but expired.
 */
export async function requireUser(): Promise<NonNullable<SessionUser>> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    throw new UnauthorizedError();
  }

  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: [SESSION_ALG],
    });

    return {
      id: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as UserRole,
      avatar: (payload.avatar as string | null) ?? null,
    };
  } catch (err) {
    // Distinguish expired token from other errors
    if (err instanceof Error && err.name === "JWTExpired") {
      throw new ExpiredSessionError();
    }
    throw new UnauthorizedError();
  }
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
 * Destroy the session by deleting the session cookie.
 */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}
