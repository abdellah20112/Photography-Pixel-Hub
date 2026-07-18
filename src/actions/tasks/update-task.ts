"use server";

import { revalidatePath } from "next/cache";
import { taskService } from "@/services/task.service";
import { getCurrentUser } from "@/lib/auth/session";
import { updateTaskSchema } from "@/lib/validations/task";

export async function updateTaskAction(
  id: string,
  _prev: { success: boolean; error?: string },
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  const parsed = updateTaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status") || undefined,
    priority: formData.get("priority") || undefined,
    assignedTo: formData.get("assignedTo") || undefined,
    estimatedHours: formData.get("estimatedHours") || undefined,
    actualHours: formData.get("actualHours") || undefined,
    startDate: formData.get("startDate") || undefined,
    dueDate: formData.get("dueDate"),
    progress: formData.get("progress") || undefined,
    order: formData.get("order") || undefined,
  });

  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };

  try {
    await taskService.update(id, parsed.data, { actorId: user.id, actorName: user.name });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "فشل في التحديث" };
  }
}
