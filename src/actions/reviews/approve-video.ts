"use server";

import { reviewService } from "@/services/review.service";

/* ============================================
   Approve Video Server Action (Public — Client)
   Logs video approval activity.
   ============================================ */

export async function approveVideoAction(params: {
  videoId: string;
  deliveryId: string;
  deliverySlug: string;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await reviewService.approveVideo(params.videoId, params.deliveryId);
    return { success: true };
  } catch {
    return { success: false, error: "فشل في اعتماد الفيديو" };
  }
}
