import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── Mock dependencies ───────────────────── */

vi.mock("@/lib/prisma", () => ({
  prisma: {
    delivery: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    deliveryVideo: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

/* ── Imports ─────────────────────────────── */

import { prisma } from "@/lib/prisma";
import { deliveryRepository } from "@/repositories/delivery.repository";

/* ============================================
   Delivery Repository Tests
   ============================================ */

const mockDelivery = {
  id: "delivery-1",
  deliveryCode: "DL-000001",
  projectId: "project-1",
  title: "Test Delivery",
  slug: "test-slug",
  status: "ACTIVE",
  expiresAt: new Date("2026-12-31"),
  downloadEnabled: true,
  allowStreaming: true,
  allowComments: false,
  passwordProtected: false,
  passwordHash: null,
  viewCount: 0,
  downloadCount: 0,
  lastViewedAt: null,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  project: { id: "project-1", name: "Test Project", projectCode: "PR-000001" },
  videos: [],
};

describe("deliveryRepository.findById", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls prisma.delivery.findUnique with correct id", async () => {
    vi.mocked(prisma.delivery.findUnique).mockResolvedValue(mockDelivery as never);

    const result = await deliveryRepository.findById("delivery-1");

    expect(result).toEqual(mockDelivery);
    expect(prisma.delivery.findUnique).toHaveBeenCalledWith({
      where: { id: "delivery-1" },
      include: {
        project: true,
        videos: {
          include: { video: true },
          orderBy: { order: "asc" },
        },
      },
    });
  });
});

describe("deliveryRepository.findBySlug", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls prisma.delivery.findUnique with slug", async () => {
    vi.mocked(prisma.delivery.findUnique).mockResolvedValue(mockDelivery as never);

    const result = await deliveryRepository.findBySlug("test-slug");

    expect(result).toEqual(mockDelivery);
    expect(prisma.delivery.findUnique).toHaveBeenCalledWith({
      where: { slug: "test-slug" },
      include: {
        project: true,
        videos: {
          include: { video: true },
          orderBy: { order: "asc" },
        },
      },
    });
  });
});

describe("deliveryRepository.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls prisma.delivery.create with data", async () => {
    vi.mocked(prisma.delivery.create).mockResolvedValue(mockDelivery as never);

    const data = {
      deliveryCode: "DL-000001",
      projectId: "project-1",
      title: "Test",
      slug: "test-slug",
      status: "ACTIVE",
    } as never;

    const result = await deliveryRepository.create(data);

    expect(result).toEqual(mockDelivery);
    expect(prisma.delivery.create).toHaveBeenCalledWith({
      data,
      include: {
        project: true,
        videos: { include: { video: true } },
      },
    });
  });
});

describe("deliveryRepository.softDelete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets status to DISABLED", async () => {
    vi.mocked(prisma.delivery.update).mockResolvedValue({
      ...mockDelivery,
      status: "DISABLED",
    } as never);

    await deliveryRepository.softDelete("delivery-1");

    expect(prisma.delivery.update).toHaveBeenCalledWith({
      where: { id: "delivery-1" },
      data: { status: "DISABLED" },
      include: { project: true },
    });
  });
});

describe("deliveryRepository.restore", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets status to ACTIVE", async () => {
    vi.mocked(prisma.delivery.update).mockResolvedValue(mockDelivery as never);

    await deliveryRepository.restore("delivery-1");

    expect(prisma.delivery.update).toHaveBeenCalledWith({
      where: { id: "delivery-1" },
      data: { status: "ACTIVE" },
      include: { project: true },
    });
  });
});

describe("deliveryRepository.findMany", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls findMany and count in parallel", async () => {
    vi.mocked(prisma.delivery.findMany).mockResolvedValue([mockDelivery] as never);
    vi.mocked(prisma.delivery.count).mockResolvedValue(1);

    const result = await deliveryRepository.findMany({
      skip: 0,
      take: 10,
      search: "test",
      filter: "all",
      sort: "newest",
    });

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(prisma.delivery.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 10,
        orderBy: { createdAt: "desc" },
      })
    );
  });

  it("searches by deliveryCode, title, and project name", async () => {
    vi.mocked(prisma.delivery.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.delivery.count).mockResolvedValue(0);

    await deliveryRepository.findMany({ search: "test" });

    const call = vi.mocked(prisma.delivery.findMany).mock.calls[0]![0] as {
      where: { OR?: unknown[] };
    };
    expect(call.where.OR).toHaveLength(3);
  });
});

describe("deliveryRepository.incrementViewCount", () => {
  beforeEach(() => vi.clearAllMocks());

  it("increments viewCount and sets lastViewedAt", async () => {
    vi.mocked(prisma.delivery.update).mockResolvedValue(mockDelivery as never);

    await deliveryRepository.incrementViewCount("delivery-1");

    expect(prisma.delivery.update).toHaveBeenCalledWith({
      where: { id: "delivery-1" },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: expect.any(Date),
      },
    });
  });
});

describe("deliveryRepository.incrementDownloadCount", () => {
  beforeEach(() => vi.clearAllMocks());

  it("increments downloadCount", async () => {
    vi.mocked(prisma.delivery.update).mockResolvedValue(mockDelivery as never);

    await deliveryRepository.incrementDownloadCount("delivery-1");

    expect(prisma.delivery.update).toHaveBeenCalledWith({
      where: { id: "delivery-1" },
      data: { downloadCount: { increment: 1 } },
    });
  });
});

describe("deliveryRepository.setVideos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes old videos and creates new ones", async () => {
    vi.mocked(prisma.deliveryVideo.deleteMany).mockResolvedValue({ count: 0 } as never);
    vi.mocked(prisma.deliveryVideo.createMany).mockResolvedValue({ count: 2 } as never);
    vi.mocked(prisma.delivery.findUnique).mockResolvedValue(mockDelivery as never);

    await deliveryRepository.setVideos("delivery-1", ["video-1", "video-2"]);

    expect(prisma.deliveryVideo.deleteMany).toHaveBeenCalledWith({
      where: { deliveryId: "delivery-1" },
    });
    expect(prisma.deliveryVideo.createMany).toHaveBeenCalledWith({
      data: [
        { deliveryId: "delivery-1", videoId: "video-1", order: 0 },
        { deliveryId: "delivery-1", videoId: "video-2", order: 1 },
      ],
    });
  });
});

describe("deliveryRepository.getStatistics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns views, downloads, videos, lastViewedAt", async () => {
    vi.mocked(prisma.delivery.findUnique).mockResolvedValue({
      viewCount: 50,
      downloadCount: 10,
      lastViewedAt: new Date("2025-06-01"),
    } as never);
    vi.mocked(prisma.deliveryVideo.count).mockResolvedValue(3);

    const result = await deliveryRepository.getStatistics("delivery-1");

    expect(result.views).toBe(50);
    expect(result.downloads).toBe(10);
    expect(result.videos).toBe(3);
    expect(result.lastViewedAt).toEqual(new Date("2025-06-01"));
  });
});

describe("deliveryRepository.findLatestDeliveryCode", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls findFirst with descending deliveryCode", async () => {
    vi.mocked(prisma.delivery.findFirst).mockResolvedValue({
      deliveryCode: "DL-000005",
    } as never);

    const result = await deliveryRepository.findLatestDeliveryCode();

    expect(result).toEqual({ deliveryCode: "DL-000005" });
    expect(prisma.delivery.findFirst).toHaveBeenCalledWith({
      orderBy: { deliveryCode: "desc" },
      select: { deliveryCode: true },
    });
  });
});
