"use server";

import { revalidatePath } from "next/cache";

import { modelService } from "@/services/model.service";
import { getCurrentUser } from "@/lib/auth/session";
import { createModelSchema } from "@/lib/validations/model";
import { ROUTES } from "@/lib/constants";

/* ============================================
   Create Model Server Action
   ============================================ */

export type CreateModelState = {
  success: boolean;
  error?: string;
};

export async function createModelAction(
  _prev: CreateModelState,
  formData: FormData
): Promise<CreateModelState> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  const parsed = createModelSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    email: formData.get("email"),
    photo: formData.get("photo"),
    notes: formData.get("notes"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  try {
    await modelService.create(parsed.data, { actorId: user.id });
    revalidatePath(ROUTES.DASHBOARD_MODELS);
    return { success: true };
  } catch {
    return { success: false, error: "فشل في إنشاء الموديل" };
  }
}
