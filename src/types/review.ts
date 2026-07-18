import type { ReviewComment, Video, Delivery } from "@prisma/client";

/* ============================================
   Review Types — Application-level types
   ============================================ */

/** Comment with replies loaded. */
export type CommentWithReplies = ReviewComment & {
  replies: ReviewComment[];
};

/** Comment item for UI display. */
export type CommentItem = {
  id: string;
  commentCode: string;
  videoId: string;
  deliveryId: string;
  parentId: string | null;
  authorName: string;
  authorEmail: string;
  authorType: ReviewComment["authorType"];
  message: string;
  timestampSeconds: number;
  status: ReviewComment["status"];
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  canEdit: boolean;
  replies: CommentItem[];
};

/** Timeline marker for video player. */
export type TimelineMarker = {
  id: string;
  commentCode: string;
  timestampSeconds: number;
  authorName: string;
  message: string;
  status: ReviewComment["status"];
};

/** Review statistics for dashboard widget. */
export type ReviewStats = {
  totalComments: number;
  openComments: number;
  resolvedComments: number;
  archivedComments: number;
  approvedVideos: number;
  pendingReviews: number;
};

/** Paginated comment result. */
export type PaginatedComments = {
  items: CommentItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
