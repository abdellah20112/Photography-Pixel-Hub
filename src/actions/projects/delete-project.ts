"use server";

import { revalidatePath } from "next/cache";

import { projectService } from "@/services/project.service";
import { getCurrentUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";

/* ============================================
   Archive Project Server Action
   Soft delete — sets status to ARCHIVED.
   ============================================ */

export async function archiveProjectAction(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  try {
    await projectService.archive(id, { actorId: user.id });
    revalidatePath(ROUTES.DASHBOARD_PROJECTS);
    return { success: true };
  } catch {
    return { success: false, error: "فشل في أرشفة المشروع" };
  }
}

/** Backward-compatible alias. */
export async function deleteProjectAction(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  return archiveProjectAction(id);
}
