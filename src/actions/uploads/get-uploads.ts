"use server";

import { videoService } from "@/services/video.service";
import { getCurrentUser } from "@/lib/auth/session";
import { PAGINATION } from "@/lib/constants";
import type { VideoFilterValue, VideoSortValue } from "@/lib/validations/video";

/* ============================================
   Get Uploads (Videos) Server Action
   Paginated list with search, filter, and sort.
   ============================================ */

export async function getUploadsAction(params?: {
  page?: number;
  pageSize?: number;
  projectId?: string;
  search?: string;
  filter?: VideoFilterValue;
  sort?: VideoSortValue;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
      totalPages: 0,
    };
  }

  const page = params?.page ?? PAGINATION.DEFAULT_PAGE;
  const pageSize = params?.pageSize ?? 12;
  const skip = (page - 1) * pageSize;

  const { items, total } = await videoService.list({
    projectId: params?.projectId,
    skip,
    take: pageSize,
    search: params?.search,
    filter: params?.filter ?? "all",
    sort: params?.sort ?? "newest",
  });

  const totalPages = Math.ceil(total / pageSize);

  return {
    items: items.map((v) => ({
      id: v.id,
      videoCode: v.videoCode,
      projectId: v.projectId,
      title: v.title,
      originalFileName: v.originalFileName,
      mimeType: v.mimeType,
      extension: v.extension,
      fileSize: Number(v.fileSize),
      duration: v.duration,
      width: v.width,
      height: v.height,
      thumbnailUrl: v.thumbnailUrl,
      streamUrl: v.streamUrl,
      downloadUrl: v.downloadUrl,
      status: v.status,
      uploadedAt: v.uploadedAt,
      processedAt: v.processedAt,
      deletedAt: v.deletedAt,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
      project: {
        id: v.project.id,
        name: v.project.name,
        projectCode: v.project.projectCode,
      },
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
}
