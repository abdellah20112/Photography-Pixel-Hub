import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── Mock Prisma (use vi.hoisted for hoisting-safe refs) ─── */

const { mockClient: mockClientModel } = vi.hoisted(() => ({
  mockClient: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
}));

const { mockProject, mockVideo, mockDownload, mockView } = vi.hoisted(() => ({
  mockProject: { count: vi.fn(), findMany: vi.fn() },
  mockVideo: { count: vi.fn() },
  mockDownload: { count: vi.fn() },
  mockView: { count: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    client: mockClientModel,
    project: mockProject,
    video: mockVideo,
    download: mockDownload,
    view: mockView,
  },
}));

/* ── Import after mock ────────────────────── */

import { clientRepository } from "@/repositories/client.repository";
import { prisma } from "@/lib/prisma";

/* ============================================
   Client Repository Tests
   ============================================ */

const mockClient = {
  id: "client-1",
  userId: "user-1",
  clientCode: "CL-000001",
  name: "Test Client",
  company: null,
  email: "test@example.com",
  phone: null,
  notes: null,
  status: "ACTIVE",
  token: "token",
  archivedAt: null,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  projects: [],
  _count: { projects: 0, downloads: 0, views: 0 },
};

describe("clientRepository.findById", () => {
  beforeEach(() => vi.clearAllMocks());

  it("finds a client by id with relations", async () => {
    mockClientModel.findUnique.mockResolvedValue(mockClient);

    const result = await clientRepository.findById("client-1");

    expect(result).toEqual(mockClient);
    expect(mockClientModel.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "client-1" },
      })
    );
  });

  it("returns null when client not found", async () => {
    mockClientModel.findUnique.mockResolvedValue(null);

    const result = await clientRepository.findById("nonexistent");

    expect(result).toBeNull();
  });
});

describe("clientRepository.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a client with provided data", async () => {
    mockClientModel.create.mockResolvedValue(mockClient);

    await clientRepository.create({
      userId: "user-1",
      clientCode: "CL-000001",
      name: "Test Client",
      email: "test@example.com",
      token: "token",
      status: "ACTIVE",
    });

    expect(mockClientModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Test Client",
          clientCode: "CL-000001",
        }),
      })
    );
  });
});

describe("clientRepository.update", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates a client by id", async () => {
    const updated = { ...mockClient, name: "Updated" };
    mockClientModel.update.mockResolvedValue(updated);

    await clientRepository.update("client-1", { name: "Updated" });

    expect(mockClientModel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "client-1" },
        data: { name: "Updated" },
      })
    );
  });
});

describe("clientRepository.softDelete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets status to ARCHIVED and archivedAt", async () => {
    mockClientModel.update.mockResolvedValue({ ...mockClient, status: "ARCHIVED" });

    await clientRepository.softDelete("client-1");

    expect(mockClientModel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "client-1" },
        data: expect.objectContaining({
          status: "ARCHIVED",
          archivedAt: expect.any(Date),
        }),
      })
    );
  });
});

describe("clientRepository.restore", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets status to ACTIVE and clears archivedAt", async () => {
    mockClientModel.update.mockResolvedValue({ ...mockClient, status: "ACTIVE" });

    await clientRepository.restore("client-1");

    expect(mockClientModel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "client-1" },
        data: expect.objectContaining({
          status: "ACTIVE",
          archivedAt: null,
        }),
      })
    );
  });
});

describe("clientRepository.findMany", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns items and total count", async () => {
    mockClientModel.findMany.mockResolvedValue([mockClient]);
    mockClientModel.count.mockResolvedValue(1);

    const result = await clientRepository.findMany({
      userId: "user-1",
      skip: 0,
      take: 10,
      search: "test",
      filter: "all",
      sort: "newest",
    });

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("builds search WHERE clause with OR conditions", async () => {
    mockClientModel.findMany.mockResolvedValue([]);
    mockClientModel.count.mockResolvedValue(0);

    await clientRepository.findMany({
      userId: "user-1",
      search: "john",
      filter: "all",
      sort: "newest",
    });

    const call = mockClientModel.findMany.mock.calls[0]![0] as Record<string, unknown>;
    const where = call.where as Record<string, unknown>;
    expect(where).toHaveProperty("OR");
    const orConditions = where.OR as unknown[];
    expect(orConditions).toHaveLength(5);
    expect(orConditions[0]).toEqual({
      clientCode: { contains: "john", mode: "insensitive" },
    });
  });

  it("excludes ARCHIVED when filter is 'all'", async () => {
    mockClientModel.findMany.mockResolvedValue([]);
    mockClientModel.count.mockResolvedValue(0);

    await clientRepository.findMany({
      userId: "user-1",
      filter: "all",
      sort: "newest",
    });

    const call = mockClientModel.findMany.mock.calls[0]![0] as Record<string, unknown>;
    const where = call.where as Record<string, unknown>;
    expect(where).toEqual({
      userId: "user-1",
      status: { not: "ARCHIVED" },
    });
  });

  it("filters by ACTIVE when filter is 'active'", async () => {
    mockClientModel.findMany.mockResolvedValue([]);
    mockClientModel.count.mockResolvedValue(0);

    await clientRepository.findMany({
      userId: "user-1",
      filter: "active",
      sort: "newest",
    });

    const call = mockClientModel.findMany.mock.calls[0]![0] as Record<string, unknown>;
    const where = call.where as Record<string, unknown>;
    expect(where.status).toBe("ACTIVE");
  });

  it("filters by ARCHIVED when filter is 'archived'", async () => {
    mockClientModel.findMany.mockResolvedValue([]);
    mockClientModel.count.mockResolvedValue(0);

    await clientRepository.findMany({
      userId: "user-1",
      filter: "archived",
      sort: "newest",
    });

    const call = mockClientModel.findMany.mock.calls[0]![0] as Record<string, unknown>;
    const where = call.where as Record<string, unknown>;
    expect(where.status).toBe("ARCHIVED");
  });

  it("filters by BLOCKED when filter is 'blocked'", async () => {
    mockClientModel.findMany.mockResolvedValue([]);
    mockClientModel.count.mockResolvedValue(0);

    await clientRepository.findMany({
      userId: "user-1",
      filter: "blocked",
      sort: "newest",
    });

    const call = mockClientModel.findMany.mock.calls[0]![0] as Record<string, unknown>;
    const where = call.where as Record<string, unknown>;
    expect(where.status).toBe("BLOCKED");
  });

  it("sorts by createdAt desc for 'newest'", async () => {
    mockClientModel.findMany.mockResolvedValue([]);
    mockClientModel.count.mockResolvedValue(0);

    await clientRepository.findMany({
      userId: "user-1",
      filter: "all",
      sort: "newest",
    });

    const call = mockClientModel.findMany.mock.calls[0]![0] as Record<string, unknown>;
    expect(call.orderBy).toEqual({ createdAt: "desc" });
  });

  it("sorts by createdAt asc for 'oldest'", async () => {
    mockClientModel.findMany.mockResolvedValue([]);
    mockClientModel.count.mockResolvedValue(0);

    await clientRepository.findMany({
      userId: "user-1",
      filter: "all",
      sort: "oldest",
    });

    const call = mockClientModel.findMany.mock.calls[0]![0] as Record<string, unknown>;
    expect(call.orderBy).toEqual({ createdAt: "asc" });
  });

  it("sorts by name asc for 'alphabetical'", async () => {
    mockClientModel.findMany.mockResolvedValue([]);
    mockClientModel.count.mockResolvedValue(0);

    await clientRepository.findMany({
      userId: "user-1",
      filter: "all",
      sort: "alphabetical",
    });

    const call = mockClientModel.findMany.mock.calls[0]![0] as Record<string, unknown>;
    expect(call.orderBy).toEqual({ name: "asc" });
  });
});

describe("clientRepository.findAllForExport", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns non-archived clients for a user", async () => {
    mockClientModel.findMany.mockResolvedValue([mockClient]);

    await clientRepository.findAllForExport("user-1");

    expect(mockClientModel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-1",
          status: { not: "ARCHIVED" },
        }),
      })
    );
  });
});

describe("clientRepository.getStatistics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns counts for projects, downloads, views, and videos", async () => {
    vi.mocked(prisma.project.count).mockResolvedValue(3);
    vi.mocked(prisma.download.count).mockResolvedValue(10);
    vi.mocked(prisma.view.count).mockResolvedValue(50);
    vi.mocked(prisma.project.findMany).mockResolvedValue([
      { id: "p1", name: "P1", status: "DRAFT", token: "t1", clientId: "c1", description: null, expiresAt: null, createdAt: new Date(), updatedAt: new Date() },
      { id: "p2", name: "P2", status: "DRAFT", token: "t2", clientId: "c1", description: null, expiresAt: null, createdAt: new Date(), updatedAt: new Date() },
      { id: "p3", name: "P3", status: "DRAFT", token: "t3", clientId: "c1", description: null, expiresAt: null, createdAt: new Date(), updatedAt: new Date() },
    ] as never);
    vi.mocked(prisma.video.count).mockResolvedValue(7);

    const result = await clientRepository.getStatistics("client-1");

    expect(result).toEqual({
      projects: 3,
      videos: 7,
      downloads: 10,
      views: 50,
    });
  });
});
