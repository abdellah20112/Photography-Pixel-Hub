"use server";

import { taskService } from "@/services/task.service";
import { getCurrentUser } from "@/lib/auth/session";
import { taskCommentSchema } from "@/lib/validations/task";

export async function addTaskCommentAction(
  _prev: { success: boolean; error?: string },
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  const parsed = taskCommentSchema.safeParse({
    taskId: formData.get("taskId"),
    content: formData.get("content"),
  });

  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };

  // Get user's teamMemberId — for now use user.id as authorId
  try {
    await taskService.addComment(parsed.data.taskId, user.id, parsed.data.content, {
      actorId: user.id, actorName: user.name,
    });
    return { success: true };
  } catch {
    return { success: false, error: "فشل في إضافة التعليق" };
  }
}
