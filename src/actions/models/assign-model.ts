"use server";

import { modelService } from "@/services/model.service";
import { getCurrentUser } from "@/lib/auth/session";
import { assignModelSchema } from "@/lib/validations/model";
import { revalidatePath } from "next/cache";

/* ============================================
   Assign Model to Project Server Action
   ============================================ */

export async function assignModelAction(
  _prev: { success: boolean; error?: string },
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  const parsed = assignModelSchema.safeParse({
    projectId: formData.get("projectId"),
    modelId: formData.get("modelId"),
    videosCount: formData.get("videosCount"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  try {
    await modelService.assignToProject(parsed.data, {
      actorId: user.id,
      actorName: user.name,
    });
    revalidatePath(`/dashboard/projects/${parsed.data.projectId}`);
    return { success: true };
  } catch (err) {
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "فشل في تعيين الموديل" };
  }
}
