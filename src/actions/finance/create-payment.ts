"use server";

import { paymentService } from "@/services/financial.service";
import { getCurrentUser } from "@/lib/auth/session";
import { createPaymentSchema } from "@/lib/validations/financial";

/* ============================================
   Create Payment Server Action
   Automatically updates invoice paid/remaining/status.
   ============================================ */

export async function createPaymentAction(
  _prev: { success: boolean; error?: string },
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  const parsed = createPaymentSchema.safeParse({
    invoiceId: formData.get("invoiceId"),
    amount: formData.get("amount"),
    paymentMethod: formData.get("paymentMethod"),
    reference: formData.get("reference") || undefined,
    notes: formData.get("notes") || undefined,
    paidAt: formData.get("paidAt") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  try {
    await paymentService.create(parsed.data, { actorId: user.id, actorName: user.name });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "فشل في تسجيل الدفعة" };
  }
}
