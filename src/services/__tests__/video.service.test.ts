import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── Mock dependencies ───────────────────── */

vi.mock("@/repositories/video.repository", () => ({
  videoRepository: {
    findById: vi.fn(),
    findByVideoCode: vi.fn(),
    findByStorageKey: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    restore: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    findLatestVideoCode: vi.fn(),
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
    video: {
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

vi.mock("@/lib/storage/storage.service", () => ({
  storageService: {
    name: "cloudflare-r2",
    bucket: "test-bucket",
    getSignedUrl: vi.fn().mockResolvedValue("https://signed-url.example.com"),
    getDownloadUrl: vi.fn().mockResolvedValue("https://download-url.example.com"),
    getStreamingUrl: vi.fn().mockResolvedValue("https://streaming-url.example.com"),
    upload: vi.fn().mockResolvedValue("test-key"),
    delete: vi.fn().mockResolvedValue(undefined),
    exists: vi.fn().mockResolvedValue(true),
    replace: vi.fn().mockResolvedValue("new-key"),
    generateUploadUrl: vi.fn().mockResolvedValue("https://upload-url.example.com"),
  },
}));

/* ── Imports (after mocks) ────────────────── */

import { videoService } from "@/services/video.service";
import { videoRepository } from "@/repositories/video.repository";

/* ============================================
   Video Service Tests
   ============================================ */

const mockVideo = {
  id: "video-1",
  videoCode: "VD-000001",
  projectId: "project-1",
  title: "Test Video",
  originalFileName: "test.mp4",
  storageKey: "videos/project-1/uuid.mp4",
  storageBucket: "pph-videos",
  mimeType: "video/mp4",
  extension: "mp4",
  fileSize: BigInt(1024 * 1024 * 50),
  duration: 120,
  width: 1920,
  height: 1080,
  thumbnailUrl: null,
  streamUrl: null,
  downloadUrl: null,
  status: "UPLOADING",
  uploadedAt: new Date(),
  processedAt: null,
  deletedAt: null,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  project: { id: "project-1", name: "Test Project", projectCode: "PR-000001" },
};

describe("videoService.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a video with generated videoCode", async () => {
    vi.mocked(videoRepository.create).mockResolvedValue(mockVideo as never);

    const result = await videoService.create({
      projectId: "project-1",
      title: "Test Video",
      originalFileName: "test.mp4",
      storageKey: "videos/project-1/uuid.mp4",
      storageBucket: "pph-videos",
      mimeType: "video/mp4",
      extension: "mp4",
      fileSize: BigInt(1024 * 1024 * 50),
    });

    expect(result).toEqual(mockVideo);
    expect(videoRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        videoCode: expect.any(String),
        projectId: "project-1",
        title: "Test Video",
      })
    );
  });

  it("defaults status to UPLOADING", async () => {
    vi.mocked(videoRepository.create).mockResolvedValue(mockVideo as never);

    await videoService.create({
      projectId: "project-1",
      title: "Test",
      originalFileName: "test.mp4",
      storageKey: "key",
      storageBucket: "bucket",
      mimeType: "video/mp4",
      extension: "mp4",
      fileSize: BigInt(100),
    });

    expect(videoRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "UPLOADING",
      })
    );
  });

  it("logs UPLOAD activity when actorId is provided", async () => {
    vi.mocked(videoRepository.create).mockResolvedValue(mockVideo as never);
    const { activityService } = await import("@/services/activity.service");

    await videoService.create(
      {
        projectId: "project-1",
        title: "Test",
        originalFileName: "test.mp4",
        storageKey: "key",
        storageBucket: "bucket",
        mimeType: "video/mp4",
        extension: "mp4",
        fileSize: BigInt(100),
      },
      { actorId: "user-1" }
    );

    expect(activityService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        type: "UPLOAD",
        entity: "video",
        entityId: "video-1",
      })
    );
  });

  it("trims title", async () => {
    vi.mocked(videoRepository.create).mockResolvedValue(mockVideo as never);

    await videoService.create({
      projectId: "project-1",
      title: "  Test Video  ",
      originalFileName: "test.mp4",
      storageKey: "key",
      storageBucket: "bucket",
      mimeType: "video/mp4",
      extension: "mp4",
      fileSize: BigInt(100),
    });

    expect(videoRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Test Video",
      })
    );
  });
});

describe("videoService.update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates video fields", async () => {
    const updated = { ...mockVideo, title: "Updated", status: "READY" };
    vi.mocked(videoRepository.update).mockResolvedValue(updated as never);

    const result = await videoService.update("video-1", {
      title: "Updated",
      status: "READY",
    });

    expect(result.title).toBe("Updated");
  });

  it("sets processedAt when status becomes READY", async () => {
    vi.mocked(videoRepository.update).mockResolvedValue(mockVideo as never);

    await videoService.update("video-1", { status: "READY" });

    expect(videoRepository.update).toHaveBeenCalledWith(
      "video-1",
      expect.objectContaining({
        status: "READY",
        processedAt: expect.any(Date),
      })
    );
  });
});

describe("videoService.softDelete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls softDelete on repository", async () => {
    vi.mocked(videoRepository.softDelete).mockResolvedValue(mockVideo as never);

    await videoService.softDelete("video-1");

    expect(videoRepository.softDelete).toHaveBeenCalledWith("video-1");
  });

  it("logs DELETE activity when actorId provided", async () => {
    vi.mocked(videoRepository.softDelete).mockResolvedValue(mockVideo as never);
    const { activityService } = await import("@/services/activity.service");

    await videoService.softDelete("video-1", { actorId: "user-1" });

    expect(activityService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        type: "DELETE",
        entity: "video",
        entityId: "video-1",
      })
    );
  });

  it("delete() delegates to softDelete()", async () => {
    vi.mocked(videoRepository.softDelete).mockResolvedValue(mockVideo as never);

    await videoService.delete("video-1");

    expect(videoRepository.softDelete).toHaveBeenCalledWith("video-1");
  });
});

describe("videoService.restore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls restore on repository", async () => {
    vi.mocked(videoRepository.restore).mockResolvedValue(mockVideo as never);

    await videoService.restore("video-1");

    expect(videoRepository.restore).toHaveBeenCalledWith("video-1");
  });

  it("logs RESTORE activity", async () => {
    vi.mocked(videoRepository.restore).mockResolvedValue(mockVideo as never);
    const { activityService } = await import("@/services/activity.service");

    await videoService.restore("video-1", { actorId: "user-1" });

    expect(activityService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "RESTORE",
        entity: "video",
      })
    );
  });
});

describe("videoService.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes params to repository", async () => {
    vi.mocked(videoRepository.findMany).mockResolvedValue({
      items: [mockVideo],
      total: 1,
    } as never);

    await videoService.list({
      skip: 0,
      take: 10,
      search: "test",
      filter: "ready",
      sort: "newest",
    });

    expect(videoRepository.findMany).toHaveBeenCalledWith({
      skip: 0,
      take: 10,
      search: "test",
      filter: "ready",
      sort: "newest",
    });
  });
});

describe("videoService.count", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("counts non-deleted by default", async () => {
    vi.mocked(videoRepository.count).mockResolvedValue(5);

    const result = await videoService.count({});

    expect(result).toBe(5);
    expect(videoRepository.count).toHaveBeenCalledWith({
      projectId: undefined,
      status: { not: "DELETED" },
    });
  });

  it("counts deleted when filter is deleted", async () => {
    vi.mocked(videoRepository.count).mockResolvedValue(2);

    const result = await videoService.count({ filter: "deleted" });

    expect(result).toBe(2);
    expect(videoRepository.count).toHaveBeenCalledWith({
      projectId: undefined,
      status: "DELETED",
    });
  });

  it("counts specific status", async () => {
    vi.mocked(videoRepository.count).mockResolvedValue(3);

    const result = await videoService.count({ filter: "ready" });

    expect(result).toBe(3);
    expect(videoRepository.count).toHaveBeenCalledWith({
      projectId: undefined,
      status: "READY",
    });
  });
});

describe("videoService.getSignedUrls", () => {
  it("generates signed URLs for video", async () => {
    const result = await videoService.getSignedUrls("storage-key", "thumb-key");

    expect(result.streamUrl).toBeDefined();
    expect(result.downloadUrl).toBeDefined();
    expect(result.thumbnailUrl).toBeDefined();
  });

  it("returns null thumbnailUrl when no thumbnailKey", async () => {
    const result = await videoService.getSignedUrls("storage-key", null);

    expect(result.thumbnailUrl).toBeNull();
  });
});

describe("videoService.exportCsv", () => {
  it("generates CSV with headers and data rows", async () => {
    vi.mocked(videoRepository.findAllForExport).mockResolvedValue([mockVideo] as never);

    const csv = await videoService.exportCsv();

    expect(csv).toContain("كود الفيديو");
    expect(csv).toContain("VD-000001");
    expect(csv).toContain("Test Video");
    expect(csv.startsWith("\uFEFF")).toBe(true);
  });

  it("returns only headers when no videos", async () => {
    vi.mocked(videoRepository.findAllForExport).mockResolvedValue([] as never);

    const csv = await videoService.exportCsv();

    expect(csv).toContain("كود الفيديو");
    expect(csv.split("\n").filter((l) => l.trim()).length).toBe(1);
  });
});
