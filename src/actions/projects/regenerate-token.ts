"use server";

import { revalidatePath } from "next/cache";

import { projectRepository } from "@/repositories/project.repository";
import { timelineService } from "@/services/timeline.service";
import { getCurrentUser } from "@/lib/auth/session";
import { generateToken } from "@/lib/utils";

/* ============================================
   Regenerate Project Token (auth required)
   Generates a new secure token, invalidating
   the old portal URL.
   ============================================ */

export async function regenerateTokenAction(
  projectId: string,
): Promise<{
  success: boolean;
  token?: string;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const project = await projectRepository.findById(projectId);
  if (!project) {
    return { success: false, error: "المشروع غير موجود" };
  }

  const newToken = generateToken(32);

  await projectRepository.update(projectId, { token: newToken } as never);

  // Publish timeline event
  await timelineService.publish({
    projectId,
    eventType: "PROJECT_UPDATED",
    title: "تجديد رمز البوابة",
    description: "تم إنشاء رمز بوابة جديد للمشروع — الرابط القديم لم يعد صالحاً",
    actorId: user.id,
    actorName: user.name,
  });

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true, token: newToken };
}
