"use server";

import { revalidatePath } from "next/cache";

import { videoService } from "@/services/video.service";
import { getCurrentUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";

/* ============================================
   Delete Upload (Video) Server Action
   Soft delete only — sets status to DELETED.
   ============================================ */

export async function deleteUploadAction(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  try {
    await videoService.softDelete(id, { actorId: user.id });
    revalidatePath(ROUTES.DASHBOARD_UPLOADS);
    return { success: true };
  } catch {
    return { success: false, error: "فشل في حذف الفيديو" };
  }
}
