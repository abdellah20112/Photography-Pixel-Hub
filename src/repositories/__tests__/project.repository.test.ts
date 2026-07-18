import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── Mock dependencies ───────────────────── */

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    video: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    view: {
      count: vi.fn(),
    },
    download: {
      count: vi.fn(),
    },
  },
}));

/* ── Imports (after mocks) ────────────────── */

import { prisma } from "@/lib/prisma";
import { projectRepository } from "@/repositories/project.repository";

/* ============================================
   Project Repository Tests
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

describe("projectRepository.findById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls prisma.project.findUnique with correct id", async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as never);

    const result = await projectRepository.findById("project-1");

    expect(result).toEqual(mockProject);
    expect(prisma.project.findUnique).toHaveBeenCalledWith({
      where: { id: "project-1" },
      include: { client: true, videos: true },
    });
  });

  it("returns null when not found", async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(null);

    const result = await projectRepository.findById("nonexistent");

    expect(result).toBeNull();
  });
});

describe("projectRepository.findByProjectCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls prisma.project.findUnique with projectCode", async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as never);

    const result = await projectRepository.findByProjectCode("PR-000001");

    expect(result).toEqual(mockProject);
    expect(prisma.project.findUnique).toHaveBeenCalledWith({
      where: { projectCode: "PR-000001" },
      include: { client: true, videos: true },
    });
  });
});

describe("projectRepository.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls prisma.project.create with data", async () => {
    vi.mocked(prisma.project.create).mockResolvedValue(mockProject as never);

    const data = {
      projectCode: "PR-000001",
      clientId: "client-1",
      name: "Test",
      token: "tok",
      retentionPeriod: "TWENTY_FOUR_HOURS",
      deadline: new Date("2026-12-31"),
      status: "DRAFT",
    } as never;

    const result = await projectRepository.create(data);

    expect(result).toEqual(mockProject);
    expect(prisma.project.create).toHaveBeenCalledWith({
      data,
      include: { client: true, videos: true },
    });
  });
});

describe("projectRepository.update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls prisma.project.update with id and data", async () => {
    const updated = { ...mockProject, name: "Updated" } as never;
    vi.mocked(prisma.project.update).mockResolvedValue(updated);

    const result = await projectRepository.update("project-1", { name: "Updated" } as never);

    expect(result).toEqual(updated);
    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: "project-1" },
      data: { name: "Updated" },
      include: { client: true, videos: true },
    });
  });
});

describe("projectRepository.softDelete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets status to ARCHIVED and archivedAt", async () => {
    vi.mocked(prisma.project.update).mockResolvedValue({
      ...mockProject,
      status: "ARCHIVED",
      archivedAt: new Date(),
    } as never);

    await projectRepository.softDelete("project-1");

    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: "project-1" },
      data: {
        status: "ARCHIVED",
        archivedAt: expect.any(Date),
      },
      include: { client: true },
    });
  });
});

describe("projectRepository.restore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears archivedAt and sets status", async () => {
    vi.mocked(prisma.project.update).mockResolvedValue(mockProject as never);

    await projectRepository.restore("project-1");

    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: "project-1" },
      data: {
        status: "DRAFT",
        archivedAt: null,
      },
      include: { client: true },
    });
  });

  it("accepts custom status", async () => {
    vi.mocked(prisma.project.update).mockResolvedValue(mockProject as never);

    await projectRepository.restore("project-1", "COMPLETED");

    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: "project-1" },
      data: {
        status: "COMPLETED",
        archivedAt: null,
      },
      include: { client: true },
    });
  });
});

describe("projectRepository.findMany", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls findMany and count in parallel", async () => {
    vi.mocked(prisma.project.findMany).mockResolvedValue([mockProject as never] as never);
    vi.mocked(prisma.project.count).mockResolvedValue(1);

    const result = await projectRepository.findMany({
      skip: 0,
      take: 10,
      search: "test",
      filter: "all",
      sort: "newest",
    });

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 10,
        orderBy: { createdAt: "desc" },
      })
    );
  });

  it("uses oldest sort correctly", async () => {
    vi.mocked(prisma.project.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.project.count).mockResolvedValue(0);

    await projectRepository.findMany({
      skip: 0,
      take: 10,
      sort: "oldest",
    });

    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: "asc" },
      })
    );
  });

  it("uses deadline sort correctly", async () => {
    vi.mocked(prisma.project.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.project.count).mockResolvedValue(0);

    await projectRepository.findMany({
      skip: 0,
      take: 10,
      sort: "deadline",
    });

    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { deadline: "asc" },
      })
    );
  });

  it("uses alphabetical sort correctly", async () => {
    vi.mocked(prisma.project.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.project.count).mockResolvedValue(0);

    await projectRepository.findMany({
      skip: 0,
      take: 10,
      sort: "alphabetical",
    });

    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: "asc" },
      })
    );
  });

  it("excludes archived by default (all filter)", async () => {
    vi.mocked(prisma.project.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.project.count).mockResolvedValue(0);

    await projectRepository.findMany({
      filter: "all",
    });

    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { not: "ARCHIVED" },
        }),
      })
    );
  });

  it("filters archived only when filter is archived", async () => {
    vi.mocked(prisma.project.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.project.count).mockResolvedValue(0);

    await projectRepository.findMany({
      filter: "archived",
    });

    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "ARCHIVED",
        }),
      })
    );
  });

  it("searches by projectCode, name, and client name", async () => {
    vi.mocked(prisma.project.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.project.count).mockResolvedValue(0);

    await projectRepository.findMany({
      search: "test",
    });

    const call = vi.mocked(prisma.project.findMany).mock.calls[0]![0] as {
      where: { OR?: unknown[] };
    };
    expect(call.where.OR).toBeDefined();
    expect(call.where.OR).toHaveLength(3);
  });
});

describe("projectRepository.count", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls prisma.project.count with where clause", async () => {
    vi.mocked(prisma.project.count).mockResolvedValue(5);

    const result = await projectRepository.count({ status: "DRAFT" } as never);

    expect(result).toBe(5);
    expect(prisma.project.count).toHaveBeenCalledWith({ where: { status: "DRAFT" } });
  });

  it("calls without where when undefined", async () => {
    vi.mocked(prisma.project.count).mockResolvedValue(10);

    const result = await projectRepository.count();

    expect(result).toBe(10);
    expect(prisma.project.count).toHaveBeenCalledWith({ where: undefined });
  });
});

describe("projectRepository.findLatestProjectCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls findFirst with descending projectCode order", async () => {
    vi.mocked(prisma.project.findFirst).mockResolvedValue({
      projectCode: "PR-000005",
    } as never);

    const result = await projectRepository.findLatestProjectCode();

    expect(result).toEqual({ projectCode: "PR-000005" });
    expect(prisma.project.findFirst).toHaveBeenCalledWith({
      orderBy: { projectCode: "desc" },
      select: { projectCode: true },
    });
  });
});

describe("projectRepository.getStatistics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns aggregated statistics", async () => {
    vi.mocked(prisma.video.findMany).mockResolvedValue([
      { fileSize: BigInt(1024) },
      { fileSize: BigInt(2048) },
    ] as never);
    vi.mocked(prisma.view.count).mockResolvedValue(50);
    vi.mocked(prisma.download.count).mockResolvedValue(10);

    const result = await projectRepository.getStatistics("project-1");

    expect(result.videos).toBe(2);
    expect(result.views).toBe(50);
    expect(result.downloads).toBe(10);
    expect(result.storageSize).toBe(3072);
  });

  it("returns zeros when no videos", async () => {
    vi.mocked(prisma.video.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.view.count).mockResolvedValue(0);
    vi.mocked(prisma.download.count).mockResolvedValue(0);

    const result = await projectRepository.getStatistics("project-1");

    expect(result.videos).toBe(0);
    expect(result.views).toBe(0);
    expect(result.downloads).toBe(0);
    expect(result.storageSize).toBe(0);
  });
});

describe("projectRepository.findAllForExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches non-archived projects with client info", async () => {
    vi.mocked(prisma.project.findMany).mockResolvedValue([mockProject as never] as never);

    const result = await projectRepository.findAllForExport();

    expect(result).toHaveLength(1);
    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { not: "ARCHIVED" },
        }),
        orderBy: { createdAt: "desc" },
      })
    );
  });

  it("filters by clientId when provided", async () => {
    vi.mocked(prisma.project.findMany).mockResolvedValue([] as never);

    await projectRepository.findAllForExport("client-1");

    const call = vi.mocked(prisma.project.findMany).mock.calls[0]![0] as {
      where: { clientId?: string };
    };
    expect(call.where.clientId).toBe("client-1");
  });
});
