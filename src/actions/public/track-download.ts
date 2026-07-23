"use server";

import { headers } from "next/headers";

import { projectRepository } from "@/repositories/project.repository";
import { videoRepository } from "@/repositories/video.repository";
import { downloadService } from "@/services/download.service";
import { storageService } from "@/lib/storage/storage.service";
import { timelineService } from "@/services/timeline.service";
import { notificationService } from "@/services/notification.service";
import { workflowService } from "@/services/workflow.service";

/* ============================================
   Public Download Tracking
   Tracks download with IP, browser, device.
   Auto-completes project on first final download.
   ============================================ */

export async function trackPublicDownloadAction(
  token: string,
  videoId: string
): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  const project = await projectRepository.findByToken(token);
  if (!project) return { success: false, error: "المشروع غير موجود" };

  // Check if download is enabled
  const workflow = await workflowService.getStatus(project.id);
  if (workflow !== "DELIVERED" && workflow !== "COMPLETED") {
    return { success: false, error: "التحميل غير متاح" };
  }

  const video = await videoRepository.findById(videoId);
  if (!video || !video.downloadUrl) return { success: false, error: "الملف غير موجود" };

  try {
    // Get request metadata
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? headersList.get("x-real-ip")
      ?? "unknown";
    const userAgent = headersList.get("user-agent") ?? "unknown";

    // Track download
    await downloadService.track({
      videoId,
      clientId: project.clientId,
      projectId: project.id,
      ip,
      userAgent,
    });

    // Generate signed download URL (1-hour expiry)
    const url = await storageService.getDownloadUrl(video.downloadUrl, { expiresIn: 3600 });

    // Publish timeline event
    await timelineService.publish({
      projectId: project.id,
      eventType: "DOWNLOAD_COMPLETED",
      title: "تحميل نهائي",
      description: `تم تحميل الفيديو "${video.title}" بواسطة العميل`,
      metadata: { videoId, ip },
      actorName: project.client?.name ?? "العميل",
    });

    // Check if this is the first download — if so, auto-complete
    const downloadCount = await downloadService.count({ projectId: project.id });
    if (downloadCount === 1) {
      // Auto-complete the project
      try {
        await workflowService.transition(
          project.id,
          "COMPLETED",
          { actorName: "النظام (تلقائي)" }
        );
      } catch {
        // If transition not allowed (e.g. already completed), ignore
      }

      // Notify management
      await notificationService.notifyManagement({
        type: "DOWNLOAD_COMPLETED",
        title: "تم تحميل الملف النهائي",
        message: `تم تحميل الملف النهائي للمشروع "${project.name}" — اكتمل المشروع تلقائياً`,
        entity: "project",
        entityId: project.id,
      });
    }

    return { success: true, url };
  } catch {
    return { success: false, error: "فشل في توليد رابط التحميل" };
  }
}
