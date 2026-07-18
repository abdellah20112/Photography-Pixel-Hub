import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── Mock dependencies ───────────────────── */

vi.mock("@/lib/prisma", () => ({
  prisma: {
    reviewComment: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

/* ── Imports ─────────────────────────────── */

import { prisma } from "@/lib/prisma";
import { reviewRepository } from "@/repositories/review.repository";

/* ============================================
   Review Repository Tests
   ============================================ */

const mockComment = {
  id: "comment-1",
  commentCode: "CM-000001",
  videoId: "video-1",
  deliveryId: "delivery-1",
  parentId: null,
  authorName: "Test Client",
  authorEmail: "test@example.com",
  authorType: "CLIENT",
  message: "Test comment",
  timestampSeconds: 45,
  status: "OPEN",
  resolvedAt: null,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  replies: [],
};

describe("reviewRepository.findById", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls findUnique with correct id", async () => {
    vi.mocked(prisma.reviewComment.findUnique).mockResolvedValue(mockComment as never);

    const result = await reviewRepository.findById("comment-1");

    expect(result).toEqual(mockComment);
    expect(prisma.reviewComment.findUnique).toHaveBeenCalledWith({
      where: { id: "comment-1" },
      include: {
        video: true,
        delivery: true,
        parent: true,
        replies: { orderBy: { createdAt: "asc" } },
      },
    });
  });
});

describe("reviewRepository.findByVideo", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls findMany with videoId and top-level only", async () => {
    vi.mocked(prisma.reviewComment.findMany).mockResolvedValue([mockComment] as never);

    const result = await reviewRepository.findByVideo("video-1");

    expect(result).toHaveLength(1);
    expect(prisma.reviewComment.findMany).toHaveBeenCalledWith({
      where: { videoId: "video-1", parentId: null },
      include: { replies: { orderBy: { createdAt: "asc" } } },
      orderBy: { timestampSeconds: "asc" },
    });
  });
});

describe("reviewRepository.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls create with data", async () => {
    vi.mocked(prisma.reviewComment.create).mockResolvedValue(mockComment as never);

    const data = {
      commentCode: "CM-000001",
      videoId: "video-1",
      deliveryId: "delivery-1",
      authorName: "Test",
      authorEmail: "test@example.com",
      authorType: "CLIENT",
      message: "Test",
      timestampSeconds: 10,
      status: "OPEN",
    } as never;

    const result = await reviewRepository.create(data);

    expect(result).toEqual(mockComment);
    expect(prisma.reviewComment.create).toHaveBeenCalledWith({
      data,
      include: { replies: true },
    });
  });
});

describe("reviewRepository.resolve", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets status to RESOLVED and resolvedAt", async () => {
    vi.mocked(prisma.reviewComment.update).mockResolvedValue({
      ...mockComment,
      status: "RESOLVED",
      resolvedAt: new Date(),
    } as never);

    await reviewRepository.resolve("comment-1");

    expect(prisma.reviewComment.update).toHaveBeenCalledWith({
      where: { id: "comment-1" },
      data: {
        status: "RESOLVED",
        resolvedAt: expect.any(Date),
      },
    });
  });
});

describe("reviewRepository.reopen", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets status to OPEN and clears resolvedAt", async () => {
    vi.mocked(prisma.reviewComment.update).mockResolvedValue(mockComment as never);

    await reviewRepository.reopen("comment-1");

    expect(prisma.reviewComment.update).toHaveBeenCalledWith({
      where: { id: "comment-1" },
      data: {
        status: "OPEN",
        resolvedAt: null,
      },
    });
  });
});

describe("reviewRepository.archive", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets status to ARCHIVED", async () => {
    vi.mocked(prisma.reviewComment.update).mockResolvedValue({
      ...mockComment,
      status: "ARCHIVED",
    } as never);

    await reviewRepository.archive("comment-1");

    expect(prisma.reviewComment.update).toHaveBeenCalledWith({
      where: { id: "comment-1" },
      data: { status: "ARCHIVED" },
    });
  });
});

describe("reviewRepository.findMany", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls findMany and count in parallel", async () => {
    vi.mocked(prisma.reviewComment.findMany).mockResolvedValue([mockComment] as never);
    vi.mocked(prisma.reviewComment.count).mockResolvedValue(1);

    const result = await reviewRepository.findMany({
      videoId: "video-1",
      filter: "all",
      sort: "newest",
    });

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("searches by message and authorName", async () => {
    vi.mocked(prisma.reviewComment.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.reviewComment.count).mockResolvedValue(0);

    await reviewRepository.findMany({ search: "test" });

    const call = vi.mocked(prisma.reviewComment.findMany).mock.calls[0]![0] as {
      where: { OR?: unknown[] };
    };
    expect(call.where.OR).toHaveLength(2);
  });
});

describe("reviewRepository.getStatistics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns aggregated statistics", async () => {
    vi.mocked(prisma.reviewComment.count)
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(5)  // open
      .mockResolvedValueOnce(3)  // resolved
      .mockResolvedValueOnce(2); // archived

    const result = await reviewRepository.getStatistics();

    expect(result.totalComments).toBe(10);
    expect(result.openComments).toBe(5);
    expect(result.resolvedComments).toBe(3);
    expect(result.archivedComments).toBe(2);
    expect(result.pendingReviews).toBe(5);
  });
});

describe("reviewRepository.getTimelineMarkers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns markers for video", async () => {
    vi.mocked(prisma.reviewComment.findMany).mockResolvedValue([
      {
        id: "1",
        commentCode: "CM-001",
        timestampSeconds: 10,
        authorName: "Test",
        message: "Test",
        status: "OPEN",
      },
    ] as never);

    const result = await reviewRepository.getTimelineMarkers("video-1");

    expect(result).toHaveLength(1);
    expect(prisma.reviewComment.findMany).toHaveBeenCalledWith({
      where: { videoId: "video-1", parentId: null, status: { not: "ARCHIVED" } },
      select: {
        id: true,
        commentCode: true,
        timestampSeconds: true,
        authorName: true,
        message: true,
        status: true,
      },
      orderBy: { timestampSeconds: "asc" },
    });
  });
});
