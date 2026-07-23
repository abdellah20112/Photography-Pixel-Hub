"use server";

import { headers } from "next/headers";
import { projectRepository } from "@/repositories/project.repository";
import { projectFileRepository } from "@/repositories/project-file.repository";
import { storageService } from "@/lib/storage/storage.service";
import { downloadService } from "@/services/download.service";
import { timelineService } from "@/services/timeline.service";

/* ============================================
   Get Public File URL (by token + file ID)
   Generates a signed download URL for a project
   file. Tracks download with IP/UA metadata.
   No authentication required — token-based.
   ============================================ */

export async function getPublicFileUrlAction(
  token: string,
  fileId: string,
): Promise<{
  success: boolean;
  url?: string;
  fileName?: string;
  error?: string;
}> {
  const project = await projectRepository.findByToken(token);
  if (!project) return { success: false, error: "المشروع غير موجود" };

  const file = await projectFileRepository.findById(fileId);
  if (!file || file.projectId !== project.id) {
    return { success: false, error: "الملف غير موجود" };
  }

  try {
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      "unknown";
    const userAgent = headersList.get("user-agent") ?? "unknown";

    // Track download
    await downloadService.track({
      videoId: "00000000-0000-0000-0000-000000000000",
      clientId: project.clientId,
      projectId: project.id,
      ip,
      userAgent,
    });

    // Generate signed download URL (1-hour expiry)
    const url = await storageService.getDownloadUrl(file.storageKey, {
      expiresIn: 3600,
    });

    // Publish timeline event
    await timelineService.publish({
      projectId: project.id,
      eventType: "DOWNLOAD_COMPLETED",
      title: "تحميل ملف",
      description: `تم تحميل الملف "${file.fileName}" بواسطة العميل`,
      metadata: { fileId: file.id, fileType: file.fileType },
      actorName: project.client?.name ?? "العميل",
    });

    return { success: true, url, fileName: file.fileName };
  } catch {
    return { success: false, error: "فشل في توليد رابط التحميل" };
  }
}
