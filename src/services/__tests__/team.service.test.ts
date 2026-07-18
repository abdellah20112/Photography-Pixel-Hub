import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/repositories/team.repository", () => ({
  teamRepository: {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByEmployeeCode: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    restore: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    findLatestEmployeeCode: vi.fn(),
    getStatistics: vi.fn(),
    findAssignment: vi.fn(),
    createAssignment: vi.fn(),
    updateAssignment: vi.fn(),
    deleteAssignment: vi.fn(),
    findAssignmentsByProject: vi.fn(),
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
  const mockTx = { teamMember: { findFirst: vi.fn() }, projectAssignment: { findUnique: vi.fn() } };
  return {
    prisma: { ...mockTx, $transaction: vi.fn(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)) },
  };
});

import { teamService } from "@/services/team.service";
import { teamRepository } from "@/repositories/team.repository";

const mockMember = {
  id: "member-1",
  employeeCode: "EMP-000001",
  fullName: "Test Member",
  email: "test@studio.com",
  phone: "0501234567",
  photo: null,
  role: "PHOTOGRAPHER",
  status: "ACTIVE",
  joinDate: new Date(),
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAssignment = {
  id: "assignment-1",
  projectId: "project-1",
  teamMemberId: "member-1",
  role: "PHOTOGRAPHER",
  assignedAt: new Date(),
  completedAt: null,
  notes: null,
  teamMember: { id: "member-1", fullName: "Test Member", employeeCode: "EMP-000001", phone: "050", photo: null },
};

describe("teamService.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a member with generated code", async () => {
    vi.mocked(teamRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(teamRepository.create).mockResolvedValue(mockMember as never);

    const result = await teamService.create({
      fullName: "Test Member",
      email: "test@studio.com",
      phone: "0501234567",
      role: "PHOTOGRAPHER",
      joinDate: new Date(),
    });

    expect(result).toEqual(mockMember);
    expect(teamRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        employeeCode: expect.any(String),
        fullName: "Test Member",
        role: "PHOTOGRAPHER",
      })
    );
  });

  it("throws on duplicate email", async () => {
    vi.mocked(teamRepository.findByEmail).mockResolvedValue(mockMember as never);

    await expect(teamService.create({
      fullName: "Test", email: "test@studio.com", phone: "050", role: "PHOTOGRAPHER", joinDate: new Date(),
    })).rejects.toThrow("مستخدم بالفعل");
  });
});

describe("teamService.softDelete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets status to INACTIVE", async () => {
    vi.mocked(teamRepository.softDelete).mockResolvedValue(mockMember as never);
    await teamService.softDelete("member-1");
    expect(teamRepository.softDelete).toHaveBeenCalledWith("member-1");
  });
});

describe("teamService.assignToProject", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates assignment", async () => {
    vi.mocked(teamRepository.findAssignment).mockResolvedValue(null);
    vi.mocked(teamRepository.createAssignment).mockResolvedValue(mockAssignment as never);

    const result = await teamService.assignToProject({
      projectId: "project-1",
      teamMemberId: "member-1",
      role: "PHOTOGRAPHER",
    });

    expect(result).toBeDefined();
  });

  it("throws on duplicate assignment", async () => {
    vi.mocked(teamRepository.findAssignment).mockResolvedValue({ id: "existing" } as never);

    await expect(teamService.assignToProject({
      projectId: "project-1", teamMemberId: "member-1", role: "PHOTOGRAPHER",
    })).rejects.toThrow("مُعيّن بالفعل");
  });

  it("publishes TEAM_MEMBER_ASSIGNED timeline", async () => {
    vi.mocked(teamRepository.findAssignment).mockResolvedValue(null);
    vi.mocked(teamRepository.createAssignment).mockResolvedValue(mockAssignment as never);
    const { timelineService } = await import("@/services/timeline.service");

    await teamService.assignToProject({
      projectId: "project-1", teamMemberId: "member-1", role: "EDITOR",
    });

    expect(timelineService.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "TEAM_MEMBER_ASSIGNED",
        projectId: "project-1",
      })
    );
  });
});

describe("teamService.getStatistics", () => {
  it("delegates to repository", async () => {
    const stats = { activeProjects: 3, completedProjects: 5, projectsThisMonth: 2 };
    vi.mocked(teamRepository.getStatistics).mockResolvedValue(stats);

    const result = await teamService.getStatistics("member-1");
    expect(result).toEqual(stats);
  });
});

describe("teamService.getDashboardStats", () => {
  it("delegates to repository", async () => {
    const stats = { activeEmployees: 10, busyEmployees: 5, editorsWorking: 2, photographersWorking: 3 };
    vi.mocked(teamRepository.getDashboardStats).mockResolvedValue(stats);

    const result = await teamService.getDashboardStats();
    expect(result).toEqual(stats);
  });
});
