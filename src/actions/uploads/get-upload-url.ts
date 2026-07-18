"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { storageService } from "@/lib/storage/storage.service";
import { generateStorageKey, getMimeType, validateVideoFile } from "@/lib/video/metadata";

/* ============================================
   Get Upload URL Server Action
   Generates a presigned URL for direct upload.
   Provider-agnostic — uses StorageService only.
   ============================================ */

export async function getUploadUrlAction(params: {
  projectId: string;
  filename: string;
  fileSize: number;
}): Promise<{
  success: boolean;
  uploadUrl?: string;
  key?: string;
  bucket?: string;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  // Validate file
  const fakeFile = { name: params.filename, size: params.fileSize, type: "" } as File;
  const validation = validateVideoFile(fakeFile);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const key = generateStorageKey(params.projectId, params.filename);
    const mimeType = getMimeType(fakeFile);
    const uploadUrl = await storageService.generateUploadUrl(key, mimeType);

    return {
      success: true,
      uploadUrl,
      key,
      bucket: storageService.bucket,
    };
  } catch {
    return { success: false, error: "فشل في توليد رابط الرفع" };
  }
}
