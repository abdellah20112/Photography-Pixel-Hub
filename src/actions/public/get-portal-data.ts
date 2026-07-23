"use server";

import { projectRepository } from "@/repositories/project.repository";
import { videoRepository } from "@/repositories/video.repository";
import { deliveryRepository } from "@/repositories/delivery.repository";
import { projectFileRepository } from "@/repositories/project-file.repository";
import { storageService } from "@/lib/storage/storage.service";
import { deliveryService } from "@/services/delivery.service";
import { WORKFLOW_ORDER } from "@/lib/workflow/transitions";
import type { Video, ProjectFile } from "@prisma/client";

/* ============================================
   Get Portal Data (Public — by token)
   Fetches all data needed for the public client
   portal. Handles password protection and expiry.
   No authentication required — token is the credential.
   ============================================ */

export type PortalVideo = {
  id: string;
  videoCode: string;
  title: string;
  streamUrl: string | null;
  thumbnailUrl: string | null;
  downloadUrl: string | null;
  duration: number | null;
  width: number | null;
  height: number | null;
  fileSize: number;
  status: string;
};

export type PortalFile = {
  id: string;
  fileType: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
};

export type PortalDelivery = {
  id: string;
  slug: string;
  title: string;
  expiresAt: Date | null;
  passwordProtected: boolean;
  downloadEnabled: boolean;
  allowStreaming: boolean;
  allowComments: boolean;
};

export type PortalData = {
  project: {
    name: string;
    projectCode: string;
    clientName: string;
    token: string;
    workflowStatus: string;
    updatedAt: Date;
    shootingDate: Date | null;
    deadline: Date | null;
  };
  videos: PortalVideo[];
  delivery: PortalDelivery | null;
  files: PortalFile[];
  progress: number;
};

export type PortalActionResult =
  | { success: true; data: PortalData }
  | {
      success: false;
      status: "not-found" | "expired" | "password-required";
      error: string;
      projectName?: string;
    };

/** Calculate progress percentage from workflow status. */
function calculateProgress(workflowStatus: string): number {
  const idx = WORKFLOW_ORDER.indexOf(
    workflowStatus as (typeof WORKFLOW_ORDER)[number],
  );
  if (idx === -1) return 0;
  return Math.round((idx / (WORKFLOW_ORDER.length - 1)) * 100);
}

export async function getPortalDataAction(
  token: string,
  password?: string,
): Promise<PortalActionResult> {
  const project = await projectRepository.findByToken(token);
  if (!project) {
    return { success: false, status: "not-found", error: "المشروع غير موجود" };
  }

  // Find delivery for this project
  const deliveries = await deliveryRepository.findMany({
    projectId: project.id,
    take: 1,
  });
  const delivery = deliveries.items[0] ?? null;

  // Check delivery access (expiry)
  if (delivery) {
    const accessStatus = deliveryService.checkAccess(delivery);
    if (accessStatus === "expired") {
      return {
        success: false,
        status: "expired",
        error: "انتهت صلاحية هذا الرابط",
        projectName: project.name,
      };
    }

    // Password check
    if (delivery.passwordProtected) {
      if (!password) {
        return {
          success: false,
          status: "password-required",
          error: "كلمة المرور مطلوبة",
          projectName: project.name,
        };
      }

      const valid = await deliveryService.verifyPassword(
        delivery.slug,
        password,
      );
      if (!valid) {
        return {
          success: false,
          status: "password-required",
          error: "كلمة المرور غير صحيحة",
          projectName: project.name,
        };
      }
    }
  }

  // Get videos with signed URLs
  const videoResult = await videoRepository.findMany({
    projectId: project.id,
    take: 100,
  });

  const allowStreaming = delivery?.allowStreaming ?? true;
  const downloadEnabled =
    delivery?.downloadEnabled ??
    (project.workflowStatus === "DELIVERED" ||
      project.workflowStatus === "COMPLETED");

  const videos: PortalVideo[] = await Promise.all(
    videoResult.items
      .filter((v: Video) => v.status === "READY" && !v.deletedAt)
      .map(async (v: Video) => {
        const streamUrl =
          allowStreaming && v.streamUrl
            ? await storageService
                .getSignedUrl(v.streamUrl, { expiresIn: 7200 })
                .catch(() => null)
            : null;
        const thumbnailUrl = v.thumbnailUrl
          ? await storageService
              .getSignedUrl(v.thumbnailUrl, { expiresIn: 7200 })
              .catch(() => null)
            : null;
        const downloadUrl =
          downloadEnabled && v.downloadUrl
            ? await storageService
                .getDownloadUrl(v.downloadUrl, { expiresIn: 3600 })
                .catch(() => null)
            : null;
        return {
          id: v.id,
          videoCode: v.videoCode,
          title: v.title,
          streamUrl,
          thumbnailUrl,
          downloadUrl,
          duration: v.duration,
          width: v.width,
          height: v.height,
          fileSize: Number(v.fileSize),
          status: v.status,
        };
      }),
  );

  // Get project files
  const projectFiles = await projectFileRepository.findByProject(project.id);
  const files: PortalFile[] = projectFiles.map((f: ProjectFile) => ({
    id: f.id,
    fileType: f.fileType,
    fileName: f.fileName,
    fileSize: f.fileSize,
    mimeType: f.mimeType,
  }));

  return {
    success: true,
    data: {
      project: {
        name: project.name,
        projectCode: project.projectCode,
        clientName: project.client?.name ?? "",
        token: project.token,
        workflowStatus: project.workflowStatus,
        updatedAt: project.updatedAt,
        shootingDate: project.shootingDate ?? null,
        deadline: project.deadline ?? null,
      },
      videos,
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
      files,
      progress: calculateProgress(project.workflowStatus),
    },
  };
}
