import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── Mock dependencies ───────────────────── */

const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
    signOut: vi.fn(),
  },
};

const { mockSupabaseClient: hoistedClient } = vi.hoisted(() => ({
  mockSupabaseClient: {
    auth: {
      getUser: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue(hoistedClient),
}));

vi.mock("@/repositories/user.repository", () => ({
  userRepository: {
    findBySupabaseUid: vi.fn(),
    findByEmail: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

/* ── Imports (after mocks) ────────────────── */

import {
  getCurrentUser,
  requireUser,
  requireRole,
  createSession,
  destroySession,
} from "@/lib/auth/session";
import { userRepository } from "@/repositories/user.repository";
import {
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth/errors";

/* ============================================
   Session Utility Tests
   Supabase Auth-based session management.
   ============================================ */

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  supabaseUid: "supabase-uid-1",
  role: "OWNER" as const,
  avatar: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Session Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* ── getCurrentUser ────────────────────── */

  it("returns null when no Supabase session exists", async () => {
    hoistedClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Auth session missing!" },
    });

    const result = await getCurrentUser();
    expect(result).toBeNull();
  });

  it("returns null when Supabase user has no Prisma profile", async () => {
    hoistedClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "supabase-uid-1" } },
      error: null,
    });
    vi.mocked(userRepository.findBySupabaseUid).mockResolvedValue(null);

    const result = await getCurrentUser();
    expect(result).toBeNull();
  });

  it("returns authenticated user when session and profile exist", async () => {
    hoistedClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "supabase-uid-1" } },
      error: null,
    });
    vi.mocked(userRepository.findBySupabaseUid).mockResolvedValue(mockUser);

    const result = await getCurrentUser();
    expect(result).not.toBeNull();
    expect(result!.id).toBe("user-1");
    expect(result!.email).toBe("test@example.com");
    expect(result!.role).toBe("OWNER");
  });

  /* ── requireUser ───────────────────────── */

  it("throws UnauthorizedError when no session exists", async () => {
    hoistedClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Auth session missing!" },
    });

    await expect(requireUser()).rejects.toThrow(UnauthorizedError);
  });

  /* ── requireRole ───────────────────────── */

  it("throws UnauthorizedError when no session exists", async () => {
    hoistedClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Auth session missing!" },
    });

    await expect(requireRole("ADMIN")).rejects.toThrow(UnauthorizedError);
  });

  it("throws ForbiddenError when role is not allowed", async () => {
    hoistedClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "supabase-uid-1" } },
      error: null,
    });
    vi.mocked(userRepository.findBySupabaseUid).mockResolvedValue({
      ...mockUser,
      role: "PHOTOGRAPHER" as const,
    });

    await expect(requireRole("OWNER", "ADMIN")).rejects.toThrow(ForbiddenError);
  });

  it("returns user when role is allowed", async () => {
    hoistedClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "supabase-uid-1" } },
      error: null,
    });
    vi.mocked(userRepository.findBySupabaseUid).mockResolvedValue(mockUser);

    const user = await requireRole("OWNER");
    expect(user.role).toBe("OWNER");
  });

  /* ── createSession (deprecated no-op) ──── */

  it("createSession is a no-op (deprecated)", async () => {
    await expect(createSession(mockUser)).resolves.toBeUndefined();
  });

  /* ── destroySession ───────────────────── */

  it("destroySession calls supabase.auth.signOut", async () => {
    hoistedClient.auth.signOut.mockResolvedValue({ error: null });

    await destroySession();

    expect(hoistedClient.auth.signOut).toHaveBeenCalled();
  });
});
