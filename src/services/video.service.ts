import { prisma } from "@/lib/prisma";
import { videoRepository } from "@/repositories/video.repository";
import { activityService } from "@/services/activity.service";
import { storageService } from "@/lib/storage/storage.service";
import type { VideoStatus } from "@prisma/client";

/* ============================================
   Video Service
   Business logic layer — calls repositories only.
   ============================================ */

/** Format a sequential video code: VD-000001, VD-000002, etc. */
function formatVideoCode(sequence: number): string {
  return `VD-${String(sequence).padStart(6, "0")}`;
}

/** Generate the next unique video code using a transaction. */
async function generateUniqueVideoCode(): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const latest = await tx.video.findFirst({
      orderBy: { videoCode: "desc" },
      select: { videoCode: true },
    });

    let sequence = 1;
    if (latest?.videoCode) {
      const match = latest.videoCode.match(/^VD-(\d+)$/);
      if (match) {
        sequence = parseInt(match[1]!, 10) + 1;
      }
    }

    return formatVideoCode(sequence);
  });
}

export const videoService = {
  async getById(id: string) {
    return videoRepository.findById(id);
  },

  async getByVideoCode(videoCode: string) {
    return videoRepository.findByVideoCode(videoCode);
  },

  async getByStorageKey(storageKey: string) {
    return videoRepository.findByStorageKey(storageKey);
  },

  async create(
    data: {
      projectId: string;
      title: string;
      originalFileName: string;
      storageKey: string;
      storageBucket: string;
      mimeType: string;
      extension: string;
      fileSize: bigint;
      duration?: number;
      width?: number;
      height?: number;
      status?: VideoStatus;
    },
    options?: { actorId?: string }
  ) {
    const videoCode = await generateUniqueVideoCode();

    const video = await videoRepository.create({
      videoCode,
      projectId: data.projectId,
      title: data.title.trim(),
      originalFileName: data.originalFileName,
      storageKey: data.storageKey,
      storageBucket: data.storageBucket,
      mimeType: data.mimeType,
      extension: data.extension,
      fileSize: data.fileSize,
      duration: data.duration,
      width: data.width,
      height: data.height,
      status: data.status ?? ("UPLOADING" as VideoStatus),
      uploadedAt: new Date(),
    });

    // Activity log: Video Uploaded
    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "UPLOAD",
        entity: "video",
        entityId: video.id,
        metadata: {
          videoCode: video.videoCode,
          title: video.title,
          projectId: video.projectId,
        },
      });
    }

    return video;
  },

  async update(
    id: string,
    data: {
      title?: string;
      status?: VideoStatus;
      duration?: number;
      width?: number;
      height?: number;
      thumbnailUrl?: string;
      streamUrl?: string;
      downloadUrl?: string;
    },
    options?: { actorId?: string }
  ) {
    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.status !== undefined) updateData.status = data.status;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.width !== undefined) updateData.width = data.width;
    if (data.height !== undefined) updateData.height = data.height;
    if (data.thumbnailUrl !== undefined) updateData.thumbnailUrl = data.thumbnailUrl || null;
    if (data.streamUrl !== undefined) updateData.streamUrl = data.streamUrl || null;
    if (data.downloadUrl !== undefined) updateData.downloadUrl = data.downloadUrl || null;

    if (data.status === "READY") {
      updateData.processedAt = new Date();
    }

    const video = await videoRepository.update(id, updateData as never);

    // Activity log: Video Processed
    if (options?.actorId && data.status === "READY") {
      await activityService.log({
        userId: options.actorId,
        type: "UPDATE",
        entity: "video",
        entityId: video.id,
        metadata: {
          videoCode: video.videoCode,
          title: video.title,
          status: data.status,
        },
      });
    }

    return video;
  },

  /** Mark video as processing. */
  async markProcessing(id: string) {
    return videoRepository.update(id, {
      status: "PROCESSING" as VideoStatus,
    } as never);
  },

  /** Mark video as ready with metadata. */
  async markReady(
    id: string,
    data: {
      duration?: number;
      width?: number;
      height?: number;
      thumbnailUrl?: string;
    },
    options?: { actorId?: string }
  ) {
    return this.update(
      id,
      {
        status: "READY" as VideoStatus,
        duration: data.duration,
        width: data.width,
        height: data.height,
        thumbnailUrl: data.thumbnailUrl,
      },
      options
    );
  },

  /** Mark video as failed. */
  async markFailed(id: string) {
    return videoRepository.update(id, {
      status: "FAILED" as VideoStatus,
    } as never);
  },

  /** Soft delete — archives the video. */
  async softDelete(id: string, options?: { actorId?: string }) {
    const video = await videoRepository.softDelete(id);

    // Activity log: Video Deleted
    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "DELETE",
        entity: "video",
        entityId: id,
        metadata: {
          videoCode: video.videoCode,
          title: video.title,
        },
      });
    }

    return video;
  },

  /** Restore a deleted video. */
  async restore(id: string, options?: { actorId?: string }) {
    const video = await videoRepository.restore(id);

    // Activity log: Video Restored
    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "RESTORE",
        entity: "video",
        entityId: id,
        metadata: {
          videoCode: video.videoCode,
          title: video.title,
        },
      });
    }

    return video;
  },

  /** Soft delete alias for backward compatibility. */
  async delete(id: string, options?: { actorId?: string }) {
    return this.softDelete(id, options);
  },

  async list(params: {
    projectId?: string;
    skip?: number;
    take?: number;
    search?: string;
    filter?: string;
    sort?: string;
  }) {
    return videoRepository.findMany(params);
  },

  async count(params: { projectId?: string; filter?: string }) {
    if (params.filter === "deleted") {
      return videoRepository.count({
        projectId: params.projectId,
        status: "DELETED",
      });
    }
    if (params.filter && params.filter !== "all") {
      const statusMap: Record<string, string> = {
        ready: "READY",
        processing: "PROCESSING",
        uploading: "UPLOADING",
        failed: "FAILED",
      };
      const status = statusMap[params.filter];
      if (status) {
        return videoRepository.count({
          projectId: params.projectId,
          status: status as VideoStatus,
        });
      }
    }
    return videoRepository.count({
      projectId: params.projectId,
      status: { not: "DELETED" },
    });
  },

  async getStatistics(videoId: string) {
    return videoRepository.getStatistics(videoId);
  },

  async getTimeline(videoId: string, take = 20) {
    return activityService.list({
      entity: "video",
      entityId: videoId,
      take,
    });
  },

  /** Generate signed URLs for a video's storage key. */
  async getSignedUrls(
    storageKey: string,
    thumbnailKey?: string | null
  ): Promise<{
    streamUrl: string;
    downloadUrl: string;
    thumbnailUrl: string | null;
  }> {
    const [streamUrl, downloadUrl, thumbnailUrl] = await Promise.all([
      storageService.getStreamingUrl(storageKey),
      storageService.getDownloadUrl(storageKey),
      thumbnailKey ? storageService.getSignedUrl(thumbnailKey) : Promise.resolve(null),
    ]);

    return { streamUrl, downloadUrl, thumbnailUrl };
  },

  /** Export all non-deleted videos as CSV rows. */
  async exportCsv(projectId?: string): Promise<string> {
    const videos = await videoRepository.findAllForExport(projectId);

    const headers = [
      "كود الفيديو",
      "العنوان",
      "الملف الأصلي",
      "المشروع",
      "كود المشروع",
      "الحالة",
      "المدة (ثانية)",
      "الدقة",
      "الحجم (بايت)",
      "النوع",
      "تاريخ الرفع",
    ];

    const escapeCsv = (value: string | null | undefined): string => {
      if (value == null) return "";
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const statusLabels: Record<string, string> = {
      UPLOADING: "جاري الرفع",
      PROCESSING: "قالمعالجة",
      READY: "جاهز",
      FAILED: "فشل",
      DELETED: "محذوف",
    };

    const rows = videos.map((v) =>
      [
        v.videoCode,
        v.title,
        v.originalFileName,
        v.project.name,
        v.project.projectCode,
        statusLabels[v.status] ?? v.status,
        v.duration ? String(v.duration) : "",
        v.width && v.height ? `${v.width}x${v.height}` : "",
        String(v.fileSize),
        v.mimeType,
        v.createdAt.toISOString(),
      ]
        .map(escapeCsv)
        .join(",")
    );

    return "\uFEFF" + [headers.map(escapeCsv).join(","), ...rows].join("\n");
  },
};
