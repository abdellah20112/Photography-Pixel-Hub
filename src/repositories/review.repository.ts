import { prisma } from "@/lib/prisma";
import type { Prisma, CommentStatus } from "@prisma/client";

/* ============================================
   Review Comment Repository
   The ONLY layer that interacts with Prisma
   for ReviewComment operations.
   ============================================ */

export type ReviewCommentWithRelations = Prisma.ReviewCommentGetPayload<{
  include: {
    video: true;
    delivery: true;
    parent: true;
    replies: true;
  };
}>;

export type ReviewCommentCreateInput = Prisma.ReviewCommentUncheckedCreateInput;
export type ReviewCommentUpdateInput = Prisma.ReviewCommentUncheckedUpdateInput;
export type ReviewCommentWhereInput = Prisma.ReviewCommentWhereInput;

/** Map filter values to Prisma status conditions. */
function statusFromFilter(
  filter: string
): CommentStatus | undefined {
  const map: Record<string, CommentStatus> = {
    open: "OPEN",
    resolved: "RESOLVED",
    archived: "ARCHIVED",
  };
  return map[filter];
}

/** Build the WHERE clause for search + filter. */
function buildWhere(params: {
  videoId?: string;
  deliveryId?: string;
  search?: string;
  filter?: string;
}): ReviewCommentWhereInput {
  const where: ReviewCommentWhereInput = {
    parentId: null, // Only top-level comments by default
  };

  if (params.filter && params.filter !== "all") {
    where.status = statusFromFilter(params.filter);
  }

  if (params.videoId) {
    where.videoId = params.videoId;
  }

  if (params.deliveryId) {
    where.deliveryId = params.deliveryId;
  }

  if (params.search) {
    where.OR = [
      { message: { contains: params.search, mode: "insensitive" } },
      { authorName: { contains: params.search, mode: "insensitive" } },
    ];
  }

  return where;
}

/** Build the ORDER BY clause for sorting. */
function buildOrderBy(sort: string): Prisma.ReviewCommentOrderByWithRelationInput {
  if (sort === "oldest") return { createdAt: "asc" };
  if (sort === "timestamp") return { timestampSeconds: "asc" };
  return { createdAt: "desc" };
}

export const reviewRepository = {
  findById(id: string) {
    return prisma.reviewComment.findUnique({
      where: { id },
      include: {
        video: true,
        delivery: true,
        parent: true,
        replies: { orderBy: { createdAt: "asc" } },
      },
    });
  },

  findByVideo(videoId: string) {
    return prisma.reviewComment.findMany({
      where: { videoId, parentId: null },
      include: {
        replies: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { timestampSeconds: "asc" },
    });
  },

  findByDelivery(deliveryId: string) {
    return prisma.reviewComment.findMany({
      where: { deliveryId, parentId: null },
      include: {
        replies: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  create(data: ReviewCommentCreateInput) {
    return prisma.reviewComment.create({
      data,
      include: {
        replies: true,
      },
    });
  },

  update(id: string, data: ReviewCommentUpdateInput) {
    return prisma.reviewComment.update({
      where: { id },
      data,
      include: {
        replies: true,
      },
    });
  },

  /** Resolve a comment. */
  resolve(id: string) {
    return prisma.reviewComment.update({
      where: { id },
      data: {
        status: "RESOLVED" as CommentStatus,
        resolvedAt: new Date(),
      },
    });
  },

  /** Reopen a resolved comment. */
  reopen(id: string) {
    return prisma.reviewComment.update({
      where: { id },
      data: {
        status: "OPEN" as CommentStatus,
        resolvedAt: null,
      },
    });
  },

  /** Archive a comment. */
  archive(id: string) {
    return prisma.reviewComment.update({
      where: { id },
      data: {
        status: "ARCHIVED" as CommentStatus,
      },
    });
  },

  /** Hard delete — used only in tests/cleanup. */
  delete(id: string) {
    return prisma.reviewComment.delete({ where: { id } });
  },

  /** Paginated list with search, filter, and sort. */
  async findMany(params: {
    videoId?: string;
    deliveryId?: string;
    skip?: number;
    take?: number;
    search?: string;
    filter?: string;
    sort?: string;
  }) {
    const where = buildWhere(params);
    const orderBy = buildOrderBy(params.sort ?? "newest");

    const [items, total] = await Promise.all([
      prisma.reviewComment.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy,
        include: {
          replies: { orderBy: { createdAt: "asc" } },
        },
      }),
      prisma.reviewComment.count({ where }),
    ]);

    return { items, total };
  },

  count(where?: ReviewCommentWhereInput) {
    return prisma.reviewComment.count({ where });
  },

  /** Find the latest comment code for sequential generation. */
  findLatestCommentCode() {
    return prisma.reviewComment.findFirst({
      orderBy: { commentCode: "desc" },
      select: { commentCode: true },
    });
  },

  /** Get review statistics for dashboard. */
  async getStatistics(deliveryId?: string) {
    const where = deliveryId ? { deliveryId } : {};

    const [total, open, resolved, archived] = await Promise.all([
      prisma.reviewComment.count({ where: { ...where, parentId: null } }),
      prisma.reviewComment.count({ where: { ...where, status: "OPEN", parentId: null } }),
      prisma.reviewComment.count({ where: { ...where, status: "RESOLVED", parentId: null } }),
      prisma.reviewComment.count({ where: { ...where, status: "ARCHIVED", parentId: null } }),
    ]);

    return {
      totalComments: total,
      openComments: open,
      resolvedComments: resolved,
      archivedComments: archived,
      approvedVideos: 0, // Updated by service when videos are approved
      pendingReviews: open,
    };
  },

  /** Get timeline markers for a video. */
  async getTimelineMarkers(videoId: string) {
    const comments = await prisma.reviewComment.findMany({
      where: { videoId, parentId: null, status: { not: "ARCHIVED" } },
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

    return comments;
  },
};
