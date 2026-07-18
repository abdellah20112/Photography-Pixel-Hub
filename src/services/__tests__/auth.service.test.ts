import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

/* ── Mock dependencies ───────────────────── */

vi.mock("@/repositories/user.repository", () => ({
  userRepository: {
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
  const validPassword = "ValidPass123";
  const hashedPassword = bcrypt.hashSync(validPassword, 12);
  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    password: hashedPassword,
    role: "OWNER" as const,
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* ── Wrong password ─────────────────────── */
  it("throws InvalidCredentialsError on wrong password", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser);

    await expect(
      authService.login("test@example.com", "WrongPassword123")
    ).rejects.toThrow(InvalidCredentialsError);
  });

  /* ── User not found (same error — no reveal) ─ */
  it("throws InvalidCredentialsError when user not found", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

    await expect(
      authService.login("nonexistent@example.com", validPassword)
    ).rejects.toThrow(InvalidCredentialsError);
  });

  /* ── Correct credentials ────────────────── */
  it("returns authenticated user on correct credentials", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser);

    const result = await authService.login("test@example.com", validPassword);

    expect(result.id).toBe("user-1");
    expect(result.email).toBe("test@example.com");
    expect(result).not.toHaveProperty("password");
  });

  /* ── Audit logging ──────────────────────── */
  it("logs successful login", async () => {
    const { activityService } = await import("@/services/activity.service");
    vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser);

    await authService.login("test@example.com", validPassword);

    expect(activityService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        type: "LOGIN",
        entity: "auth",
      })
    );
  });

  it("logs failed login attempt", async () => {
    const { activityService } = await import("@/services/activity.service");
    vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser);

    try {
      await authService.login("test@example.com", "WrongPassword123");
    } catch {
      // expected
    }

    expect(activityService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        type: "LOGIN",
        entity: "auth",
        metadata: expect.objectContaining({ success: false }),
      })
    );
  });
});
