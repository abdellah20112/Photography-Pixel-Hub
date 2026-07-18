"use server";

import { taskService } from "@/services/task.service";
import { getCurrentUser } from "@/lib/auth/session";

export async function addChecklistItemAction(
  taskId: string,
  title: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  try {
    await taskService.addChecklistItem(taskId, title, 0);
    return { success: true };
  } catch {
    return { success: false, error: "فشل في إضافة البند" };
  }
}

export async function updateChecklistItemAction(
  id: string,
  data: { title?: string; completed?: boolean }
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  try {
    await taskService.updateChecklistItem(id, data);
    return { success: true };
  } catch {
    return { success: false, error: "فشل في التحديث" };
  }
}

export async function deleteChecklistItemAction(id: string): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  try {
    await taskService.deleteChecklistItem(id);
    return { success: true };
  } catch {
    return { success: false, error: "فشل في الحذف" };
  }
}
