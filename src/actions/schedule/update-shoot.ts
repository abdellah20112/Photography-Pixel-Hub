"use server";

import { revalidatePath } from "next/cache";
import { scheduleService } from "@/services/schedule.service";
import { getCurrentUser } from "@/lib/auth/session";
import { updateShootSchema } from "@/lib/validations/schedule";

export async function updateShootAction(
  id: string,
  _prev: { success: boolean; error?: string },
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  const parsed = updateShootSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    location: formData.get("location"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    status: formData.get("status") || undefined,
    notes: formData.get("notes"),
  });

  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };

  try {
    await scheduleService.update(id, parsed.data, { actorId: user.id, actorName: user.name });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "فشل في التحديث" };
  }
}
