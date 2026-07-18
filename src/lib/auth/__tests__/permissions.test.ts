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

/* ── Imports ──────────────────────────────── */

import { requireUser, requireRole } from "@/lib/auth/session";
import {
  requireOwner,
  requireAdmin,
  requireEditor,
} from "@/lib/auth/permissions";
import {
  UnauthorizedError,
  ForbiddenError,
  ExpiredSessionError,
} from "@/lib/auth/errors";
import { SESSION_COOKIE_NAME, SESSION_ALG } from "@/lib/auth/config";

/* ============================================
   Route Guard / Permission Tests
   ============================================ */

const TEST_SECRET = "test-secret-key-for-vitest-aaaaaaaaaaaaaaa";

async function makeToken(
  payload: Record<string, unknown>,
  expiresInSeconds: number = 3600
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: SESSION_ALG })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresInSeconds)
    .sign(new TextEncoder().encode(TEST_SECRET));
}

describe("Route Guards", () => {
  beforeEach(() => {
    cookieStore.clear();
    vi.stubEnv("AUTH_SECRET", TEST_SECRET);
  });

  /* ── Unauthorized dashboard access ──────── */
  it("requireUser throws UnauthorizedError when no session exists", async () => {
    await expect(requireUser()).rejects.toThrow(UnauthorizedError);
  });

  it("requireRole throws UnauthorizedError when no session exists", async () => {
    await expect(requireRole("ADMIN")).rejects.toThrow(UnauthorizedError);
  });

  /* ── Expired session ────────────────────── */
  it("requireUser throws ExpiredSessionError for expired token", async () => {
    const expiredToken = await makeToken(
      { sub: "u1", email: "a@b.com", name: "Test", role: "OWNER" },
      -60 // expired 60s ago
    );
    cookieStore.set(SESSION_COOKIE_NAME, expiredToken);

    await expect(requireUser()).rejects.toThrow(ExpiredSessionError);
  });

  /* ── Forbidden access (wrong role) ──────── */
  it("requireOwner throws ForbiddenError for non-owner", async () => {
    const token = await makeToken({
      sub: "u1",
      email: "photographer@example.com",
      name: "Photographer",
      role: "PHOTOGRAPHER",
    });
    cookieStore.set(SESSION_COOKIE_NAME, token);

    await expect(requireOwner()).rejects.toThrow(ForbiddenError);
  });

  it("requireAdmin throws ForbiddenError for photographer", async () => {
    const token = await makeToken({
      sub: "u1",
      email: "photographer@example.com",
      name: "Photographer",
      role: "PHOTOGRAPHER",
    });
    cookieStore.set(SESSION_COOKIE_NAME, token);

    await expect(requireAdmin()).rejects.toThrow(ForbiddenError);
  });

  it("requireEditor throws ForbiddenError for media_buyer", async () => {
    const token = await makeToken({
      sub: "u1",
      email: "buyer@example.com",
      name: "Buyer",
      role: "MEDIA_BUYER",
    });
    cookieStore.set(SESSION_COOKIE_NAME, token);

    await expect(requireEditor()).rejects.toThrow(ForbiddenError);
  });

  /* ── Allowed access ─────────────────────── */
  it("requireOwner allows OWNER", async () => {
    const token = await makeToken({
      sub: "u1",
      email: "owner@example.com",
      name: "Owner",
      role: "OWNER",
    });
    cookieStore.set(SESSION_COOKIE_NAME, token);

    const user = await requireOwner();
    expect(user.role).toBe("OWNER");
  });

  it("requireAdmin allows ADMIN", async () => {
    const token = await makeToken({
      sub: "u1",
      email: "admin@example.com",
      name: "Admin",
      role: "ADMIN",
    });
    cookieStore.set(SESSION_COOKIE_NAME, token);

    const user = await requireAdmin();
    expect(user.role).toBe("ADMIN");
  });

  it("requireAdmin allows OWNER (hierarchy)", async () => {
    const token = await makeToken({
      sub: "u1",
      email: "owner@example.com",
      name: "Owner",
      role: "OWNER",
    });
    cookieStore.set(SESSION_COOKIE_NAME, token);

    const user = await requireAdmin();
    expect(user.role).toBe("OWNER");
  });

  it("requireEditor allows EDITOR", async () => {
    const token = await makeToken({
      sub: "u1",
      email: "editor@example.com",
      name: "Editor",
      role: "EDITOR",
    });
    cookieStore.set(SESSION_COOKIE_NAME, token);

    const user = await requireEditor();
    expect(user.role).toBe("EDITOR");
  });
});
