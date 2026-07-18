"use server";

import { reviewService } from "@/services/review.service";
import { getCurrentUser } from "@/lib/auth/session";

/* ============================================
   Reopen Comment Server Action (Team only)
   ============================================ */

export async function reopenCommentAction(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  try {
    await reviewService.reopen(id, { actorId: user.id });
    return { success: true };
  } catch {
    return { success: false, error: "فشل في إعادة فتح التعليق" };
  }
}
