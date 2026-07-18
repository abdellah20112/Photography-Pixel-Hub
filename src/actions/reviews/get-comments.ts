"use server";

import { reviewService } from "@/services/review.service";
import type { CommentFilterValue, CommentSortValue } from "@/lib/validations/review";
import type { CommentItem } from "@/types/review";

/* ============================================
   Get Comments Server Action (Public)
   Returns comments for a video or delivery.
   ============================================ */

export async function getCommentsAction(params: {
  videoId?: string;
  deliveryId?: string;
  search?: string;
  filter?: CommentFilterValue;
  sort?: CommentSortValue;
}): Promise<{
  items: CommentItem[];
  total: number;
}> {
  const { items, total } = await reviewService.list({
    videoId: params.videoId,
    deliveryId: params.deliveryId,
    search: params?.search,
    filter: params?.filter ?? "all",
    sort: params?.sort ?? "newest",
    take: 200, // Get all comments for a video
  });

  const mapped: CommentItem[] = items.map((c) => ({
    id: c.id,
    commentCode: c.commentCode,
    videoId: c.videoId,
    deliveryId: c.deliveryId,
    parentId: c.parentId,
    authorName: c.authorName,
    authorEmail: c.authorEmail,
    authorType: c.authorType,
    message: c.message,
    timestampSeconds: c.timestampSeconds,
    status: c.status,
    resolvedAt: c.resolvedAt,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    canEdit: c.authorType === "CLIENT" && (Date.now() - c.createdAt.getTime()) <= 15 * 60 * 1000,
    replies: (c.replies ?? []).map((r) => ({
      id: r.id,
      commentCode: r.commentCode,
      videoId: r.videoId,
      deliveryId: r.deliveryId,
      parentId: r.parentId,
      authorName: r.authorName,
      authorEmail: r.authorEmail,
      authorType: r.authorType,
      message: r.message,
      timestampSeconds: r.timestampSeconds,
      status: r.status,
      resolvedAt: r.resolvedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      canEdit: false,
      replies: [],
    })),
  }));

  return { items: mapped, total };
}
