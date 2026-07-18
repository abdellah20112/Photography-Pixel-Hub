"use server";

import { reviewService } from "@/services/review.service";
import { getCurrentUser } from "@/lib/auth/session";

/* ============================================
   Archive Comment Server Action (Team only)
   ============================================ */

export async function archiveCommentAction(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  try {
    await reviewService.archive(id, { actorId: user.id });
    return { success: true };
  } catch {
    return { success: false, error: "فشل في أرشفة التعليق" };
  }
}
