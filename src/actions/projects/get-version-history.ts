"use server";

import { videoRepository } from "@/repositories/video.repository";
import { storageService } from "@/lib/storage/storage.service";
import { getCurrentUser } from "@/lib/auth/session";
import type { Video } from "@prisma/client";

/* ============================================
   Get Version History (auth required)
   Derives versions from videos ordered by
   createdAt. No DB schema changes needed.
   ============================================ */

export type VideoVersion = {
  version: number;
  id: string;
  videoCode: string;
  title: string;
  streamUrl: string | null;
  thumbnailUrl: string | null;
  downloadUrl: string | null;
  duration: number | null;
  fileSize: number;
  createdAt: Date;
  isCurrent: boolean;
};

export async function getVersionHistoryAction(
  projectId: string,
): Promise<VideoVersion[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const result = await videoRepository.findMany({
    projectId,
    take: 100,
  });

  // Order by createdAt ascending to assign version numbers
  const orderedVideos = [...result.items].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );

  const versions: VideoVersion[] = await Promise.all(
    orderedVideos
      .filter((v: Video) => v.status === "READY" && !v.deletedAt)
      .map(async (v: Video, idx: number) => {
        const streamUrl = v.streamUrl
          ? await storageService
              .getSignedUrl(v.streamUrl, { expiresIn: 7200 })
              .catch(() => null)
          : null;
        const thumbnailUrl = v.thumbnailUrl
          ? await storageService
              .getSignedUrl(v.thumbnailUrl, { expiresIn: 7200 })
              .catch(() => null)
          : null;
        const downloadUrl = v.downloadUrl
          ? await storageService
              .getDownloadUrl(v.downloadUrl, { expiresIn: 3600 })
              .catch(() => null)
          : null;

        return {
          version: idx + 1,
          id: v.id,
          videoCode: v.videoCode,
          title: v.title,
          streamUrl,
          thumbnailUrl,
          downloadUrl,
          duration: v.duration,
          fileSize: Number(v.fileSize),
          createdAt: v.createdAt,
          isCurrent: idx === orderedVideos.filter((vv) => vv.status === "READY" && !vv.deletedAt).length - 1,
        };
      }),
  );

  return versions;
}
