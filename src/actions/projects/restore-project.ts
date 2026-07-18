"use server";

import { revalidatePath } from "next/cache";

import { projectService } from "@/services/project.service";
import { getCurrentUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";

/* ============================================
   Restore Project Server Action
   Restores an archived project.
   ============================================ */

export async function restoreProjectAction(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  try {
    await projectService.restore(id, { actorId: user.id });
    revalidatePath(ROUTES.DASHBOARD_PROJECTS);
    return { success: true };
  } catch {
    return { success: false, error: "فشل في استعادة المشروع" };
  }
}
