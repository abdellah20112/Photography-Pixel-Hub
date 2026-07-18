"use server";

import { projectService } from "@/services/project.service";
import { getCurrentUser } from "@/lib/auth/session";

/* ============================================
   Export Projects Server Action
   Exports non-archived projects as CSV.
   ============================================ */

export async function exportProjectsAction(): Promise<{
  success: boolean;
  csv?: string;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  try {
    const csv = await projectService.exportCsv();
    return { success: true, csv };
  } catch {
    return { success: false, error: "فشل في تصدير المشاريع" };
  }
}
