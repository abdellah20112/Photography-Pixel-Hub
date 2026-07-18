"use server";

import { revalidatePath } from "next/cache";

import { modelService } from "@/services/model.service";
import { getCurrentUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";

/* ============================================
   Delete Model Server Action
   Soft delete — sets status to INACTIVE.
   ============================================ */

export async function deleteModelAction(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  try {
    await modelService.softDelete(id, { actorId: user.id });
    revalidatePath(ROUTES.DASHBOARD_MODELS);
    return { success: true };
  } catch {
    return { success: false, error: "فشل في حذف الموديل" };
  }
}
