"use server";

import { revalidatePath } from "next/cache";
import { teamService } from "@/services/team.service";
import { getCurrentUser } from "@/lib/auth/session";
import { assignMemberSchema } from "@/lib/validations/team";

export async function assignMemberAction(
  _prev: { success: boolean; error?: string },
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  const parsed = assignMemberSchema.safeParse({
    projectId: formData.get("projectId"),
    teamMemberId: formData.get("teamMemberId"),
    role: formData.get("role"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };

  try {
    await teamService.assignToProject(parsed.data, { actorId: user.id, actorName: user.name });
    revalidatePath(`/dashboard/projects/${parsed.data.projectId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "فشل في التعيين" };
  }
}
