import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── Mock dependencies ───────────────────── */

vi.mock("@/repositories/project.repository", () => ({
  projectRepository: {
    findById: vi.fn(),
    findByProjectCode: vi.fn(),
    findByToken: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    restore: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    findLatestProjectCode: vi.fn(),
    getStatistics: vi.fn(),
    findAllForExport: vi.fn(),
  },
}));

vi.mock("@/services/activity.service", () => ({
  activityService: {
    log: vi.fn().mockResolvedValue(undefined),
    list: vi.fn().mockResolvedValue([]),
    count: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => {
  const mockTx = {
    project: {
      findFirst: vi.fn(),
    },
  };
  return {
    prisma: {
      ...mockTx,
      $transaction: vi.fn(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)),
    },
  };
});

vi.mock("@/lib/utils", () => ({
  generateToken: vi.fn(() => "mock-token-12345678901234567890123456789012"),
}));

/* ── Imports (after mocks) ────────────────── */

import { projectService } from "@/services/project.service";
import { projectRepository } from "@/repositories/project.repository";

/* ============================================
   Project Service Tests
   ============================================ */

const mockProject = {
  id: "project-1",
  projectCode: "PR-000001",
  clientId: "client-1",
  name: "Test Project",
  description: null,
  status: "DRAFT" as const,
  retentionPeriod: "TWENTY_FOUR_HOURS" as const,
  deadline: new Date("2026-12-31"),
  token: "test-token",
  archivedAt: null,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  client: { id: "client-1", name: "Test Client", clientCode: "CL-000001" },
  videos: [],
};

describe("projectService.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a project with generated projectCode and token", async () => {
    vi.mocked(projectRepository.create).mockResolvedValue(mockProject as never);

    const result = await projectService.create({
      clientId: "client-1",
      name: "Test Project",
      retentionPeriod: "TWENTY_FOUR_HOURS",
      deadline: new Date("2026-12-31"),
    });

    expect(result).toEqual(mockProject);
    expect(projectRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "client-1",
        name: "Test Project",
        projectCode: expect.any(String),
        token: expect.any(String),
        retentionPeriod: "TWENTY_FOUR_HOURS",
      })
    );
  });

  it("trims name and description", async () => {
    vi.mocked(projectRepository.create).mockResolvedValue(mockProject as never);

    await projectService.create({
      clientId: "client-1",
      name: "  Test Project  ",
      description: "  A description  ",
      retentionPeriod: "TWENTY_FOUR_HOURS",
      deadline: new Date("2026-12-31"),
    });

    expect(projectRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Test Project",
        description: "A description",
      })
    );
  });

  it("converts empty description to null", async () => {
    vi.mocked(projectRepository.create).mockResolvedValue(mockProject as never);

    await projectService.create({
      clientId: "client-1",
      name: "Test",
      description: "",
      retentionPeriod: "TWENTY_FOUR_HOURS",
      deadline: new Date("2026-12-31"),
    });

    expect(projectRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: null,
      })
    );
  });

  it("defaults status to DRAFT when not provided", async () => {
    vi.mocked(projectRepository.create).mockResolvedValue(mockProject as never);

    await projectService.create({
      clientId: "client-1",
      name: "Test",
      retentionPeriod: "TWENTY_FOUR_HOURS",
      deadline: new Date("2026-12-31"),
    });

    expect(projectRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "DRAFT",
      })
    );
  });

  it("logs activity when actorId is provided", async () => {
    vi.mocked(projectRepository.create).mockResolvedValue(mockProject as never);
    const { activityService } = await import("@/services/activity.service");

    await projectService.create(
      {
        clientId: "client-1",
        name: "Test",
        retentionPeriod: "TWENTY_FOUR_HOURS",
        deadline: new Date("2026-12-31"),
      },
      { actorId: "user-1" }
    );

    expect(activityService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        type: "CREATE",
        entity: "project",
        entityId: "project-1",
      })
    );
  });

  it("does not log activity when actorId is not provided", async () => {
    vi.mocked(projectRepository.create).mockResolvedValue(mockProject as never);
    const { activityService } = await import("@/services/activity.service");

    await projectService.create({
      clientId: "client-1",
      name: "Test",
      retentionPeriod: "TWENTY_FOUR_HOURS",
      deadline: new Date("2026-12-31"),
    });

    expect(activityService.log).not.toHaveBeenCalled();
  });
});

describe("projectService.update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates a project and returns the result", async () => {
    const updated = { ...mockProject, name: "Updated Name" } as never;
    vi.mocked(projectRepository.findById).mockResolvedValue(mockProject as never);
    vi.mocked(projectRepository.update).mockResolvedValue(updated);

    const result = await projectService.update("project-1", {
      name: "Updated Name",
      retentionPeriod: "TWENTY_FOUR_HOURS",
      deadline: new Date("2026-12-31"),
      status: "DRAFT",
    });

    expect(result.name).toBe("Updated Name");
  });

  it("logs UPDATE activity when actorId provided", async () => {
    vi.mocked(projectRepository.findById).mockResolvedValue(mockProject as never);
    vi.mocked(projectRepository.update).mockResolvedValue(mockProject as never);
    const { activityService } = await import("@/services/activity.service");

    await projectService.update(
      "project-1",
      {
        name: "Test",
        retentionPeriod: "TWENTY_FOUR_HOURS",
        deadline: new Date("2026-12-31"),
        status: "DRAFT",
      },
      { actorId: "user-1" }
    );

    expect(activityService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        type: "UPDATE",
        entity: "project",
        entityId: "project-1",
      })
    );
  });

  it("logs RETENTION_CHANGE when retention period changes", async () => {
    vi.mocked(projectRepository.findById).mockResolvedValue({
      ...mockProject,
      retentionPeriod: "TWENTY_FOUR_HOURS",
    } as never);
    vi.mocked(projectRepository.update).mockResolvedValue({
      ...mockProject,
      retentionPeriod: "SEVEN_DAYS",
    } as never);
    const { activityService } = await import("@/services/activity.service");

    await projectService.update(
      "project-1",
      {
        name: "Test",
        retentionPeriod: "SEVEN_DAYS",
        deadline: new Date("2026-12-31"),
        status: "DRAFT",
      },
      { actorId: "user-1" }
    );

    expect(activityService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "RETENTION_CHANGE",
        entity: "project",
        entityId: "project-1",
      })
    );
  });

  it("does not log RETENTION_CHANGE when retention is unchanged", async () => {
    vi.mocked(projectRepository.findById).mockResolvedValue({
      ...mockProject,
      retentionPeriod: "TWENTY_FOUR_HOURS",
    } as never);
    vi.mocked(projectRepository.update).mockResolvedValue(mockProject as never);
    const { activityService } = await import("@/services/activity.service");

    await projectService.update(
      "project-1",
      {
        name: "Test",
        retentionPeriod: "TWENTY_FOUR_HOURS",
        deadline: new Date("2026-12-31"),
        status: "DRAFT",
      },
      { actorId: "user-1" }
    );

    const retentionCalls = vi.mocked(activityService.log).mock.calls.filter(
      (call) => (call[0] as { type: string }).type === "RETENTION_CHANGE"
    );
    expect(retentionCalls).toHaveLength(0);
  });
});

describe("projectService.archive (soft delete)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls softDelete on repository", async () => {
    vi.mocked(projectRepository.softDelete).mockResolvedValue(mockProject as never);

    await projectService.archive("project-1");

    expect(projectRepository.softDelete).toHaveBeenCalledWith("project-1");
  });

  it("logs ARCHIVE activity when actorId provided", async () => {
    vi.mocked(projectRepository.softDelete).mockResolvedValue(mockProject as never);
    const { activityService } = await import("@/services/activity.service");

    await projectService.archive("project-1", { actorId: "user-1" });

    expect(activityService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        type: "ARCHIVE",
        entity: "project",
        entityId: "project-1",
      })
    );
  });

  it("delete() delegates to archive()", async () => {
    vi.mocked(projectRepository.softDelete).mockResolvedValue(mockProject as never);

    await projectService.delete("project-1");

    expect(projectRepository.softDelete).toHaveBeenCalledWith("project-1");
  });
});

describe("projectService.restore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls restore on repository", async () => {
    vi.mocked(projectRepository.restore).mockResolvedValue(mockProject as never);

    await projectService.restore("project-1");

    expect(projectRepository.restore).toHaveBeenCalledWith("project-1");
  });

  it("logs RESTORE activity when actorId provided", async () => {
    vi.mocked(projectRepository.restore).mockResolvedValue(mockProject as never);
    const { activityService } = await import("@/services/activity.service");

    await projectService.restore("project-1", { actorId: "user-1" });

    expect(activityService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        type: "RESTORE",
        entity: "project",
        entityId: "project-1",
      })
    );
  });
});

describe("projectService.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes search, filter, sort to repository", async () => {
    vi.mocked(projectRepository.findMany).mockResolvedValue({
      items: [mockProject],
      total: 1,
    } as never);

    await projectService.list({
      skip: 0,
      take: 10,
      search: "test",
      filter: "draft",
      sort: "newest",
    });

    expect(projectRepository.findMany).toHaveBeenCalledWith({
      skip: 0,
      take: 10,
      search: "test",
      filter: "draft",
      sort: "newest",
    });
  });
});

describe("projectService.count", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("counts non-archived for default filter", async () => {
    vi.mocked(projectRepository.count).mockResolvedValue(5);

    const result = await projectService.count({});

    expect(result).toBe(5);
    expect(projectRepository.count).toHaveBeenCalledWith({
      clientId: undefined,
      status: { not: "ARCHIVED" },
    });
  });

  it("counts archived when filter is archived", async () => {
    vi.mocked(projectRepository.count).mockResolvedValue(2);

    const result = await projectService.count({ filter: "archived" });

    expect(result).toBe(2);
    expect(projectRepository.count).toHaveBeenCalledWith({
      clientId: undefined,
      status: "ARCHIVED",
    });
  });

  it("counts specific status when filter is provided", async () => {
    vi.mocked(projectRepository.count).mockResolvedValue(3);

    const result = await projectService.count({ filter: "completed" });

    expect(result).toBe(3);
    expect(projectRepository.count).toHaveBeenCalledWith({
      clientId: undefined,
      status: "COMPLETED",
    });
  });
});

describe("projectService.getStatistics", () => {
  it("delegates to repository.getStatistics", async () => {
    const stats = { videos: 5, views: 100, downloads: 20, storageSize: 1024 };
    vi.mocked(projectRepository.getStatistics).mockResolvedValue(stats);

    const result = await projectService.getStatistics("project-1");

    expect(result).toEqual(stats);
    expect(projectRepository.getStatistics).toHaveBeenCalledWith("project-1");
  });
});

describe("projectService.exportCsv", () => {
  it("generates CSV with headers and data rows", async () => {
    vi.mocked(projectRepository.findAllForExport).mockResolvedValue([
      {
        ...mockProject,
        client: { name: "Test Client", clientCode: "CL-000001" },
        _count: { videos: 3 },
      },
    ] as never);

    const csv = await projectService.exportCsv();

    expect(csv).toContain("كود المشروع");
    expect(csv).toContain("اسم المشروع");
    expect(csv).toContain("PR-000001");
    expect(csv).toContain("Test Project");
    expect(csv).toContain("Test Client");
    expect(csv).toContain("DRAFT");
    expect(csv.startsWith("\uFEFF")).toBe(true); // BOM for Excel
  });

  it("returns only headers when no projects", async () => {
    vi.mocked(projectRepository.findAllForExport).mockResolvedValue([]);

    const csv = await projectService.exportCsv();

    expect(csv).toContain("كود المشروع");
    expect(csv.split("\n").filter((l) => l.trim()).length).toBe(1); // headers only (plus BOM)
  });

  it("escapes fields containing commas", async () => {
    vi.mocked(projectRepository.findAllForExport).mockResolvedValue([
      {
        ...mockProject,
        name: "Name, with comma",
        client: { name: "Client Name", clientCode: "CL-000001" },
        _count: { videos: 0 },
      },
    ] as never);

    const csv = await projectService.exportCsv();

    expect(csv).toContain('"Name, with comma"');
  });
});
