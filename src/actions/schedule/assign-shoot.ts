"use server";

import { scheduleService } from "@/services/schedule.service";
import { conflictDetectionService } from "@/services/schedule.service";
import { getCurrentUser } from "@/lib/auth/session";
import { assignToShootSchema } from "@/lib/validations/schedule";

export async function assignToShootAction(
  _prev: { success: boolean; error?: string },
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  const parsed = assignToShootSchema.safeParse({
    shootId: formData.get("shootId"),
    teamMemberId: formData.get("teamMemberId") || undefined,
    modelId: formData.get("modelId") || undefined,
    role: formData.get("role"),
  });

  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };

  try {
    await scheduleService.assign(parsed.data, { actorId: user.id, actorName: user.name });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "فشل في التعيين" };
  }
}

export async function checkConflictsAction(params: {
  startTime: string;
  endTime: string;
  teamMemberIds?: string[];
  modelIds?: string[];
}): Promise<{ hasConflict: boolean; conflicts: Array<{ type: string; id: string; name: string; reason: string }> }> {
  const user = await getCurrentUser();
  if (!user) return { hasConflict: false, conflicts: [] };

  return conflictDetectionService.checkConflicts({
    startTime: new Date(params.startTime),
    endTime: new Date(params.endTime),
    teamMemberIds: params.teamMemberIds,
    modelIds: params.modelIds,
  });
}
