"use server";

import { revalidatePath } from "next/cache";

import { videoService } from "@/services/video.service";
import { getCurrentUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";

/* ============================================
   Restore Upload (Video) Server Action
   Restores a soft-deleted video.
   ============================================ */

export async function restoreUploadAction(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  try {
    await videoService.restore(id, { actorId: user.id });
    revalidatePath(ROUTES.DASHBOARD_UPLOADS);
    return { success: true };
  } catch {
    return { success: false, error: "فشل في استعادة الفيديو" };
  }
}
