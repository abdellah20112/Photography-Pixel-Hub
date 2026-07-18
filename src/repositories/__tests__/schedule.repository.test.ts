import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    shoot: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    shootAssignment: { create: vi.fn(), delete: vi.fn(), findMany: vi.fn() },
    teamMember: { count: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { shootRepository } from "@/repositories/schedule.repository";

const mockShoot = {
  id: "shoot-1", shootCode: "SH-000001", projectId: "project-1",
  title: "Test", description: null, location: null,
  date: new Date("2026-06-15"), startTime: new Date("2026-06-15T10:00:00"),
  endTime: new Date("2026-06-15T14:00:00"), status: "SCHEDULED",
  notes: null, createdAt: new Date(), updatedAt: new Date(),
  project: { id: "project-1", name: "Test", projectCode: "PR-001" },
  _count: { assignments: 2 },
};

describe("shootRepository.findById", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls findUnique with includes", async () => {
    vi.mocked(prisma.shoot.findUnique).mockResolvedValue(mockShoot as never);
    await shootRepository.findById("shoot-1");
    expect(prisma.shoot.findUnique).toHaveBeenCalledWith({
      where: { id: "shoot-1" },
      include: {
        project: { select: { id: true, name: true, projectCode: true } },
        assignments: { include: {
          teamMember: { select: { id: true, fullName: true, employeeCode: true } },
          model: { select: { id: true, fullName: true, modelCode: true } },
        } },
      },
    });
  });
});

describe("shootRepository.findMany", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls findMany and count in parallel", async () => {
    vi.mocked(prisma.shoot.findMany).mockResolvedValue([mockShoot] as never);
    vi.mocked(prisma.shoot.count).mockResolvedValue(1);

    const result = await shootRepository.findMany({ search: "test", filter: "scheduled" });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("searches by code, title, location, project name", async () => {
    vi.mocked(prisma.shoot.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.shoot.count).mockResolvedValue(0);

    await shootRepository.findMany({ search: "test" });

    const call = vi.mocked(prisma.shoot.findMany).mock.calls[0]![0] as { where: { OR?: unknown[] } };
    expect(call.where.OR).toHaveLength(4);
  });
});

describe("shootRepository.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls create with data", async () => {
    vi.mocked(prisma.shoot.create).mockResolvedValue(mockShoot as never);
    const data = { shootCode: "SH-000001", projectId: "p1", title: "Test", date: new Date(), startTime: new Date(), endTime: new Date(), status: "SCHEDULED" } as never;
    await shootRepository.create(data);
    expect(prisma.shoot.create).toHaveBeenCalledWith({
      data,
      include: { project: { select: expect.any(Object) }, assignments: true },
    });
  });
});

describe("shootRepository.softDelete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets status to CANCELLED", async () => {
    vi.mocked(prisma.shoot.update).mockResolvedValue({ ...mockShoot, status: "CANCELLED" } as never);
    await shootRepository.softDelete("shoot-1");
    expect(prisma.shoot.update).toHaveBeenCalledWith({ where: { id: "shoot-1" }, data: { status: "CANCELLED" } });
  });
});

describe("shootRepository.findByDateRange", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls findMany with date range", async () => {
    vi.mocked(prisma.shoot.findMany).mockResolvedValue([mockShoot] as never);
    const start = new Date("2026-06-01");
    const end = new Date("2026-06-30");
    await shootRepository.findByDateRange(start, end);
    expect(prisma.shoot.findMany).toHaveBeenCalledWith({
      where: { date: { gte: start, lte: end }, status: { not: "CANCELLED" } },
      include: { project: { select: expect.any(Object) } },
      orderBy: { startTime: "asc" },
    });
  });
});

describe("shootRepository.findOverlappingShoots", () => {
  beforeEach(() => vi.clearAllMocks());

  it("finds overlapping assignments for team member", async () => {
    vi.mocked(prisma.shootAssignment.findMany).mockResolvedValue([] as never);
    const start = new Date("2026-06-15T10:00:00");
    const end = new Date("2026-06-15T14:00:00");
    await shootRepository.findOverlappingShoots("tm1", start, end);

    expect(prisma.shootAssignment.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        teamMemberId: "tm1",
        shoot: expect.objectContaining({
          startTime: { lt: end },
          endTime: { gt: start },
        }),
      }),
      include: { shoot: expect.any(Object) },
    });
  });
});

describe("shootRepository.getDashboardStats", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns dashboard stats", async () => {
    vi.mocked(prisma.shoot.count).mockResolvedValue(3).mockResolvedValueOnce(3).mockResolvedValueOnce(2).mockResolvedValueOnce(10);
    vi.mocked(prisma.teamMember.count).mockResolvedValue(5).mockResolvedValueOnce(5).mockResolvedValueOnce(10);

    const result = await shootRepository.getDashboardStats();
    expect(result.todayShoots).toBe(3);
    expect(result.busyTeam).toBe(5);
  });
});

describe("shootRepository.createAssignment", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates assignment with includes", async () => {
    vi.mocked(prisma.shootAssignment.create).mockResolvedValue({
      id: "a1", shootId: "s1", teamMemberId: "tm1", modelId: null, role: "مصور", createdAt: new Date(),
      teamMember: { id: "tm1", fullName: "Test", employeeCode: "EMP-001" },
      model: null,
    } as never);

    await shootRepository.createAssignment({ shootId: "s1", teamMemberId: "tm1", role: "مصور" });
    expect(prisma.shootAssignment.create).toHaveBeenCalledWith({
      data: { shootId: "s1", teamMemberId: "tm1", modelId: null, role: "مصور" },
      include: expect.any(Object),
    });
  });
});
