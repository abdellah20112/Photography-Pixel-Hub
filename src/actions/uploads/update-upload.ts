"use server";

import { revalidatePath } from "next/cache";

import { videoService } from "@/services/video.service";
import { getCurrentUser } from "@/lib/auth/session";
import { updateVideoSchema } from "@/lib/validations/video";
import { ROUTES } from "@/lib/constants";

/* ============================================
   Update Upload (Video) Server Action
   Updates video metadata (title, status, dimensions, etc.)
   ============================================ */

export type UpdateUploadState = {
  success: boolean;
  error?: string;
};

export async function updateUploadAction(
  id: string,
  _prev: UpdateUploadState,
  formData: FormData
): Promise<UpdateUploadState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const parsed = updateVideoSchema.safeParse({
    title: formData.get("title"),
    status: formData.get("status"),
    duration: formData.get("duration"),
    width: formData.get("width"),
    height: formData.get("height"),
    thumbnailUrl: formData.get("thumbnailUrl"),
    streamUrl: formData.get("streamUrl"),
    downloadUrl: formData.get("downloadUrl"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة",
    };
  }

  try {
    await videoService.update(id, parsed.data, { actorId: user.id });
    revalidatePath(ROUTES.DASHBOARD_UPLOADS);
    return { success: true };
  } catch {
    return { success: false, error: "فشل في تحديث الفيديو" };
  }
}
