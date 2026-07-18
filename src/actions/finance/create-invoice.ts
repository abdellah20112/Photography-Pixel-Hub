"use server";

import { invoiceService } from "@/services/financial.service";
import { getCurrentUser } from "@/lib/auth/session";
import { createInvoiceSchema } from "@/lib/validations/financial";

/* ============================================
   Create Invoice Server Action
   ============================================ */

export async function createInvoiceAction(
  _prev: { success: boolean; error?: string },
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  const rawItems = formData.get("items") as string;
  const items = rawItems ? JSON.parse(rawItems) : [];

  const parsed = createInvoiceSchema.safeParse({
    clientId: formData.get("clientId"),
    projectId: formData.get("projectId") || undefined,
    quoteId: formData.get("quoteId") || undefined,
    items,
    discount: formData.get("discount") || 0,
    tax: formData.get("tax") || 0,
    notes: formData.get("notes") || undefined,
    issueDate: formData.get("issueDate"),
    dueDate: formData.get("dueDate") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  try {
    await invoiceService.create(parsed.data, { actorId: user.id, actorName: user.name });
    return { success: true };
  } catch {
    return { success: false, error: "فشل في إنشاء الفاتورة" };
  }
}
