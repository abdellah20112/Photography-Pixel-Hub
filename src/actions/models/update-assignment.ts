"use server";

import { revalidatePath } from "next/cache";

import { modelService } from "@/services/model.service";
import { getCurrentUser } from "@/lib/auth/session";
import { updateAssignmentSchema } from "@/lib/validations/model";

/* ============================================
   Update Assignment Server Action
   ============================================ */

export async function updateAssignmentAction(
  id: string,
  _prev: { success: boolean; error?: string },
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  const parsed = updateAssignmentSchema.safeParse({
    videosCount: formData.get("videosCount"),
    paymentStatus: formData.get("paymentStatus"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  try {
    await modelService.updateAssignment(id, parsed.data, {
      actorId: user.id,
      actorName: user.name,
    });
    return { success: true };
  } catch {
    return { success: false, error: "فشل في تحديث التعيين" };
  }
}
