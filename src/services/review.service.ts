import { prisma } from "@/lib/prisma";
import { reviewRepository } from "@/repositories/review.repository";
import { activityService } from "@/services/activity.service";
import { sanitizeMessage } from "@/lib/validations/review";
import type { CommentStatus } from "@prisma/client";

/* ============================================
   Review Service
   Business logic layer — calls repositories only.
   ============================================ */

/** Format a sequential comment code: CM-000001, CM-000002, etc. */
function formatCommentCode(sequence: number): string {
  return `CM-${String(sequence).padStart(6, "0")}`;
}

/** Generate the next unique comment code using a transaction. */
async function generateUniqueCommentCode(): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const latest = await tx.reviewComment.findFirst({
      orderBy: { commentCode: "desc" },
      select: { commentCode: true },
    });

    let sequence = 1;
    if (latest?.commentCode) {
      const match = latest.commentCode.match(/^CM-(\d+)$/);
      if (match) {
        sequence = parseInt(match[1]!, 10) + 1;
      }
    }

    return formatCommentCode(sequence);
  });
}

/** Check if a client comment is still within the 15-minute edit window. */
function canEditComment(createdAt: Date): boolean {
  const elapsed = Date.now() - createdAt.getTime();
  const fifteenMinutes = 15 * 60 * 1000;
  return elapsed <= fifteenMinutes;
}

/** Convert a DB comment to a CommentItem with canEdit flag. */
function toCommentItem(
  comment: {
    id: string;
    commentCode: string;
    videoId: string;
    deliveryId: string;
    parentId: string | null;
    authorName: string;
    authorEmail: string;
    authorType: string;
    message: string;
    timestampSeconds: number;
    status: string;
    resolvedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    replies?: unknown[];
  }
): import("@/types/review").CommentItem {
  return {
    id: comment.id,
    commentCode: comment.commentCode,
    videoId: comment.videoId,
    deliveryId: comment.deliveryId,
    parentId: comment.parentId,
    authorName: comment.authorName,
    authorEmail: comment.authorEmail,
    authorType: comment.authorType as "CLIENT" | "TEAM",
    message: comment.message,
    timestampSeconds: comment.timestampSeconds,
    status: comment.status as "OPEN" | "RESOLVED" | "ARCHIVED",
    resolvedAt: comment.resolvedAt,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    canEdit: comment.authorType === "CLIENT" && canEditComment(comment.createdAt),
    replies: (comment.replies ?? []).map((r) => toCommentItem(r as typeof comment)),
  };
}

export const reviewService = {
  async getById(id: string) {
    return reviewRepository.findById(id);
  },

  async getByVideo(videoId: string) {
    return reviewRepository.findByVideo(videoId);
  },

  async getByDelivery(deliveryId: string) {
    return reviewRepository.findByDelivery(deliveryId);
  },

  async create(
    data: {
      videoId: string;
      deliveryId: string;
      authorName: string;
      authorEmail: string;
      authorType?: "CLIENT" | "TEAM";
      message: string;
      timestampSeconds: number;
      parentId?: string;
    },
    options?: { actorId?: string }
  ) {
    const commentCode = await generateUniqueCommentCode();
    const sanitizedMessage = sanitizeMessage(data.message);

    const comment = await reviewRepository.create({
      commentCode,
      videoId: data.videoId,
      deliveryId: data.deliveryId,
      parentId: data.parentId || null,
      authorName: data.authorName.trim(),
      authorEmail: data.authorEmail.trim().toLowerCase(),
      authorType: data.authorType ?? ("CLIENT" as const),
      message: sanitizedMessage,
      timestampSeconds: data.timestampSeconds,
      status: "OPEN" as CommentStatus,
    });

    // Activity log: Comment Created
    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "COMMENT_CREATED",
        entity: "review_comment",
        entityId: comment.id,
        metadata: {
          commentCode: comment.commentCode,
          videoId: data.videoId,
          deliveryId: data.deliveryId,
        },
      });
    }

    return comment;
  },

  async update(
    id: string,
    data: { message: string },
    options?: { actorId?: string }
  ) {
    // Check edit window for client comments
    const existing = await reviewRepository.findById(id);
    if (!existing) {
      throw new Error("التعليق غير موجود");
    }

    if (existing.authorType === "CLIENT" && !canEditComment(existing.createdAt)) {
      throw new Error("انتهت مدة تعديل التعليق (15 دقيقة)");
    }

    const sanitizedMessage = sanitizeMessage(data.message);
    const comment = await reviewRepository.update(id, { message: sanitizedMessage });

    // Activity log: Comment Updated
    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "COMMENT_UPDATED",
        entity: "review_comment",
        entityId: id,
        metadata: { commentCode: comment.commentCode },
      });
    }

    return comment;
  },

  async resolve(id: string, options?: { actorId?: string }) {
    const comment = await reviewRepository.resolve(id);

    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "COMMENT_RESOLVED",
        entity: "review_comment",
        entityId: id,
        metadata: { commentCode: comment.commentCode },
      });
    }

    return comment;
  },

  async reopen(id: string, options?: { actorId?: string }) {
    const comment = await reviewRepository.reopen(id);

    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "COMMENT_REOPENED",
        entity: "review_comment",
        entityId: id,
        metadata: { commentCode: comment.commentCode },
      });
    }

    return comment;
  },

  async archive(id: string, options?: { actorId?: string }) {
    const comment = await reviewRepository.archive(id);

    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "COMMENT_ARCHIVED",
        entity: "review_comment",
        entityId: id,
        metadata: { commentCode: comment.commentCode },
      });
    }

    return comment;
  },

  async list(params: {
    videoId?: string;
    deliveryId?: string;
    skip?: number;
    take?: number;
    search?: string;
    filter?: string;
    sort?: string;
  }) {
    return reviewRepository.findMany(params);
  },

  async count(params: { deliveryId?: string; filter?: string }) {
    if (params.filter && params.filter !== "all") {
      const statusMap: Record<string, string> = {
        open: "OPEN",
        resolved: "RESOLVED",
        archived: "ARCHIVED",
      };
      const status = statusMap[params.filter];
      if (status) {
        return reviewRepository.count({
          deliveryId: params.deliveryId,
          status: status as CommentStatus,
          parentId: null,
        });
      }
    }
    return reviewRepository.count({
      deliveryId: params.deliveryId,
      parentId: null,
    });
  },

  async getStatistics(deliveryId?: string) {
    return reviewRepository.getStatistics(deliveryId);
  },

  async getTimelineMarkers(videoId: string) {
    return reviewRepository.getTimelineMarkers(videoId);
  },

  /** Approve a video — logs activity. */
  async approveVideo(
    videoId: string,
    deliveryId: string,
    options?: { actorId?: string }
  ) {
    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "VIDEO_APPROVED",
        entity: "video",
        entityId: videoId,
        metadata: { deliveryId },
      });
    }

    return { success: true, videoId };
  },
};
