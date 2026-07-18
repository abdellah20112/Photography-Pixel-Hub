import type { Video, Project, ActivityLog } from "@prisma/client";

/* ============================================
   Video Types — Application-level types
   (Repository-level types live in repositories/)
   ============================================ */

/** Video with related project loaded. */
export type VideoWithProject = Video & {
  project: Pick<Project, "id" | "name" | "projectCode">;
};

/** Video row for table/grid display. */
export type VideoTableRow = {
  id: string;
  videoCode: string;
  projectId: string;
  title: string;
  originalFileName: string;
  mimeType: string;
  extension: string;
  fileSize: number;
  duration: number | null;
  width: number | null;
  height: number | null;
  thumbnailUrl: string | null;
  streamUrl: string | null;
  downloadUrl: string | null;
  status: Video["status"];
  uploadedAt: Date | null;
  processedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  project: {
    id: string;
    name: string;
    projectCode: string;
  };
};

/** Paginated video result. */
export type PaginatedVideos = {
  items: VideoTableRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/** Video statistics for details page. */
export type VideoStatistics = {
  views: number;
  downloads: number;
};

/** Video details with full relations. */
export type VideoDetails = Video & {
  project: Project;
  _count?: {
    downloads: number;
    views: number;
  };
};

/** Client-side upload queue item. */
export type UploadQueueItem = {
  id: string;
  file: File;
  status: "waiting" | "uploading" | "processing" | "completed" | "failed";
  progress: number;
  error?: string;
  videoId?: string;
  abortController?: AbortController;
};

/** Upload presigned URL response. */
export type PresignedUploadResponse = {
  uploadUrl: string;
  key: string;
  bucket: string;
};
