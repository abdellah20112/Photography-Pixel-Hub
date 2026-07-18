"use server";

import { revalidatePath } from "next/cache";

import { modelService } from "@/services/model.service";
import { getCurrentUser } from "@/lib/auth/session";

/* ============================================
   Remove Model from Project Server Action
   ============================================ */

export async function removeAssignmentAction(id: string, projectId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  try {
    await modelService.removeFromProject(id, { actorId: user.id, actorName: user.name });
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
  } catch {
    return { success: false, error: "فشل في إزالة الموديل" };
  }
}
