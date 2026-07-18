import type { Delivery, DeliveryVideo, Video, Project, ActivityLog } from "@prisma/client";

/* ============================================
   Delivery Types — Application-level types
   ============================================ */

/** Delivery row for table display. */
export type DeliveryTableRow = {
  id: string;
  deliveryCode: string;
  projectId: string;
  title: string;
  slug: string;
  status: Delivery["status"];
  expiresAt: Date | null;
  downloadEnabled: boolean;
  allowStreaming: boolean;
  passwordProtected: boolean;
  viewCount: number;
  downloadCount: number;
  lastViewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  project: {
    id: string;
    name: string;
    projectCode: string;
  };
  videoCount: number;
};

/** Paginated delivery result. */
export type PaginatedDeliveries = {
  items: DeliveryTableRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/** Delivery with videos for details page. */
export type DeliveryWithVideos = Delivery & {
  project: Project;
  videos: (DeliveryVideo & {
    video: Video;
  })[];
};

/** Delivery video item for public portal. */
export type DeliveryVideoItem = {
  id: string;
  order: number;
  videoId: string;
  title: string;
  duration: number | null;
  width: number | null;
  height: number | null;
  fileSize: number;
  thumbnailUrl: string | null;
  streamUrl: string;
  downloadUrl: string;
};

/** Public delivery data (safe to expose). */
export type PublicDeliveryData = {
  deliveryId: string;
  deliveryCode: string;
  title: string;
  slug: string;
  expiresAt: Date | null;
  downloadEnabled: boolean;
  allowStreaming: boolean;
  passwordProtected: boolean;
  viewCount: number;
  downloadCount: number;
  videoCount: number;
  project: {
    name: string;
    projectCode: string;
  };
  videos: DeliveryVideoItem[];
};
