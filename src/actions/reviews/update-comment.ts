"use server";

import { reviewService } from "@/services/review.service";
import { updateCommentSchema } from "@/lib/validations/review";

/* ============================================
   Update Comment Server Action (Public)
   Allows editing within 15-minute window for clients.
   ============================================ */

export async function updateCommentAction(
  id: string,
  message: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  const parsed = updateCommentSchema.safeParse({ message });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة",
    };
  }

  try {
    await reviewService.update(id, { message: parsed.data.message });
    return { success: true };
  } catch (err) {
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "فشل في تحديث التعليق" };
  }
}
