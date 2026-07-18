import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── Mock dependencies ───────────────────── */

vi.mock("@/lib/prisma", () => ({
  prisma: {
    video: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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
import { videoRepository } from "@/repositories/video.repository";

/* ============================================
   Video Repository Tests
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
  status: "READY" as const,
  uploadedAt: new Date(),
  processedAt: new Date(),
  deletedAt: null,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  project: { id: "project-1", name: "Test Project", projectCode: "PR-000001" },
};

describe("videoRepository.findById", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls prisma.video.findUnique with correct id", async () => {
    vi.mocked(prisma.video.findUnique).mockResolvedValue(mockVideo as never);

    const result = await videoRepository.findById("video-1");

    expect(result).toEqual(mockVideo);
    expect(prisma.video.findUnique).toHaveBeenCalledWith({
      where: { id: "video-1" },
      include: { project: true, downloads: true, views: true },
    });
  });

  it("returns null when not found", async () => {
    vi.mocked(prisma.video.findUnique).mockResolvedValue(null);

    const result = await videoRepository.findById("nonexistent");

    expect(result).toBeNull();
  });
});

describe("videoRepository.findByVideoCode", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls prisma.video.findUnique with videoCode", async () => {
    vi.mocked(prisma.video.findUnique).mockResolvedValue(mockVideo as never);

    const result = await videoRepository.findByVideoCode("VD-000001");

    expect(result).toEqual(mockVideo);
    expect(prisma.video.findUnique).toHaveBeenCalledWith({
      where: { videoCode: "VD-000001" },
      include: { project: true },
    });
  });
});

describe("videoRepository.findByStorageKey", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls prisma.video.findUnique with storageKey", async () => {
    vi.mocked(prisma.video.findUnique).mockResolvedValue(mockVideo as never);

    await videoRepository.findByStorageKey("videos/project-1/uuid.mp4");

    expect(prisma.video.findUnique).toHaveBeenCalledWith({
      where: { storageKey: "videos/project-1/uuid.mp4" },
      include: { project: true },
    });
  });
});

describe("videoRepository.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls prisma.video.create with data", async () => {
    vi.mocked(prisma.video.create).mockResolvedValue(mockVideo as never);

    const data = {
      videoCode: "VD-000001",
      projectId: "project-1",
      title: "Test",
      originalFileName: "test.mp4",
      storageKey: "key",
      storageBucket: "bucket",
      mimeType: "video/mp4",
      extension: "mp4",
      fileSize: BigInt(100),
      status: "UPLOADING",
    } as never;

    const result = await videoRepository.create(data);

    expect(result).toEqual(mockVideo);
    expect(prisma.video.create).toHaveBeenCalledWith({
      data,
      include: { project: true },
    });
  });
});

describe("videoRepository.softDelete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets status to DELETED and deletedAt", async () => {
    vi.mocked(prisma.video.update).mockResolvedValue({
      ...mockVideo,
      status: "DELETED",
      deletedAt: new Date(),
    } as never);

    await videoRepository.softDelete("video-1");

    expect(prisma.video.update).toHaveBeenCalledWith({
      where: { id: "video-1" },
      data: {
        status: "DELETED",
        deletedAt: expect.any(Date),
      },
      include: { project: true },
    });
  });
});

describe("videoRepository.restore", () => {
  beforeEach(() => vi.clearAllMocks());

  it("clears deletedAt and sets status", async () => {
    vi.mocked(prisma.video.update).mockResolvedValue(mockVideo as never);

    await videoRepository.restore("video-1");

    expect(prisma.video.update).toHaveBeenCalledWith({
      where: { id: "video-1" },
      data: {
        status: "READY",
        deletedAt: null,
      },
      include: { project: true },
    });
  });
});

describe("videoRepository.findMany", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls findMany and count in parallel", async () => {
    vi.mocked(prisma.video.findMany).mockResolvedValue([mockVideo] as never);
    vi.mocked(prisma.video.count).mockResolvedValue(1);

    const result = await videoRepository.findMany({
      skip: 0,
      take: 10,
      search: "test",
      filter: "all",
      sort: "newest",
    });

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(prisma.video.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 10,
        orderBy: { createdAt: "desc" },
      })
    );
  });

  it("uses oldest sort", async () => {
    vi.mocked(prisma.video.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.video.count).mockResolvedValue(0);

    await videoRepository.findMany({ sort: "oldest" });

    expect(prisma.video.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "asc" } })
    );
  });

  it("uses duration sort", async () => {
    vi.mocked(prisma.video.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.video.count).mockResolvedValue(0);

    await videoRepository.findMany({ sort: "duration" });

    expect(prisma.video.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { duration: "desc" } })
    );
  });

  it("uses size sort", async () => {
    vi.mocked(prisma.video.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.video.count).mockResolvedValue(0);

    await videoRepository.findMany({ sort: "size" });

    expect(prisma.video.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { fileSize: "desc" } })
    );
  });

  it("excludes deleted by default", async () => {
    vi.mocked(prisma.video.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.video.count).mockResolvedValue(0);

    await videoRepository.findMany({ filter: "all" });

    expect(prisma.video.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { not: "DELETED" } }),
      })
    );
  });

  it("searches by videoCode and title", async () => {
    vi.mocked(prisma.video.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.video.count).mockResolvedValue(0);

    await videoRepository.findMany({ search: "test" });

    const call = vi.mocked(prisma.video.findMany).mock.calls[0]![0] as {
      where: { OR?: unknown[] };
    };
    expect(call.where.OR).toHaveLength(2);
  });
});

describe("videoRepository.count", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls prisma.video.count", async () => {
    vi.mocked(prisma.video.count).mockResolvedValue(5);

    const result = await videoRepository.count({ status: "READY" } as never);

    expect(result).toBe(5);
    expect(prisma.video.count).toHaveBeenCalledWith({ where: { status: "READY" } });
  });
});

describe("videoRepository.findLatestVideoCode", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls findFirst with descending videoCode", async () => {
    vi.mocked(prisma.video.findFirst).mockResolvedValue({
      videoCode: "VD-000005",
    } as never);

    const result = await videoRepository.findLatestVideoCode();

    expect(result).toEqual({ videoCode: "VD-000005" });
    expect(prisma.video.findFirst).toHaveBeenCalledWith({
      orderBy: { videoCode: "desc" },
      select: { videoCode: true },
    });
  });
});

describe("videoRepository.getStatistics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns views and downloads counts", async () => {
    vi.mocked(prisma.view.count).mockResolvedValue(50);
    vi.mocked(prisma.download.count).mockResolvedValue(10);

    const result = await videoRepository.getStatistics("video-1");

    expect(result.views).toBe(50);
    expect(result.downloads).toBe(10);
  });
});

describe("videoRepository.findAllForExport", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches non-deleted videos", async () => {
    vi.mocked(prisma.video.findMany).mockResolvedValue([mockVideo] as never);

    const result = await videoRepository.findAllForExport();

    expect(result).toHaveLength(1);
    expect(prisma.video.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { not: "DELETED" } }),
      })
    );
  });

  it("filters by projectId", async () => {
    vi.mocked(prisma.video.findMany).mockResolvedValue([] as never);

    await videoRepository.findAllForExport("project-1");

    const call = vi.mocked(prisma.video.findMany).mock.calls[0]![0] as {
      where: { projectId?: string };
    };
    expect(call.where.projectId).toBe("project-1");
  });
});
