"use server";

import { invoiceService } from "@/services/financial.service";
import { getCurrentUser } from "@/lib/auth/session";
import type { InvoiceStatus } from "@prisma/client";

/* ============================================
   Update Invoice Status Server Action
   ============================================ */

export async function updateInvoiceStatusAction(
  id: string,
  status: InvoiceStatus
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  try {
    await invoiceService.updateStatus(id, status, { actorId: user.id, actorName: user.name });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "فشل" };
  }
}
