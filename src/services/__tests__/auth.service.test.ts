import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── Mock dependencies ───────────────────── */

const { mockSupabaseClient } = vi.hoisted(() => ({
  mockSupabaseClient: {
    auth: {
      signInWithPassword: vi.fn(),
    },
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue(mockSupabaseClient),
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

vi.mock("@/services/activity.service", () => ({
  activityService: {
    log: vi.fn().mockResolvedValue(undefined),
    list: vi.fn(),
    count: vi.fn(),
  },
}));

vi.mock("@/lib/auth/session", () => ({
  createSession: vi.fn().mockResolvedValue(undefined),
  destroySession: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/auth/rate-limit", () => ({
  checkRateLimit: vi.fn(),
  recordFailedAttempt: vi.fn(),
  clearRateLimit: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

/* ── Imports (after mocks) ────────────────── */

import { authService } from "@/services/auth.service";
import { userRepository } from "@/repositories/user.repository";
import { InvalidCredentialsError } from "@/lib/auth/errors";

/* ============================================
   Auth Service Tests
   ============================================ */

describe("authService.login", () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* ── Supabase Auth error ───────────────── */
  it("throws InvalidCredentialsError when Supabase Auth fails", async () => {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials", code: "invalid_credentials" },
    });

    await expect(
      authService.login("test@example.com", "WrongPassword123")
    ).rejects.toThrow(InvalidCredentialsError);
  });

  /* ── No Prisma profile ─────────────────── */
  it("throws InvalidCredentialsError when no Prisma profile exists", async () => {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "supabase-uid-1" } },
      error: null,
    });
    vi.mocked(userRepository.findBySupabaseUid).mockResolvedValue(null);

    await expect(
      authService.login("test@example.com", "ValidPass123")
    ).rejects.toThrow(InvalidCredentialsError);
  });

  /* ── Correct credentials ───────────────── */
  it("returns authenticated user on correct credentials", async () => {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "supabase-uid-1" } },
      error: null,
    });
    vi.mocked(userRepository.findBySupabaseUid).mockResolvedValue(mockUser);

    const result = await authService.login("test@example.com", "ValidPass123");

    expect(result.id).toBe("user-1");
    expect(result.email).toBe("test@example.com");
    expect(result).not.toHaveProperty("password");
  });

  /* ── Audit logging ─────────────────────── */
  it("logs successful login", async () => {
    const { activityService } = await import("@/services/activity.service");
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "supabase-uid-1" } },
      error: null,
    });
    vi.mocked(userRepository.findBySupabaseUid).mockResolvedValue(mockUser);

    await authService.login("test@example.com", "ValidPass123");

    expect(activityService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        type: "LOGIN",
        entity: "auth",
      })
    );
  });

  /* ── Logging failure is non-fatal ──────── */
  it("does not fail login when activity logging throws", async () => {
    const { activityService } = await import("@/services/activity.service");
    vi.mocked(activityService.log).mockRejectedValueOnce(new Error("DB down"));
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "supabase-uid-1" } },
      error: null,
    });
    vi.mocked(userRepository.findBySupabaseUid).mockResolvedValue(mockUser);

    const result = await authService.login("test@example.com", "ValidPass123");

    expect(result.id).toBe("user-1");
    expect(result.email).toBe("test@example.com");
  });
});
