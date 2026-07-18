"use server";

import { revalidatePath } from "next/cache";

import { modelService } from "@/services/model.service";
import { getCurrentUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";

/* ============================================
   Restore Model Server Action
   ============================================ */

export async function restoreModelAction(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  try {
    await modelService.restore(id, { actorId: user.id });
    revalidatePath(ROUTES.DASHBOARD_MODELS);
    return { success: true };
  } catch {
    return { success: false, error: "فشل في استعادة الموديل" };
  }
}
