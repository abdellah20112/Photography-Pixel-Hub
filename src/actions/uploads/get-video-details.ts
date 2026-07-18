"use server";

import { videoService } from "@/services/video.service";
import { getCurrentUser } from "@/lib/auth/session";
import type { VideoStatistics } from "@/types/video";

/* ============================================
   Get Video Details Server Action
   Returns video with statistics, timeline, and signed URLs.
   ============================================ */

export async function getVideoDetailsAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const video = await videoService.getById(id);
  if (!video) return null;

  const statistics: VideoStatistics = await videoService.getStatistics(id);

  const timeline = await videoService.getTimeline(id, 20);

  // Generate signed URLs for secure access
  let signedUrls: { streamUrl: string; downloadUrl: string; thumbnailUrl: string | null } | null = null;
  if (video.status === "READY") {
    try {
      signedUrls = await videoService.getSignedUrls(video.storageKey, null);
    } catch {
      signedUrls = null;
    }
  }

  return {
    video,
    statistics,
    timeline,
    signedUrls,
  };
}
