"use server";

import { revalidatePath } from "next/cache";
import { taskService } from "@/services/task.service";
import { getCurrentUser } from "@/lib/auth/session";
import { createTaskSchema } from "@/lib/validations/task";

export async function createTaskAction(
  _prev: { success: boolean; error?: string },
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  const parsed = createTaskSchema.safeParse({
    projectId: formData.get("projectId"),
    shootId: formData.get("shootId") || undefined,
    parentTaskId: formData.get("parentTaskId") || undefined,
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    assignedTo: formData.get("assignedTo") || undefined,
    estimatedHours: formData.get("estimatedHours") || 0,
    startDate: formData.get("startDate") || undefined,
    dueDate: formData.get("dueDate"),
  });

  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };

  try {
    await taskService.create(parsed.data, { actorId: user.id, actorName: user.name });
    revalidatePath(`/dashboard/projects/${parsed.data.projectId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "فشل في إنشاء المهمة" };
  }
}
