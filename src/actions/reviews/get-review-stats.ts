"use server";

import { reviewService } from "@/services/review.service";
import { getCurrentUser } from "@/lib/auth/session";
import type { ReviewStats } from "@/types/review";

/* ============================================
   Get Review Stats Server Action (Auth)
   Returns review statistics for dashboard widget.
   ============================================ */

export async function getReviewStatsAction(): Promise<ReviewStats> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      totalComments: 0,
      openComments: 0,
      resolvedComments: 0,
      archivedComments: 0,
      approvedVideos: 0,
      pendingReviews: 0,
    };
  }

  return reviewService.getStatistics();
}
