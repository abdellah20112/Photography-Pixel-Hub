"use server";

import { revalidatePath } from "next/cache";

import { projectFileService } from "@/services/project-file.service";
import { projectFileRepository } from "@/repositories/project-file.repository";
import { projectService } from "@/services/project.service";
import { getCurrentUser } from "@/lib/auth/session";
import type { ProjectFileType } from "@prisma/client";

/* ============================================
   Upload Project File Server Action
   Accepts file buffer via FormData, uploads to R2,
   saves metadata in ProjectFile DB record.
   ============================================ */

export async function uploadProjectFileAction(params: {
  projectId: string;
  fileType: ProjectFileType;
  fileName: string;
  fileBuffer: Buffer;
  mimeType: string;
  fileSize: number;
  subfolder?: "assets" | "music" | "invoices" | "contracts" | null;
}): Promise<{ success: boolean; error?: string; fileId?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  const project = await projectService.getById(params.projectId);
  if (!project) return { success: false, error: "المشروع غير موجود" };

  try {
    const file = await projectFileService.upload({
      projectId: params.projectId,
      projectCode: project.projectCode,
      fileType: params.fileType,
      fileName: params.fileName,
      fileBuffer: params.fileBuffer,
      mimeType: params.mimeType,
      fileSize: params.fileSize,
      uploadedBy: user.id,
      subfolder: params.subfolder,
    });

    revalidatePath(`/dashboard/projects/${params.projectId}`);
    return { success: true, fileId: file.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "فشل في رفع الملف",
    };
  }
}

/* ============================================
   Generate Presigned Upload URL
   For direct browser-to-R2 upload (large files).
   ============================================ */

export async function getPresignedUploadUrlAction(params: {
  projectId: string;
  fileName: string;
  mimeType: string;
  subfolder?: "assets" | "music" | "invoices" | "contracts" | null;
}): Promise<{
  success: boolean;
  error?: string;
  uploadUrl?: string;
  storageKey?: string;
}> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  const project = await projectService.getById(params.projectId);
  if (!project) return { success: false, error: "المشروع غير موجود" };

  try {
    const { uploadUrl, storageKey } = await projectFileService.generatePresignedUploadUrl({
      projectCode: project.projectCode,
      fileName: params.fileName,
      mimeType: params.mimeType,
      subfolder: params.subfolder,
    });

    return { success: true, uploadUrl, storageKey };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "فشل في توليد رابط الرفع",
    };
  }
}

/* ============================================
   Complete Presigned Upload
   Saves DB record after browser uploaded to R2.
   ============================================ */

export async function completePresignedUploadAction(params: {
  projectId: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileType: ProjectFileType;
}): Promise<{ success: boolean; error?: string; fileId?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  const project = await projectService.getById(params.projectId);
  if (!project) return { success: false, error: "المشروع غير موجود" };

  try {
    const file = await projectFileRepository.create({
      projectId: params.projectId,
      fileType: params.fileType,
      storageKey: params.storageKey,
      fileName: params.fileName,
      fileSize: params.fileSize,
      mimeType: params.mimeType,
      uploadedBy: user.id,
    });

    revalidatePath(`/dashboard/projects/${params.projectId}`);
    return { success: true, fileId: file.id };
  } catch {
    return { success: false, error: "فشل في حفظ بيانات الملف" };
  }
}
