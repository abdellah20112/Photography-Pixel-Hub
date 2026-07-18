"use server";

import { revalidatePath } from "next/cache";

import { videoService } from "@/services/video.service";
import { getCurrentUser } from "@/lib/auth/session";
import { createVideoSchema } from "@/lib/validations/video";
import { ROUTES } from "@/lib/constants";

/* ============================================
   Create Upload (Video) Server Action
   Creates a video record after upload to R2.
   ============================================ */

export type CreateUploadState = {
  success: boolean;
  error?: string;
  videoId?: string;
};

export async function createUploadAction(
  _prev: CreateUploadState,
  formData: FormData
): Promise<CreateUploadState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const parsed = createVideoSchema.safeParse({
    projectId: formData.get("projectId"),
    title: formData.get("title"),
    originalFileName: formData.get("originalFileName"),
    storageKey: formData.get("storageKey"),
    storageBucket: formData.get("storageBucket"),
    mimeType: formData.get("mimeType"),
    extension: formData.get("extension"),
    fileSize: formData.get("fileSize"),
    duration: formData.get("duration"),
    width: formData.get("width"),
    height: formData.get("height"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة",
    };
  }

  try {
    const video = await videoService.create(
      {
        projectId: parsed.data.projectId,
        title: parsed.data.title,
        originalFileName: parsed.data.originalFileName,
        storageKey: parsed.data.storageKey,
        storageBucket: parsed.data.storageBucket,
        mimeType: parsed.data.mimeType,
        extension: parsed.data.extension,
        fileSize: parsed.data.fileSize,
        duration: parsed.data.duration,
        width: parsed.data.width,
        height: parsed.data.height,
      },
      { actorId: user.id }
    );

    revalidatePath(ROUTES.DASHBOARD_UPLOADS);
    return { success: true, videoId: video.id };
  } catch {
    return { success: false, error: "فشل في إنشاء الفيديو" };
  }
}
