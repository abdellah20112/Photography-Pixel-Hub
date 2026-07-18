"use server";

import { quoteService } from "@/services/financial.service";
import { getCurrentUser } from "@/lib/auth/session";
import type { QuoteStatus } from "@prisma/client";

/* ============================================
   Update Quote Status Server Action
   ============================================ */

export async function updateQuoteStatusAction(
  id: string,
  status: QuoteStatus
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  try {
    await quoteService.updateStatus(id, status, { actorId: user.id, actorName: user.name });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "فشل" };
  }
}
