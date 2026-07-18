import type { Video, VideoStatus } from "@prisma/client";

/* ============================================
   Upload / Video Types — Application-level types
   ============================================ */

export type { VideoStatus };

/** Video with related project loaded. */
export type VideoWithProject = Video & { project: import("@prisma/client").Project };

/** Lightweight summary for lists/cards. */
export type VideoSummary = {
  id: string;
  title: string;
  status: VideoStatus;
  size: bigint;
  duration: number | null;
  thumbnailKey: string | null;
  createdAt: Date;
};

/** Paginated video result. */
export type PaginatedVideos = {
  items: VideoSummary[];
  total: number;
  page: number;
  pageSize: number;
};
