import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── Mock dependencies ───────────────────── */

const { mockSupabaseClient } = vi.hoisted(() => ({
  mockSupabaseClient: {
    auth: {
      getUser: vi.fn(),
      signOut: vi.fn(),
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

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

/* ── Imports (after mocks) ────────────────── */

import {
  requireOwner,
  requireAdmin,
  requireEditor,
  requireMediaBuyer,
  requirePhotographer,
  hasMinimumRole,
  ROLE_HIERARCHY,
} from "@/lib/auth/permissions";
import { userRepository } from "@/repositories/user.repository";
import {
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth/errors";

/* ============================================
   Route Guard / Permission Tests
   Supabase Auth-based permission checks.
   ============================================ */

const mockUser = (
  role: "OWNER" | "ADMIN" | "EDITOR" | "MEDIA_BUYER" | "PHOTOGRAPHER" | "CLIENT"
) => ({
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  supabaseUid: "supabase-uid-1",
  role,
  avatar: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe("Route Guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* ── Unauthorized access ──────────────── */

  it("requireOwner throws UnauthorizedError when no session exists", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Auth session missing!" },
    });

    await expect(requireOwner()).rejects.toThrow(UnauthorizedError);
  });

  it("requireAdmin throws UnauthorizedError when no session exists", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Auth session missing!" },
    });

    await expect(requireAdmin()).rejects.toThrow(UnauthorizedError);
  });

  /* ── Forbidden access (wrong role) ─────── */

  it("requireOwner throws ForbiddenError for non-owner", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "supabase-uid-1" } },
      error: null,
    });
    vi.mocked(userRepository.findBySupabaseUid).mockResolvedValue(
      mockUser("PHOTOGRAPHER")
    );

    await expect(requireOwner()).rejects.toThrow(ForbiddenError);
  });

  it("requireAdmin throws ForbiddenError for photographer", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "supabase-uid-1" } },
      error: null,
    });
    vi.mocked(userRepository.findBySupabaseUid).mockResolvedValue(
      mockUser("PHOTOGRAPHER")
    );

    await expect(requireAdmin()).rejects.toThrow(ForbiddenError);
  });

  it("requireEditor throws ForbiddenError for media_buyer", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "supabase-uid-1" } },
      error: null,
    });
    vi.mocked(userRepository.findBySupabaseUid).mockResolvedValue(
      mockUser("MEDIA_BUYER")
    );

    await expect(requireEditor()).rejects.toThrow(ForbiddenError);
  });

  /* ── Allowed access ───────────────────── */

  it("requireOwner allows OWNER", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "supabase-uid-1" } },
      error: null,
    });
    vi.mocked(userRepository.findBySupabaseUid).mockResolvedValue(
      mockUser("OWNER")
    );

    const user = await requireOwner();
    expect(user.role).toBe("OWNER");
  });

  it("requireAdmin allows ADMIN", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "supabase-uid-1" } },
      error: null,
    });
    vi.mocked(userRepository.findBySupabaseUid).mockResolvedValue(
      mockUser("ADMIN")
    );

    const user = await requireAdmin();
    expect(user.role).toBe("ADMIN");
  });

  it("requireAdmin allows OWNER (hierarchy)", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "supabase-uid-1" } },
      error: null,
    });
    vi.mocked(userRepository.findBySupabaseUid).mockResolvedValue(
      mockUser("OWNER")
    );

    const user = await requireAdmin();
    expect(user.role).toBe("OWNER");
  });

  it("requireEditor allows EDITOR", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "supabase-uid-1" } },
      error: null,
    });
    vi.mocked(userRepository.findBySupabaseUid).mockResolvedValue(
      mockUser("EDITOR")
    );

    const user = await requireEditor();
    expect(user.role).toBe("EDITOR");
  });

  /* ── hasMinimumRole ───────────────────── */

  it("hasMinimumRole returns true for higher privilege", () => {
    expect(hasMinimumRole("OWNER", "ADMIN")).toBe(true);
  });

  it("hasMinimumRole returns false for lower privilege", () => {
    expect(hasMinimumRole("PHOTOGRAPHER", "ADMIN")).toBe(false);
  });

  it("hasMinimumRole returns true for same role", () => {
    expect(hasMinimumRole("EDITOR", "EDITOR")).toBe(true);
  });

  /* ── Role hierarchy ────────────────────── */

  it("ROLE_HIERARCHY is ordered from highest to lowest", () => {
    expect(ROLE_HIERARCHY[0]).toBe("OWNER");
    expect(ROLE_HIERARCHY[ROLE_HIERARCHY.length - 1]).toBe("CLIENT");
  });
});
