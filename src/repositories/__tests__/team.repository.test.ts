import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    teamMember: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    projectAssignment: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), findMany: vi.fn(), count: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { teamRepository } from "@/repositories/team.repository";

const mockMember = {
  id: "member-1", employeeCode: "EMP-000001", fullName: "Test", email: "test@studio.com",
  phone: "050", photo: null, role: "PHOTOGRAPHER", status: "ACTIVE",
  joinDate: new Date(), notes: null, createdAt: new Date(), updatedAt: new Date(),
  _count: { projectAssignments: 3 },
};

describe("teamRepository.findById", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls findUnique with includes", async () => {
    vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(mockMember as never);
    await teamRepository.findById("member-1");
    expect(prisma.teamMember.findUnique).toHaveBeenCalledWith({
      where: { id: "member-1" },
      include: { projectAssignments: { include: { project: { select: { id: true, name: true, projectCode: true } } } } },
    });
  });
});

describe("teamRepository.findMany", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls findMany and count in parallel", async () => {
    vi.mocked(prisma.teamMember.findMany).mockResolvedValue([mockMember] as never);
    vi.mocked(prisma.teamMember.count).mockResolvedValue(1);

    const result = await teamRepository.findMany({ search: "test", filter: "active" });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("searches by name, code, phone, email", async () => {
    vi.mocked(prisma.teamMember.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.teamMember.count).mockResolvedValue(0);

    await teamRepository.findMany({ search: "test" });

    const call = vi.mocked(prisma.teamMember.findMany).mock.calls[0]![0] as { where: { OR?: unknown[] } };
    expect(call.where.OR).toHaveLength(4);
  });
});

describe("teamRepository.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls create with data", async () => {
    vi.mocked(prisma.teamMember.create).mockResolvedValue(mockMember as never);
    const data = { employeeCode: "EMP-000001", fullName: "Test", email: "test@studio.com", phone: "050", role: "PHOTOGRAPHER", status: "ACTIVE", joinDate: new Date() } as never;
    await teamRepository.create(data);
    expect(prisma.teamMember.create).toHaveBeenCalledWith({ data });
  });
});

describe("teamRepository.softDelete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets status to INACTIVE", async () => {
    vi.mocked(prisma.teamMember.update).mockResolvedValue({ ...mockMember, status: "INACTIVE" } as never);
    await teamRepository.softDelete("member-1");
    expect(prisma.teamMember.update).toHaveBeenCalledWith({ where: { id: "member-1" }, data: { status: "INACTIVE" } });
  });
});

describe("teamRepository.getStatistics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns active, completed, thisMonth counts", async () => {
    vi.mocked(prisma.projectAssignment.count).mockResolvedValue(3).mockResolvedValueOnce(3).mockResolvedValueOnce(5).mockResolvedValueOnce(2);
    const result = await teamRepository.getStatistics("member-1");
    expect(result.activeProjects).toBe(3);
    expect(result.completedProjects).toBe(5);
    expect(result.projectsThisMonth).toBe(2);
  });
});

describe("teamRepository.getDashboardStats", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns dashboard stats", async () => {
    vi.mocked(prisma.teamMember.count).mockResolvedValue(10).mockResolvedValueOnce(10).mockResolvedValueOnce(5).mockResolvedValueOnce(2).mockResolvedValueOnce(3);
    const result = await teamRepository.getDashboardStats();
    expect(result.activeEmployees).toBe(10);
    expect(result.busyEmployees).toBe(5);
    expect(result.editorsWorking).toBe(2);
    expect(result.photographersWorking).toBe(3);
  });
});

describe("teamRepository.createAssignment", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates assignment with includes", async () => {
    vi.mocked(prisma.projectAssignment.create).mockResolvedValue({
      id: "a1", projectId: "p1", teamMemberId: "m1", role: "PHOTOGRAPHER",
      teamMember: { id: "m1", fullName: "Test", employeeCode: "EMP-001", phone: "050", photo: null },
    } as never);

    await teamRepository.createAssignment({ projectId: "p1", teamMemberId: "m1", role: "PHOTOGRAPHER" });
    expect(prisma.projectAssignment.create).toHaveBeenCalledWith({
      data: { projectId: "p1", teamMemberId: "m1", role: "PHOTOGRAPHER" },
      include: { teamMember: { select: { id: true, fullName: true, employeeCode: true, phone: true, photo: true } } },
    });
  });
});
