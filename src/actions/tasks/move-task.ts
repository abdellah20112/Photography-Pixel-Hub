"use server";

import { taskService } from "@/services/task.service";
import { getCurrentUser } from "@/lib/auth/session";
import { moveTaskSchema } from "@/lib/validations/task";
import type { TaskStatus } from "@prisma/client";

export async function moveTaskAction(
  _prev: { success: boolean; error?: string },
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  const parsed = moveTaskSchema.safeParse({
    taskId: formData.get("taskId"),
    status: formData.get("status"),
    order: formData.get("order") || 0,
  });

  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };

  try {
    await taskService.move(parsed.data.taskId, parsed.data.status as TaskStatus, parsed.data.order, {
      actorId: user.id, actorName: user.name,
    });
    return { success: true };
  } catch {
    return { success: false, error: "فشل في نقل المهمة" };
  }
}

export async function assignTaskAction(
  id: string,
  assignedTo: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  try {
    const task = await taskService.getById(id);
    if (!task) return { success: false, error: "المهمة غير موجودة" };

    await taskService.update(id, {
      title: task.title,
      description: task.description ?? undefined,
      dueDate: task.dueDate,
      assignedTo: assignedTo || undefined,
    }, { actorId: user.id, actorName: user.name });

    return { success: true };
  } catch {
    return { success: false, error: "فشل في التعيين" };
  }
}
