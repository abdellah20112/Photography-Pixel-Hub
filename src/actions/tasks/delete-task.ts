"use server";

import { taskService } from "@/services/task.service";
import { getCurrentUser } from "@/lib/auth/session";

export async function deleteTaskAction(id: string): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  try {
    await taskService.softDelete(id, { actorId: user.id, actorName: user.name });
    return { success: true };
  } catch {
    return { success: false, error: "فشل في الحذف" };
  }
}
