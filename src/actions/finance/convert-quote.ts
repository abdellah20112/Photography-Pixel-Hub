"use server";

import { quoteService } from "@/services/financial.service";
import { getCurrentUser } from "@/lib/auth/session";

/* ============================================
   Convert Quote to Invoice Server Action
   ============================================ */

export async function convertQuoteToInvoiceAction(
  quoteId: string
): Promise<{ success: boolean; error?: string; invoiceId?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  try {
    const invoice = await quoteService.convertToInvoice(quoteId, {
      actorId: user.id,
      actorName: user.name,
    });
    return { success: true, invoiceId: invoice?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "فشل" };
  }
}
