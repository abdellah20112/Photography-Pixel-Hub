"use server";

import { revalidatePath } from "next/cache";
import { teamService } from "@/services/team.service";
import { getCurrentUser } from "@/lib/auth/session";

export async function removeAssignmentAction(id: string, projectId: string): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  try {
    await teamService.removeFromProject(id, { actorId: user.id, actorName: user.name });
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
  } catch {
    return { success: false, error: "فشل في إزالة الموظف" };
  }
}
