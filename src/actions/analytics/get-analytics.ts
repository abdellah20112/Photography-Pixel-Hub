"use server";

import { clientService } from "@/services/client.service";
import { projectService } from "@/services/project.service";
import { videoService } from "@/services/video.service";
import { downloadService } from "@/services/download.service";
import { getCurrentUser } from "@/lib/auth/session";

/* ============================================
   Get Analytics Server Action (Legacy)
   ============================================ */

export async function getAnalyticsAction() {
  const user = await getCurrentUser();
  const userId = user?.id ?? "";

  const [totalClients, totalProjects, totalVideos, totalDownloads] =
    await Promise.all([
      clientService.count(userId),
      projectService.count({}),
      videoService.count({}),
      downloadService.count({}),
    ]);

  return {
    totalClients,
    totalProjects,
    totalVideos,
    totalDownloads,
  };
}
