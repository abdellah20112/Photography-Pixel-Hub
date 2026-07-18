"use server";

import { scheduleService } from "@/services/schedule.service";
import { getCurrentUser } from "@/lib/auth/session";

export async function removeShootAssignmentAction(id: string): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  try {
    await scheduleService.removeAssignment(id);
    return { success: true };
  } catch {
    return { success: false, error: "فشل في الإزالة" };
  }
}
