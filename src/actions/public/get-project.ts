"use server";

import { projectRepository } from "@/repositories/project.repository";
import { videoRepository } from "@/repositories/video.repository";
import { deliveryRepository } from "@/repositories/delivery.repository";
import { storageService } from "@/lib/storage/storage.service";
import type { Video } from "@prisma/client";

/* ============================================
   Get Public Project (by token)
   No auth — token-based access.
   ============================================ */

export type PublicVideoItem = {
  id: string;
  videoCode: string;
  title: string;
  streamUrl: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  status: string;
};

export type PublicProjectData = {
  id: string;
  name: string;
  projectCode: string;
  clientName: string;
  token: string;
  shootingDate: Date | null;
  status: string;
  workflowStatus: string;
  downloadEnabled: boolean;
  videos: PublicVideoItem[];
  delivery?: {
    id: string;
    slug: string;
    title: string;
    expiresAt: Date | null;
    passwordProtected: boolean;
    downloadEnabled: boolean;
    allowStreaming: boolean;
    allowComments: boolean;
  } | null;
};

export async function getPublicProjectAction(token: string): Promise<PublicProjectData | null> {
  const project = await projectRepository.findByToken(token);
  if (!project) return null;

  // Find delivery for this project
  const deliveries = await deliveryRepository.findMany({
    projectId: project.id,
    take: 1,
  });
  const delivery = deliveries.items[0] ?? null;

  // Get videos for the project
  const videos = await videoRepository.findMany({
    projectId: project.id,
    take: 100,
  });

  // Generate signed streaming URLs (2-hour expiry)
  const videoItems: PublicVideoItem[] = await Promise.all(
    videos.items
      .filter((v: Video) => v.status === "READY" && !v.deletedAt)
      .map(async (v: Video) => {
        const streamUrl = v.streamUrl
          ? await storageService.getSignedUrl(v.streamUrl, { expiresIn: 7200 }).catch(() => null)
          : null;
        const thumbnailUrl = v.thumbnailUrl
          ? await storageService.getSignedUrl(v.thumbnailUrl, { expiresIn: 7200 }).catch(() => null)
          : null;
        return {
          id: v.id,
          videoCode: v.videoCode,
          title: v.title,
          streamUrl,
          thumbnailUrl,
          duration: v.duration,
          status: v.status,
        };
      })
  );

  return {
    id: project.id,
    name: project.name,
    projectCode: project.projectCode,
    clientName: project.client?.name ?? "",
    token: project.token,
    shootingDate: project.shootingDate ?? null,
    status: project.status,
    workflowStatus: project.workflowStatus,
    downloadEnabled: delivery?.downloadEnabled ?? false,
    videos: videoItems,
    delivery: delivery
      ? {
          id: delivery.id,
          slug: delivery.slug,
          title: delivery.title,
          expiresAt: delivery.expiresAt,
          passwordProtected: delivery.passwordProtected,
          downloadEnabled: delivery.downloadEnabled,
          allowStreaming: delivery.allowStreaming,
          allowComments: delivery.allowComments,
        }
      : null,
  };
}
