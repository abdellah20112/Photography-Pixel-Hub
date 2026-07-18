"use server";

import { revalidatePath } from "next/cache";
import { teamService } from "@/services/team.service";
import { getCurrentUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";

export async function deleteTeamMemberAction(id: string): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  try {
    await teamService.softDelete(id, { actorId: user.id });
    revalidatePath(ROUTES.DASHBOARD_TEAM);
    return { success: true };
  } catch {
    return { success: false, error: "فشل في حذف الموظف" };
  }
}
