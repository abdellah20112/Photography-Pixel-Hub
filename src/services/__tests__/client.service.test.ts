import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── Mock dependencies ───────────────────── */

vi.mock("@/repositories/client.repository", () => ({
  clientRepository: {
    findById: vi.fn(),
    findByClientCode: vi.fn(),
    findByToken: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    restore: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    countAll: vi.fn(),
    findLatestClientCode: vi.fn(),
    getStatistics: vi.fn(),
    findAllForExport: vi.fn(),
  },
}));

vi.mock("@/services/activity.service", () => ({
  activityService: {
    log: vi.fn().mockResolvedValue(undefined),
    list: vi.fn(),
    count: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => {
  const mockTx = {
    client: {
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

import { clientService } from "@/services/client.service";
import { clientRepository } from "@/repositories/client.repository";

/* ============================================
   Client Service Tests
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
  status: "ACTIVE" as const,
  token: "test-token",
  archivedAt: null,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  projects: [],
  _count: { projects: 0, downloads: 0, views: 0 },
};

describe("clientService.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a client with generated clientCode and token", async () => {
    vi.mocked(clientRepository.create).mockResolvedValue(mockClient);

    const result = await clientService.create({
      userId: "user-1",
      name: "Test Client",
      email: "test@example.com",
    });

    expect(result).toEqual(mockClient);
    expect(clientRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        name: "Test Client",
        email: "test@example.com",
        clientCode: expect.any(String),
        token: expect.any(String),
      })
    );
  });

  it("normalizes email to lowercase and trims fields", async () => {
    vi.mocked(clientRepository.create).mockResolvedValue(mockClient);

    await clientService.create({
      userId: "user-1",
      name: "  Test Client  ",
      email: "  TEST@EXAMPLE.COM  ",
      phone: "  0501234567  ",
    });

    expect(clientRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Test Client",
        email: "test@example.com",
        phone: "0501234567",
      })
    );
  });

  it("converts empty company/phone/notes to null", async () => {
    vi.mocked(clientRepository.create).mockResolvedValue(mockClient);

    await clientService.create({
      userId: "user-1",
      name: "Test",
      email: "test@example.com",
      company: "",
      phone: "",
      notes: "",
    });

    expect(clientRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        company: null,
        phone: null,
        notes: null,
      })
    );
  });

  it("logs activity when actorId is provided", async () => {
    vi.mocked(clientRepository.create).mockResolvedValue(mockClient);
    const { activityService } = await import("@/services/activity.service");

    await clientService.create(
      { userId: "user-1", name: "Test", email: "test@example.com" },
      { actorId: "user-1" }
    );

    expect(activityService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        type: "CREATE",
        entity: "client",
        entityId: "client-1",
      })
    );
  });

  it("does not log activity when actorId is not provided", async () => {
    vi.mocked(clientRepository.create).mockResolvedValue(mockClient);
    const { activityService } = await import("@/services/activity.service");

    await clientService.create({
      userId: "user-1",
      name: "Test",
      email: "test@example.com",
    });

    expect(activityService.log).not.toHaveBeenCalled();
  });
});

describe("clientService.update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates a client and returns the result", async () => {
    const updated = { ...mockClient, name: "Updated Name" };
    vi.mocked(clientRepository.update).mockResolvedValue(updated);

    const result = await clientService.update("client-1", {
      name: "Updated Name",
      email: "test@example.com",
    });

    expect(result.name).toBe("Updated Name");
  });

  it("logs UPDATE activity when actorId provided", async () => {
    vi.mocked(clientRepository.update).mockResolvedValue(mockClient);
    const { activityService } = await import("@/services/activity.service");

    await clientService.update(
      "client-1",
      { name: "Test", email: "test@example.com" },
      { actorId: "user-1" }
    );

    expect(activityService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        type: "UPDATE",
        entity: "client",
        entityId: "client-1",
      })
    );
  });
});

describe("clientService.archive (soft delete)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls softDelete on repository", async () => {
    vi.mocked(clientRepository.softDelete).mockResolvedValue(mockClient);

    await clientService.archive("client-1");

    expect(clientRepository.softDelete).toHaveBeenCalledWith("client-1");
  });

  it("logs ARCHIVE activity when actorId provided", async () => {
    vi.mocked(clientRepository.softDelete).mockResolvedValue(mockClient);
    const { activityService } = await import("@/services/activity.service");

    await clientService.archive("client-1", { actorId: "user-1" });

    expect(activityService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        type: "ARCHIVE",
        entity: "client",
        entityId: "client-1",
      })
    );
  });

  it("delete() delegates to archive()", async () => {
    vi.mocked(clientRepository.softDelete).mockResolvedValue(mockClient);

    await clientService.delete("client-1");

    expect(clientRepository.softDelete).toHaveBeenCalledWith("client-1");
  });
});

describe("clientService.restore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls restore on repository", async () => {
    vi.mocked(clientRepository.restore).mockResolvedValue(mockClient);

    await clientService.restore("client-1");

    expect(clientRepository.restore).toHaveBeenCalledWith("client-1");
  });

  it("logs RESTORE activity when actorId provided", async () => {
    vi.mocked(clientRepository.restore).mockResolvedValue(mockClient);
    const { activityService } = await import("@/services/activity.service");

    await clientService.restore("client-1", { actorId: "user-1" });

    expect(activityService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        type: "RESTORE",
        entity: "client",
        entityId: "client-1",
      })
    );
  });
});

describe("clientService.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes search, filter, sort to repository", async () => {
    vi.mocked(clientRepository.findMany).mockResolvedValue({
      items: [mockClient],
      total: 1,
    });

    await clientService.list({
      userId: "user-1",
      skip: 0,
      take: 10,
      search: "test",
      filter: "active",
      sort: "newest",
    });

    expect(clientRepository.findMany).toHaveBeenCalledWith({
      userId: "user-1",
      skip: 0,
      take: 10,
      search: "test",
      filter: "active",
      sort: "newest",
    });
  });
});

describe("clientService.count", () => {
  it("counts non-archived clients for a user", async () => {
    vi.mocked(clientRepository.count).mockResolvedValue(5);

    const result = await clientService.count("user-1");

    expect(result).toBe(5);
    expect(clientRepository.count).toHaveBeenCalledWith({
      userId: "user-1",
      status: { not: "ARCHIVED" },
    });
  });
});

describe("clientService.getStatistics", () => {
  it("delegates to repository.getStatistics", async () => {
    const stats = { projects: 3, videos: 10, downloads: 50, views: 200 };
    vi.mocked(clientRepository.getStatistics).mockResolvedValue(stats);

    const result = await clientService.getStatistics("client-1");

    expect(result).toEqual(stats);
    expect(clientRepository.getStatistics).toHaveBeenCalledWith("client-1");
  });
});

describe("clientService.exportCsv", () => {
  it("generates CSV with headers and data rows", async () => {
    vi.mocked(clientRepository.findAllForExport).mockResolvedValue([
      {
        ...mockClient,
        _count: { projects: 3 },
      },
    ]);

    const csv = await clientService.exportCsv("user-1");

    expect(csv).toContain("كود العميل");
    expect(csv).toContain("الاسم");
    expect(csv).toContain("CL-000001");
    expect(csv).toContain("Test Client");
    expect(csv).toContain("test@example.com");
    expect(csv).toContain("ACTIVE");
    expect(csv.startsWith("\uFEFF")).toBe(true); // BOM for Excel
  });

  it("returns only headers when no clients", async () => {
    vi.mocked(clientRepository.findAllForExport).mockResolvedValue([]);

    const csv = await clientService.exportCsv("user-1");

    expect(csv).toContain("كود العميل");
    expect(csv.split("\n").filter((l) => l.trim()).length).toBe(1); // headers only (plus BOM)
  });

  it("escapes fields containing commas", async () => {
    vi.mocked(clientRepository.findAllForExport).mockResolvedValue([
      {
        ...mockClient,
        name: "Name, with comma",
        _count: { projects: 0 },
      },
    ]);

    const csv = await clientService.exportCsv("user-1");

    expect(csv).toContain('"Name, with comma"');
  });
});
