"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { projectService } from "@/services/project.service";
import { projectFileService } from "@/services/project-file.service";
import { downloadService } from "@/services/download.service";
import { timelineService } from "@/services/timeline.service";
import { transitionWorkflowAction } from "@/actions/workflow/transition";
import { getCurrentUser } from "@/lib/auth/session";
import type { ProjectFileType, ProjectWorkflowStatus } from "@prisma/client";

/* ============================================
   Get Delivery Center Data
   Fetches project + files + downloads for
   the delivery center page.
   ============================================ */

const DELIVERABLE_TYPES: ProjectFileType[] = [
  "FINAL_VIDEO",
  "THUMBNAIL",
  "LOGO",
  "DOCUMENT",
  "INVOICE",
  "CONTRACT",
  "ASSET",
];

export async function getDeliveryCenterDataAction(projectId: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const project = await projectService.getById(projectId);
  if (!project) return null;

  const files = await projectFileService.listByProject(projectId);
  const deliverableFiles = files.filter((f) =>
    DELIVERABLE_TYPES.includes(f.fileType as ProjectFileType),
  );

  // Group files by category
  const grouped = DELIVERABLE_TYPES.map((type) => ({
    type,
    files: deliverableFiles.filter((f) => f.fileType === type),
  })).filter((g) => g.files.length > 0);

  // Total size
  const totalSize = deliverableFiles.reduce((sum, f) => sum + f.fileSize, 0);

  // Downloads
  const downloadStats = await downloadService.getProjectStats(projectId);

  // Recent downloads
  const recentDownloads = await downloadService.list({
    projectId,
    take: 10,
  });

  // Timeline
  const timeline = await timelineService.getByProject(projectId, 20);

  // Checklist
  const checklist = {
    finalVideo: deliverableFiles.some((f) => f.fileType === "FINAL_VIDEO"),
    thumbnail: deliverableFiles.some((f) => f.fileType === "THUMBNAIL"),
    invoice: deliverableFiles.some((f) => f.fileType === "INVOICE"),
    contract: deliverableFiles.some((f) => f.fileType === "CONTRACT"),
    clientApproved:
      project.workflowStatus === "APPROVED" ||
      project.workflowStatus === "DELIVERED" ||
      project.workflowStatus === "COMPLETED",
    reviewCompleted:
      project.workflowStatus !== "NEW" &&
      project.workflowStatus !== "PLANNING" &&
      project.workflowStatus !== "SHOOTING" &&
      project.workflowStatus !== "EDITING",
  };

  const allRequiredMet = checklist.finalVideo && checklist.thumbnail && checklist.reviewCompleted;

  return {
    project: {
      id: project.id,
      name: project.name,
      projectCode: project.projectCode,
      workflowStatus: project.workflowStatus,
      clientId: project.clientId,
      clientName: project.client?.name ?? "",
      clientCode: project.client?.clientCode ?? "",
      createdAt: project.createdAt,
      shootingDate: project.shootingDate,
      deadline: project.deadline,
      token: project.token,
    },
    files: deliverableFiles.map((f) => ({
      id: f.id,
      fileType: f.fileType,
      storageKey: f.storageKey,
      fileName: f.fileName,
      fileSize: f.fileSize,
      mimeType: f.mimeType,
      createdAt: f.createdAt,
    })),
    groupedFiles: grouped.map((g) => ({
      type: g.type,
      files: g.files.map((f) => ({
        id: f.id,
        fileType: f.fileType,
        storageKey: f.storageKey,
        fileName: f.fileName,
        fileSize: f.fileSize,
        mimeType: f.mimeType,
        createdAt: f.createdAt,
      })),
    })),
    totalSize,
    fileCount: deliverableFiles.length,
    downloadStats,
    recentDownloads: recentDownloads.map((d) => ({
      id: d.id,
      ip: d.ip,
      browser: d.browser,
      device: d.device,
      createdAt: d.createdAt,
    })),
    timeline: timeline.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      title: e.title,
      description: e.description,
      actorName: e.actorName,
      createdAt: e.createdAt,
    })),
    checklist,
    allRequiredMet,
  };
}

/* ============================================
   Download Delivery File
   Generates signed download URL + tracks download.
   ============================================ */

export async function downloadDeliveryFileAction(fileId: string): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  try {
    const file = await projectFileService.getById(fileId);
    if (!file) return { success: false, error: "الملف غير موجود" };

    const url = await projectFileService.getDownloadUrl(fileId);

    // Track download
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const userAgent = headersList.get("user-agent") ?? "unknown";

    // Get project to find clientId
    const project = await projectService.getById(file.projectId);
    const clientId = project?.clientId ?? file.projectId;

    await downloadService.track({
      videoId: file.id,
      clientId,
      projectId: file.projectId,
      ip,
      userAgent,
    });

    // Timeline event
    await timelineService.publish({
      projectId: file.projectId,
      eventType: "DOWNLOAD_COMPLETED",
      title: "تحميل ملف",
      description: `تم تحميل الملف "${file.fileName}"`,
      metadata: { fileId, fileName: file.fileName },
      actorId: user.id,
      actorName: user.name,
    });

    revalidatePath(`/dashboard/projects/${file.projectId}/delivery`);
    return { success: true, url };
  } catch {
    return { success: false, error: "فشل في توليد رابط التحميل" };
  }
}

/* ============================================
   Complete Delivery
   Transitions project to COMPLETED.
   Requires checklist to be satisfied.
   ============================================ */

export async function completeDeliveryAction(projectId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  // Verify checklist
  const data = await getDeliveryCenterDataAction(projectId);
  if (!data) return { success: false, error: "المشروع غير موجود" };

  if (!data.allRequiredMet) {
    return { success: false, error: "يجب استيفاء جميع العناصر المطلوبة قبل الإكمال" };
  }

  const result = await transitionWorkflowAction({
    projectId,
    toStatus: "COMPLETED" as ProjectWorkflowStatus,
  });

  if (!result.success) {
    return { success: false, error: result.error ?? "فشل في إكمال التسليم" };
  }

  revalidatePath(`/dashboard/projects/${projectId}/delivery`);
  return { success: true };
}
