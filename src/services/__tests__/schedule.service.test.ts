import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/repositories/schedule.repository", () => ({
  shootRepository: {
    findById: vi.fn(),
    findByShootCode: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    findLatestShootCode: vi.fn(),
    findByDateRange: vi.fn(),
    findByDate: vi.fn(),
    createAssignment: vi.fn(),
    deleteAssignment: vi.fn(),
    findAssignmentsByShoot: vi.fn(),
    findOverlappingShoots: vi.fn(),
    findOverlappingShootsForModel: vi.fn(),
    getDashboardStats: vi.fn(),
  },
}));

vi.mock("@/services/activity.service", () => ({
  activityService: { log: vi.fn().mockResolvedValue(undefined), list: vi.fn(), count: vi.fn() },
}));

vi.mock("@/services/timeline.service", () => ({
  timelineService: { publish: vi.fn().mockResolvedValue(undefined), getByProject: vi.fn(), list: vi.fn(), getWorkflowStats: vi.fn() },
}));

vi.mock("@/lib/prisma", () => {
  const mockTx = { shoot: { findFirst: vi.fn() } };
  return {
    prisma: {
      ...mockTx,
      teamMember: { findUnique: vi.fn(), findMany: vi.fn() },
      model: { findUnique: vi.fn(), findMany: vi.fn() },
      $transaction: vi.fn(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)),
    },
  };
});

import { scheduleService, conflictDetectionService, availabilityService } from "@/services/schedule.service";
import { shootRepository } from "@/repositories/schedule.repository";

const mockShoot = {
  id: "shoot-1",
  shootCode: "SH-000001",
  projectId: "project-1",
  title: "Test Shoot",
  description: null,
  location: null,
  date: new Date("2026-06-15"),
  startTime: new Date("2026-06-15T10:00:00"),
  endTime: new Date("2026-06-15T14:00:00"),
  status: "SCHEDULED",
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  project: { id: "project-1", name: "Test Project", projectCode: "PR-000001" },
  assignments: [],
};

describe("scheduleService.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a shoot with generated code", async () => {
    vi.mocked(shootRepository.create).mockResolvedValue(mockShoot as never);

    const result = await scheduleService.create({
      projectId: "project-1",
      title: "Test Shoot",
      date: new Date("2026-06-15"),
      startTime: new Date("2026-06-15T10:00:00"),
      endTime: new Date("2026-06-15T14:00:00"),
    });

    expect(result).toEqual(mockShoot);
    expect(shootRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        shootCode: expect.any(String),
        projectId: "project-1",
        title: "Test Shoot",
        status: "SCHEDULED",
      })
    );
  });

  it("publishes SHOOT_CREATED timeline", async () => {
    vi.mocked(shootRepository.create).mockResolvedValue(mockShoot as never);
    const { timelineService } = await import("@/services/timeline.service");

    await scheduleService.create({
      projectId: "project-1", title: "Test", date: new Date("2026-06-15"),
      startTime: new Date("2026-06-15T10:00:00"), endTime: new Date("2026-06-15T14:00:00"),
    });

    expect(timelineService.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "SHOOT_CREATED", projectId: "project-1" })
    );
  });
});

describe("scheduleService.update", () => {
  beforeEach(() => vi.clearAllMocks());

  it("publishes SHOOT_CONFIRMED on status change", async () => {
    vi.mocked(shootRepository.findById).mockResolvedValue({ ...mockShoot, status: "SCHEDULED" } as never);
    vi.mocked(shootRepository.update).mockResolvedValue({ ...mockShoot, status: "CONFIRMED" } as never);
    const { timelineService } = await import("@/services/timeline.service");

    await scheduleService.update("shoot-1", {
      title: "Test", date: new Date("2026-06-15"),
      startTime: new Date("2026-06-15T10:00:00"), endTime: new Date("2026-06-15T14:00:00"),
      status: "CONFIRMED",
    });

    expect(timelineService.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "SHOOT_CONFIRMED" })
    );
  });

  it("publishes SHOOT_COMPLETED on completion", async () => {
    vi.mocked(shootRepository.findById).mockResolvedValue({ ...mockShoot, status: "IN_PROGRESS" } as never);
    vi.mocked(shootRepository.update).mockResolvedValue({ ...mockShoot, status: "COMPLETED" } as never);
    const { timelineService } = await import("@/services/timeline.service");

    await scheduleService.update("shoot-1", {
      title: "Test", date: new Date("2026-06-15"),
      startTime: new Date("2026-06-15T10:00:00"), endTime: new Date("2026-06-15T14:00:00"),
      status: "COMPLETED",
    });

    expect(timelineService.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "SHOOT_COMPLETED" })
    );
  });
});

describe("scheduleService.assign", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates assignment when no conflict", async () => {
    vi.mocked(shootRepository.findById).mockResolvedValue(mockShoot as never);
    vi.mocked(shootRepository.findOverlappingShoots).mockResolvedValue([] as never);
    vi.mocked(shootRepository.createAssignment).mockResolvedValue({ id: "a1" } as never);

    const result = await scheduleService.assign({
      shootId: "shoot-1", teamMemberId: "tm1", role: "مصور",
    });

    expect(result).toBeDefined();
  });

  it("throws on team member conflict", async () => {
    vi.mocked(shootRepository.findById).mockResolvedValue(mockShoot as never);
    vi.mocked(shootRepository.findOverlappingShoots).mockResolvedValue([{ id: "existing" }] as never);

    await expect(scheduleService.assign({
      shootId: "shoot-1", teamMemberId: "tm1", role: "مصور",
    })).rejects.toThrow("تعارض");
  });

  it("throws on model conflict", async () => {
    vi.mocked(shootRepository.findById).mockResolvedValue(mockShoot as never);
    vi.mocked(shootRepository.findOverlappingShootsForModel).mockResolvedValue([{ id: "existing" }] as never);

    await expect(scheduleService.assign({
      shootId: "shoot-1", modelId: "m1", role: "موديل",
    })).rejects.toThrow("تعارض");
  });
});

describe("conflictDetectionService.checkConflicts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns no conflicts when all available", async () => {
    vi.mocked(shootRepository.findOverlappingShoots).mockResolvedValue([] as never);
    vi.mocked(shootRepository.findOverlappingShootsForModel).mockResolvedValue([] as never);

    const result = await conflictDetectionService.checkConflicts({
      startTime: new Date("2026-06-15T10:00:00"),
      endTime: new Date("2026-06-15T14:00:00"),
      teamMemberIds: ["tm1"],
      modelIds: ["m1"],
    });

    expect(result.hasConflict).toBe(false);
    expect(result.conflicts).toHaveLength(0);
  });

  it("returns conflicts when team member has overlap", async () => {
    vi.mocked(shootRepository.findOverlappingShoots).mockResolvedValue([{ id: "overlap" }] as never);

    const result = await conflictDetectionService.checkConflicts({
      startTime: new Date("2026-06-15T10:00:00"),
      endTime: new Date("2026-06-15T14:00:00"),
      teamMemberIds: ["tm1"],
    });

    expect(result.hasConflict).toBe(true);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0]!.type).toBe("team_member");
  });
});

describe("availabilityService.isTeamMemberAvailable", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns true when no conflicts", async () => {
    vi.mocked(shootRepository.findOverlappingShoots).mockResolvedValue([] as never);
    const result = await availabilityService.isTeamMemberAvailable("tm1", new Date(), new Date());
    expect(result).toBe(true);
  });

  it("returns false when conflicts exist", async () => {
    vi.mocked(shootRepository.findOverlappingShoots).mockResolvedValue([{ id: "x" }] as never);
    const result = await availabilityService.isTeamMemberAvailable("tm1", new Date(), new Date());
    expect(result).toBe(false);
  });
});

describe("scheduleService.getDashboardStats", () => {
  it("delegates to repository", async () => {
    const stats = { todayShoots: 3, tomorrowShoots: 2, upcomingWeek: 10, busyTeam: 4, availableTeam: 6 };
    vi.mocked(shootRepository.getDashboardStats).mockResolvedValue(stats);

    const result = await scheduleService.getDashboardStats();
    expect(result).toEqual(stats);
  });
});
