import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── Mock dependencies ───────────────────── */

vi.mock("@/lib/prisma", () => ({
  prisma: {
    model: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    projectModel: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

/* ── Imports ─────────────────────────────── */

import { prisma } from "@/lib/prisma";
import { modelRepository } from "@/repositories/model.repository";

/* ============================================
   Model Repository Tests
   ============================================ */

const mockModel = {
  id: "model-1",
  modelCode: "MD-000001",
  fullName: "Test Model",
  phone: "0501234567",
  whatsapp: null,
  email: null,
  photo: null,
  status: "ACTIVE",
  notes: null,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  _count: { projectModels: 3 },
};

describe("modelRepository.findById", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls findUnique with correct id and includes", async () => {
    vi.mocked(prisma.model.findUnique).mockResolvedValue(mockModel as never);

    const result = await modelRepository.findById("model-1");

    expect(result).toEqual(mockModel);
    expect(prisma.model.findUnique).toHaveBeenCalledWith({
      where: { id: "model-1" },
      include: {
        projectModels: {
          include: {
            project: { select: { id: true, name: true, projectCode: true } },
          },
        },
      },
    });
  });
});

describe("modelRepository.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls create with data", async () => {
    vi.mocked(prisma.model.create).mockResolvedValue(mockModel as never);

    const data = { modelCode: "MD-000001", fullName: "Test", phone: "050", status: "ACTIVE" } as never;
    const result = await modelRepository.create(data);

    expect(result).toEqual(mockModel);
    expect(prisma.model.create).toHaveBeenCalledWith({ data });
  });
});

describe("modelRepository.softDelete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets status to INACTIVE", async () => {
    vi.mocked(prisma.model.update).mockResolvedValue({ ...mockModel, status: "INACTIVE" } as never);

    await modelRepository.softDelete("model-1");

    expect(prisma.model.update).toHaveBeenCalledWith({
      where: { id: "model-1" },
      data: { status: "INACTIVE" },
    });
  });
});

describe("modelRepository.findMany", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls findMany and count in parallel", async () => {
    vi.mocked(prisma.model.findMany).mockResolvedValue([mockModel] as never);
    vi.mocked(prisma.model.count).mockResolvedValue(1);

    const result = await modelRepository.findMany({
      skip: 0, take: 10, search: "test", filter: "all", sort: "newest",
    });

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("searches by modelCode, fullName, and phone", async () => {
    vi.mocked(prisma.model.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.model.count).mockResolvedValue(0);

    await modelRepository.findMany({ search: "test" });

    const call = vi.mocked(prisma.model.findMany).mock.calls[0]![0] as {
      where: { OR?: unknown[] };
    };
    expect(call.where.OR).toHaveLength(3);
  });
});

describe("modelRepository.getStatistics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns aggregated statistics", async () => {
    vi.mocked(prisma.projectModel.findMany).mockResolvedValue([
      { videosCount: 3, totalAmount: 300, paymentStatus: "PAID" },
      { videosCount: 2, totalAmount: 200, paymentStatus: "PENDING" },
    ] as never);

    const result = await modelRepository.getStatistics("model-1");

    expect(result.totalProjects).toBe(2);
    expect(result.totalVideos).toBe(5);
    expect(result.totalEarnings).toBe(500);
    expect(result.pendingAmount).toBe(200);
    expect(result.paidAmount).toBe(300);
  });
});

describe("modelRepository.createAssignment", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates assignment with pricing", async () => {
    vi.mocked(prisma.projectModel.create).mockResolvedValue({
      id: "a1",
      videosCount: 3,
      pricePerVideo: 100,
      totalAmount: 300,
      model: { id: "m1", fullName: "Test", modelCode: "MD-001", phone: "050", whatsapp: null, photo: null },
    } as never);

    const result = await modelRepository.createAssignment({
      projectId: "p1", modelId: "m1", videosCount: 3, pricePerVideo: 100, totalAmount: 300,
    });

    expect(result).toBeDefined();
    expect(prisma.projectModel.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId: "p1",
        modelId: "m1",
        videosCount: 3,
        pricePerVideo: 100,
        totalAmount: 300,
      }),
      include: { model: { select: expect.any(Object) } },
    });
  });
});

describe("modelRepository.getDashboardStats", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns active models count, pending payments, and top models", async () => {
    vi.mocked(prisma.model.count).mockResolvedValue(5);
    vi.mocked(prisma.projectModel.count).mockResolvedValue(3);
    vi.mocked(prisma.projectModel.groupBy).mockResolvedValue([
      { modelId: "m1", _sum: { totalAmount: 500 } },
    ] as never);
    vi.mocked(prisma.model.findMany).mockResolvedValue([
      { id: "m1", modelCode: "MD-000001", fullName: "Top Model" },
    ] as never);

    const result = await modelRepository.getDashboardStats();

    expect(result.activeModels).toBe(5);
    expect(result.pendingPayments).toBe(3);
    expect(result.topModels).toHaveLength(1);
    expect(result.topModels[0]!.fullName).toBe("Top Model");
    expect(result.topModels[0]!.totalEarnings).toBe(500);
  });
});
