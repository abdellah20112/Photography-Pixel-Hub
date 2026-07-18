"use server";

import { quoteService } from "@/services/financial.service";
import { getCurrentUser } from "@/lib/auth/session";
import { createQuoteSchema } from "@/lib/validations/financial";

/* ============================================
   Create Quote Server Action
   ============================================ */

export async function createQuoteAction(
  _prev: { success: boolean; error?: string },
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  const rawItems = formData.get("items") as string;
  const items = rawItems ? JSON.parse(rawItems) : [];

  const parsed = createQuoteSchema.safeParse({
    clientId: formData.get("clientId"),
    projectId: formData.get("projectId") || undefined,
    items,
    discount: formData.get("discount") || 0,
    tax: formData.get("tax") || 0,
    notes: formData.get("notes") || undefined,
    validUntil: formData.get("validUntil"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  try {
    await quoteService.create(parsed.data, { actorId: user.id, actorName: user.name });
    return { success: true };
  } catch {
    return { success: false, error: "فشل في إنشاء عرض السعر" };
  }
}
