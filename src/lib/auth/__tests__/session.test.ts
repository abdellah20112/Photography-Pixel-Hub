import { describe, it, expect, vi, beforeEach } from "vitest";
import { SignJWT } from "jose";

/* ── Mock next/headers ────────────────────── */

const cookieStore = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: (name: string) => {
      const value = cookieStore.get(name);
      return value ? { name, value } : undefined;
    },
    set: (name: string, value: string) => {
      cookieStore.set(name, value);
    },
    delete: (name: string) => {
      cookieStore.delete(name);
    },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

/* ── Imports (after mocks) ────────────────── */

import { createSession, getSession, destroySession } from "@/lib/auth/session";
import { SESSION_COOKIE_NAME, SESSION_ALG } from "@/lib/auth/config";

/* ============================================
   Session Utility Tests
   ============================================ */

const TEST_SECRET = "test-secret-key-for-vitest-aaaaaaaaaaaaaaa";

function getSecret(): Uint8Array {
  return new TextEncoder().encode(TEST_SECRET);
}

describe("Session Utilities", () => {
  beforeEach(() => {
    cookieStore.clear();
    vi.stubEnv("AUTH_SECRET", TEST_SECRET);
  });

  /* ── Create + Get session ───────────────── */
  it("creates and retrieves a session", async () => {
    await createSession({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
      role: "OWNER",
    });

    const session = await getSession();

    expect(session).not.toBeNull();
    expect(session!.id).toBe("user-1");
    expect(session!.email).toBe("test@example.com");
    expect(session!.role).toBe("OWNER");
  });

  /* ── No session ─────────────────────────── */
  it("returns null when no session cookie exists", async () => {
    const session = await getSession();
    expect(session).toBeNull();
  });

  /* ── Expired session ────────────────────── */
  it("returns null for an expired session token", async () => {
    // Create a token that already expired
    const expiredToken = await new SignJWT({
      sub: "user-1",
      email: "test@example.com",
      name: "Test",
      role: "OWNER",
    })
      .setProtectedHeader({ alg: SESSION_ALG })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60) // expired 1 min ago
      .sign(getSecret());

    cookieStore.set(SESSION_COOKIE_NAME, expiredToken);

    const session = await getSession();
    expect(session).toBeNull();
  });

  /* ── Tampered token ────────────────────── */
  it("returns null for a tampered token", async () => {
    await createSession({
      id: "user-1",
      email: "test@example.com",
      name: "Test",
      role: "OWNER",
    });

    // Tamper with the token
    const token = cookieStore.get(SESSION_COOKIE_NAME)!;
    cookieStore.set(SESSION_COOKIE_NAME, token.slice(0, -5) + "XXXXX");

    const session = await getSession();
    expect(session).toBeNull();
  });

  /* ── Destroy session ───────────────────── */
  it("destroys the session cookie", async () => {
    await createSession({
      id: "user-1",
      email: "test@example.com",
      name: "Test",
      role: "OWNER",
    });

    expect(cookieStore.has(SESSION_COOKIE_NAME)).toBe(true);

    await destroySession();

    expect(cookieStore.has(SESSION_COOKIE_NAME)).toBe(false);
  });
});
