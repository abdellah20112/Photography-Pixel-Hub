"use server";

import { revalidatePath } from "next/cache";
import { scheduleService } from "@/services/schedule.service";
import { getCurrentUser } from "@/lib/auth/session";
import { createShootSchema } from "@/lib/validations/schedule";

export async function createShootAction(
  _prev: { success: boolean; error?: string },
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  const parsed = createShootSchema.safeParse({
    projectId: formData.get("projectId"),
    title: formData.get("title"),
    description: formData.get("description"),
    location: formData.get("location"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };

  try {
    await scheduleService.create(parsed.data, { actorId: user.id, actorName: user.name });
    revalidatePath(`/dashboard/projects/${parsed.data.projectId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "فشل في إنشاء جلسة التصوير" };
  }
}
