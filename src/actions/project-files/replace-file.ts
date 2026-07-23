"use server";

import { revalidatePath } from "next/cache";

import { projectFileService } from "@/services/project-file.service";
import { getCurrentUser } from "@/lib/auth/session";

/* ============================================
   Replace Project File Server Action
   Deletes old file from R2, uploads new one,
   updates DB record.
   ============================================ */

export async function replaceProjectFileAction(id: string, params: {
  fileName: string;
  fileBuffer: Buffer;
  mimeType: string;
  fileSize: number;
}): Promise<{ success: boolean; error?: string; fileId?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  try {
    const file = await projectFileService.replace(id, {
      fileName: params.fileName,
      fileBuffer: params.fileBuffer,
      mimeType: params.mimeType,
      fileSize: params.fileSize,
      uploadedBy: user.id,
    });

    revalidatePath(`/dashboard/projects/${file.projectId}`);
    return { success: true, fileId: file.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "فشل في استبدال الملف",
    };
  }
}

/* ============================================
   Get Signed Download URL
   ============================================ */

export async function getFileDownloadUrlAction(id: string): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  try {
    const url = await projectFileService.getDownloadUrl(id);
    return { success: true, url };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "فشل في توليد رابط التحميل",
    };
  }
}
