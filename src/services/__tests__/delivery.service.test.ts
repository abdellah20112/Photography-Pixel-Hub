import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── Mock dependencies ───────────────────── */

vi.mock("@/repositories/delivery.repository", () => ({
  deliveryRepository: {
    findById: vi.fn(),
    findBySlug: vi.fn(),
    findByDeliveryCode: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    restore: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    findLatestDeliveryCode: vi.fn(),
    getStatistics: vi.fn(),
    incrementViewCount: vi.fn(),
    incrementDownloadCount: vi.fn(),
    setVideos: vi.fn(),
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
    delivery: { findFirst: vi.fn() },
  };
  return {
    prisma: {
      ...mockTx,
      $transaction: vi.fn(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)),
    },
  };
});

vi.mock("@/lib/utils", () => ({
  generateToken: vi.fn(() => "mocktoken1234"),
}));

vi.mock("@/lib/storage/storage.service", () => ({
  storageService: {
    name: "cloudflare-r2",
    bucket: "test-bucket",
    getSignedUrl: vi.fn().mockResolvedValue("https://signed.example.com"),
    getDownloadUrl: vi.fn().mockResolvedValue("https://download.example.com"),
    getStreamingUrl: vi.fn().mockResolvedValue("https://stream.example.com"),
    upload: vi.fn(),
    delete: vi.fn(),
    exists: vi.fn(),
    replace: vi.fn(),
    generateUploadUrl: vi.fn(),
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(async () => "hashed-password"),
    compare: vi.fn(async () => true),
  },
}));

/* ── Imports ─────────────────────────────── */

import { deliveryService } from "@/services/delivery.service";
import { deliveryRepository } from "@/repositories/delivery.repository";

/* ============================================
   Delivery Service Tests
   ============================================ */

const mockDelivery = {
  id: "delivery-1",
  deliveryCode: "DL-000001",
  projectId: "project-1",
  title: "Test Delivery",
  slug: "test-delivery-mocktoken",
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

describe("deliveryService.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a delivery with generated code and slug", async () => {
    vi.mocked(deliveryRepository.create).mockResolvedValue(mockDelivery as never);
    vi.mocked(deliveryRepository.setVideos).mockResolvedValue(mockDelivery as never);

    const result = await deliveryService.create({
      projectId: "project-1",
      title: "Test Delivery",
      expiresAt: new Date("2026-12-31"),
      downloadEnabled: true,
      allowStreaming: true,
      allowComments: false,
      passwordProtected: false,
      videoIds: ["video-1"],
    });

    expect(result).toEqual(mockDelivery);
    expect(deliveryRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        deliveryCode: expect.any(String),
        slug: expect.any(String),
        projectId: "project-1",
        title: "Test Delivery",
        status: "ACTIVE",
      })
    );
  });

  it("hashes password when passwordProtected", async () => {
    vi.mocked(deliveryRepository.create).mockResolvedValue(mockDelivery as never);
    vi.mocked(deliveryRepository.setVideos).mockResolvedValue(mockDelivery as never);

    await deliveryService.create({
      projectId: "project-1",
      title: "Test",
      expiresAt: new Date("2026-12-31"),
      downloadEnabled: true,
      allowStreaming: true,
      allowComments: false,
      passwordProtected: true,
      password: "secret123",
      videoIds: ["video-1"],
    });

    expect(deliveryRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        passwordHash: "hashed-password",
      })
    );
  });

  it("logs DELIVERY_CREATED activity when actorId provided", async () => {
    vi.mocked(deliveryRepository.create).mockResolvedValue(mockDelivery as never);
    vi.mocked(deliveryRepository.setVideos).mockResolvedValue(mockDelivery as never);
    const { activityService } = await import("@/services/activity.service");

    await deliveryService.create(
      {
        projectId: "project-1",
        title: "Test",
        expiresAt: new Date("2026-12-31"),
        downloadEnabled: true,
        allowStreaming: true,
        allowComments: false,
        passwordProtected: false,
        videoIds: ["video-1"],
      },
      { actorId: "user-1" }
    );

    expect(activityService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        type: "DELIVERY_CREATED",
        entity: "delivery",
      })
    );
  });
});

describe("deliveryService.softDelete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls softDelete on repository", async () => {
    vi.mocked(deliveryRepository.softDelete).mockResolvedValue(mockDelivery as never);

    await deliveryService.softDelete("delivery-1");

    expect(deliveryRepository.softDelete).toHaveBeenCalledWith("delivery-1");
  });

  it("logs DELIVERY_DISABLED activity", async () => {
    vi.mocked(deliveryRepository.softDelete).mockResolvedValue(mockDelivery as never);
    const { activityService } = await import("@/services/activity.service");

    await deliveryService.softDelete("delivery-1", { actorId: "user-1" });

    expect(activityService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "DELIVERY_DISABLED",
        entity: "delivery",
      })
    );
  });
});

describe("deliveryService.restore", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls restore on repository", async () => {
    vi.mocked(deliveryRepository.restore).mockResolvedValue(mockDelivery as never);

    await deliveryService.restore("delivery-1");

    expect(deliveryRepository.restore).toHaveBeenCalledWith("delivery-1");
  });
});

describe("deliveryService.list", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes params to repository", async () => {
    vi.mocked(deliveryRepository.findMany).mockResolvedValue({
      items: [mockDelivery],
      total: 1,
    } as never);

    await deliveryService.list({
      skip: 0,
      take: 10,
      search: "test",
      filter: "active",
      sort: "newest",
    });

    expect(deliveryRepository.findMany).toHaveBeenCalledWith({
      skip: 0,
      take: 10,
      search: "test",
      filter: "active",
      sort: "newest",
    });
  });
});

describe("deliveryService.checkAccess", () => {
  it("returns active for valid delivery", () => {
    expect(deliveryService.checkAccess({
      status: "ACTIVE",
      expiresAt: new Date("2099-12-31"),
    })).toBe("active");
  });

  it("returns expired for past date", () => {
    expect(deliveryService.checkAccess({
      status: "ACTIVE",
      expiresAt: new Date("2020-01-01"),
    })).toBe("expired");
  });

  it("returns active when no expiry", () => {
    expect(deliveryService.checkAccess({
      status: "ACTIVE",
      expiresAt: null,
    })).toBe("active");
  });

  it("returns disabled for DISABLED status", () => {
    expect(deliveryService.checkAccess({
      status: "DISABLED",
      expiresAt: null,
    })).toBe("disabled");
  });
});

describe("deliveryService.trackView", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls incrementViewCount", async () => {
    vi.mocked(deliveryRepository.incrementViewCount).mockResolvedValue(mockDelivery as never);

    await deliveryService.trackView("delivery-1");

    expect(deliveryRepository.incrementViewCount).toHaveBeenCalledWith("delivery-1");
  });
});

describe("deliveryService.trackDownload", () => {
  beforeEach(() => vi.clearAllMocks());

  it("increments count and returns signed URL", async () => {
    vi.mocked(deliveryRepository.incrementDownloadCount).mockResolvedValue(mockDelivery as never);

    const url = await deliveryService.trackDownload("delivery-1", "storage-key");

    expect(url).toBe("https://download.example.com");
    expect(deliveryRepository.incrementDownloadCount).toHaveBeenCalledWith("delivery-1");
  });
});

describe("deliveryService.getStreamUrl", () => {
  it("returns signed streaming URL", async () => {
    const url = await deliveryService.getStreamUrl("storage-key");
    expect(url).toBe("https://stream.example.com");
  });
});

describe("deliveryService.verifyPassword", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns false when delivery not found", async () => {
    vi.mocked(deliveryRepository.findBySlug).mockResolvedValue(null);

    const result = await deliveryService.verifyPassword("slug", "pass");
    expect(result).toBe(false);
  });

  it("returns false when not password protected", async () => {
    vi.mocked(deliveryRepository.findBySlug).mockResolvedValue({
      ...mockDelivery,
      passwordProtected: false,
    } as never);

    const result = await deliveryService.verifyPassword("slug", "pass");
    expect(result).toBe(false);
  });

  it("verifies password using bcrypt", async () => {
    vi.mocked(deliveryRepository.findBySlug).mockResolvedValue({
      ...mockDelivery,
      passwordProtected: true,
      passwordHash: "hashed-password",
    } as never);

    const result = await deliveryService.verifyPassword("slug", "secret123");
    expect(result).toBe(true);
  });
});
