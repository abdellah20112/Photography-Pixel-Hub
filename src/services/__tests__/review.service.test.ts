import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── Mock dependencies ───────────────────── */

vi.mock("@/repositories/review.repository", () => ({
  reviewRepository: {
    findById: vi.fn(),
    findByVideo: vi.fn(),
    findByDelivery: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    resolve: vi.fn(),
    reopen: vi.fn(),
    archive: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    findLatestCommentCode: vi.fn(),
    getStatistics: vi.fn(),
    getTimelineMarkers: vi.fn(),
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
    reviewComment: { findFirst: vi.fn() },
  };
  return {
    prisma: {
      ...mockTx,
      $transaction: vi.fn(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)),
    },
  };
});

vi.mock("@/lib/validations/review", () => ({
  sanitizeMessage: vi.fn((msg: string) => msg.trim()),
}));

/* ── Imports ─────────────────────────────── */

import { reviewService } from "@/services/review.service";
import { reviewRepository } from "@/repositories/review.repository";

/* ============================================
   Review Service Tests
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
  createdAt: new Date(),
  updatedAt: new Date(),
  replies: [],
};

describe("reviewService.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a comment with generated code", async () => {
    vi.mocked(reviewRepository.create).mockResolvedValue(mockComment as never);

    const result = await reviewService.create({
      videoId: "video-1",
      deliveryId: "delivery-1",
      authorName: "Test Client",
      authorEmail: "test@example.com",
      message: "Test comment",
      timestampSeconds: 45,
    });

    expect(result).toEqual(mockComment);
    expect(reviewRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        commentCode: expect.any(String),
        videoId: "video-1",
        message: "Test comment",
        timestampSeconds: 45,
        status: "OPEN",
      })
    );
  });

  it("sanitizes message", async () => {
    vi.mocked(reviewRepository.create).mockResolvedValue(mockComment as never);

    await reviewService.create({
      videoId: "video-1",
      deliveryId: "delivery-1",
      authorName: "Test",
      authorEmail: "test@example.com",
      message: "<script>alert(1)</script>",
      timestampSeconds: 0,
    });

    const { sanitizeMessage } = await import("@/lib/validations/review");
    expect(sanitizeMessage).toHaveBeenCalledWith("<script>alert(1)</script>");
  });

  it("logs COMMENT_CREATED activity when actorId provided", async () => {
    vi.mocked(reviewRepository.create).mockResolvedValue(mockComment as never);
    const { activityService } = await import("@/services/activity.service");

    await reviewService.create(
      {
        videoId: "video-1",
        deliveryId: "delivery-1",
        authorName: "Test",
        authorEmail: "test@example.com",
        message: "Test",
        timestampSeconds: 0,
      },
      { actorId: "user-1" }
    );

    expect(activityService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        type: "COMMENT_CREATED",
        entity: "review_comment",
      })
    );
  });
});

describe("reviewService.update", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates message within edit window", async () => {
    vi.mocked(reviewRepository.findById).mockResolvedValue({
      ...mockComment,
      createdAt: new Date(), // Just now — within 15 min
    } as never);
    vi.mocked(reviewRepository.update).mockResolvedValue(mockComment as never);

    const result = await reviewService.update("comment-1", { message: "Updated" });

    expect(result).toEqual(mockComment);
  });

  it("throws when edit window expired for client", async () => {
    vi.mocked(reviewRepository.findById).mockResolvedValue({
      ...mockComment,
      createdAt: new Date(Date.now() - 20 * 60 * 1000), // 20 min ago
    } as never);

    await expect(
      reviewService.update("comment-1", { message: "Updated" })
    ).rejects.toThrow("انتهت مدة تعديل التعليق");
  });

  it("allows team to edit after window", async () => {
    vi.mocked(reviewRepository.findById).mockResolvedValue({
      ...mockComment,
      authorType: "TEAM",
      createdAt: new Date(Date.now() - 20 * 60 * 1000),
    } as never);
    vi.mocked(reviewRepository.update).mockResolvedValue(mockComment as never);

    const result = await reviewService.update("comment-1", { message: "Updated" });
    expect(result).toEqual(mockComment);
  });
});

describe("reviewService.resolve", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls resolve on repository", async () => {
    vi.mocked(reviewRepository.resolve).mockResolvedValue(mockComment as never);

    await reviewService.resolve("comment-1");

    expect(reviewRepository.resolve).toHaveBeenCalledWith("comment-1");
  });

  it("logs COMMENT_RESOLVED activity", async () => {
    vi.mocked(reviewRepository.resolve).mockResolvedValue(mockComment as never);
    const { activityService } = await import("@/services/activity.service");

    await reviewService.resolve("comment-1", { actorId: "user-1" });

    expect(activityService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "COMMENT_RESOLVED",
      })
    );
  });
});

describe("reviewService.reopen", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls reopen on repository", async () => {
    vi.mocked(reviewRepository.reopen).mockResolvedValue(mockComment as never);

    await reviewService.reopen("comment-1");

    expect(reviewRepository.reopen).toHaveBeenCalledWith("comment-1");
  });
});

describe("reviewService.archive", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls archive on repository", async () => {
    vi.mocked(reviewRepository.archive).mockResolvedValue(mockComment as never);

    await reviewService.archive("comment-1");

    expect(reviewRepository.archive).toHaveBeenCalledWith("comment-1");
  });
});

describe("reviewService.list", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes params to repository", async () => {
    vi.mocked(reviewRepository.findMany).mockResolvedValue({
      items: [mockComment],
      total: 1,
    } as never);

    await reviewService.list({
      videoId: "video-1",
      search: "test",
      filter: "open",
      sort: "timestamp",
    });

    expect(reviewRepository.findMany).toHaveBeenCalledWith({
      videoId: "video-1",
      search: "test",
      filter: "open",
      sort: "timestamp",
    });
  });
});

describe("reviewService.approveVideo", () => {
  beforeEach(() => vi.clearAllMocks());

  it("logs VIDEO_APPROVED activity", async () => {
    const { activityService } = await import("@/services/activity.service");

    await reviewService.approveVideo("video-1", "delivery-1", { actorId: "user-1" });

    expect(activityService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "VIDEO_APPROVED",
        entity: "video",
        entityId: "video-1",
      })
    );
  });
});

describe("reviewService.getTimelineMarkers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("delegates to repository", async () => {
    const markers = [{ id: "1", commentCode: "CM-001", timestampSeconds: 10 }];
    vi.mocked(reviewRepository.getTimelineMarkers).mockResolvedValue(markers as never);

    const result = await reviewService.getTimelineMarkers("video-1");

    expect(result).toEqual(markers);
    expect(reviewRepository.getTimelineMarkers).toHaveBeenCalledWith("video-1");
  });
});
