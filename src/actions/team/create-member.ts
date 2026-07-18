"use server";

import { revalidatePath } from "next/cache";
import { teamService } from "@/services/team.service";
import { getCurrentUser } from "@/lib/auth/session";
import { createTeamMemberSchema } from "@/lib/validations/team";
import { ROUTES } from "@/lib/constants";

export async function createTeamMemberAction(
  _prev: { success: boolean; error?: string },
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  const parsed = createTeamMemberSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    photo: formData.get("photo"),
    role: formData.get("role"),
    status: formData.get("status"),
    joinDate: formData.get("joinDate"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };

  try {
    await teamService.create(parsed.data, { actorId: user.id });
    revalidatePath(ROUTES.DASHBOARD_TEAM);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "فشل في إنشاء الموظف" };
  }
}
