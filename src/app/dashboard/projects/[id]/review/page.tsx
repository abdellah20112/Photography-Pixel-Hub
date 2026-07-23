import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { projectService } from "@/services/project.service";
import { projectFileService } from "@/services/project-file.service";
import { videoService } from "@/services/video.service";
import { getCurrentUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ReviewStudio } from "@/components/review/review-studio";
import type { ProjectFileType } from "@prisma/client";

/* ============================================
   Project Review Page
   Professional video review interface.
   ============================================ */

export default async function ProjectReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const project = await projectService.getById(id);
  if (!project) notFound();

  const user = await getCurrentUser();

  // Get project files that are videos (preview or final)
  const files = await projectFileService.listByProject(id);
  const videoFiles = files.filter(
    (f) => f.fileType === "PREVIEW_VIDEO" || f.fileType === "FINAL_VIDEO",
  );

  // Generate signed streaming URLs for each video file
  const videosWithUrls = await Promise.all(
    videoFiles.map(async (file) => {
      let streamUrl: string | null = null;
      try {
        streamUrl = await projectFileService.getStreamingUrl(file.id);
      } catch {
        streamUrl = null;
      }
      return {
        id: file.id,
        videoCode: file.id.slice(0, 8),
        title: file.fileName,
        streamUrl,
        thumbnailUrl: null as string | null,
        duration: null as number | null,
        status: "READY",
        fileType: file.fileType as ProjectFileType,
      };
    }),
  );

  // Also get videos from the Video model (legacy uploads)
  const legacyVideos = await videoService.list({ projectId: id, take: 100 });
  for (const video of legacyVideos.items) {
    if (video.status !== "READY" || video.deletedAt) continue;
    let streamUrl: string | null = null;
    try {
      const signedUrls = await videoService.getSignedUrls(video.storageKey);
      streamUrl = signedUrls.streamUrl;
    } catch {
      streamUrl = null;
    }
    videosWithUrls.push({
      id: video.id,
      videoCode: video.videoCode,
      title: video.title,
      streamUrl,
      thumbnailUrl: null,
      duration: video.duration,
      status: video.status,
      fileType: "PREVIEW_VIDEO" as ProjectFileType,
    });
  }

  return (
    <ReviewStudio
      projectId={project.id}
      projectCode={project.projectCode}
      projectName={project.name}
      workflowStatus={project.workflowStatus}
      projectToken={project.token}
      videos={videosWithUrls}
      isTeam={!!user}
    />
  );
}
