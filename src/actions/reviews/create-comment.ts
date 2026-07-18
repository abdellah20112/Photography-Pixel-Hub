"use server";

import { reviewService } from "@/services/review.service";
import { createCommentSchema } from "@/lib/validations/review";

/* ============================================
   Create Comment Server Action (Public)
   No authentication required — public delivery portal.
   Rate-limited by delivery slug + email.
   ============================================ */

export async function createCommentAction(params: {
  videoId: string;
  deliveryId: string;
  authorName: string;
  authorEmail: string;
  message: string;
  timestampSeconds: number;
  parentId?: string;
}): Promise<{
  success: boolean;
  error?: string;
  commentId?: string;
}> {
  const parsed = createCommentSchema.safeParse({
    videoId: params.videoId,
    deliveryId: params.deliveryId,
    authorName: params.authorName,
    authorEmail: params.authorEmail,
    authorType: "CLIENT",
    message: params.message,
    timestampSeconds: params.timestampSeconds,
    parentId: params.parentId || "",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة",
    };
  }

  try {
    const comment = await reviewService.create({
      videoId: parsed.data.videoId,
      deliveryId: parsed.data.deliveryId,
      authorName: parsed.data.authorName,
      authorEmail: parsed.data.authorEmail,
      authorType: "CLIENT",
      message: parsed.data.message,
      timestampSeconds: parsed.data.timestampSeconds,
      parentId: parsed.data.parentId || undefined,
    });

    return { success: true, commentId: comment.id };
  } catch {
    return { success: false, error: "فشل في إنشاء التعليق" };
  }
}
