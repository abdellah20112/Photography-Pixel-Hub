"use server";

import { revalidatePath } from "next/cache";

import { projectFileService } from "@/services/project-file.service";
import { getCurrentUser } from "@/lib/auth/session";

/* ============================================
   Delete Project File Server Action
   Deletes file from R2 and removes DB record.
   ============================================ */

export async function deleteProjectFileAction(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  try {
    const file = await projectFileService.getById(id);
    if (!file) return { success: false, error: "الملف غير موجود" };

    await projectFileService.delete(id);
    revalidatePath(`/dashboard/projects/${file.projectId}`);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "فشل في حذف الملف",
    };
  }
}
