"use server";

import { revalidatePath } from "next/cache";

import { workflowService } from "@/services/workflow.service";
import { timelineService } from "@/services/timeline.service";
import { notificationService } from "@/services/notification.service";
import { projectRepository } from "@/repositories/project.repository";

/* ============================================
   Client Request Changes (Public — by token)
   Transitions project to REVISION status.
   ============================================ */

export async function requestChangesAction(
  token: string,
  message: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  const project = await projectRepository.findByToken(token);
  if (!project) return { success: false, error: "المشروع غير موجود" };

  try {
    // Transition to REVISION
    await workflowService.transition(
      project.id,
      "REVISION",
      { actorId: undefined, actorName: project.client?.name ?? "العميل" }
    );

    // Publish timeline event
    await timelineService.publish({
      projectId: project.id,
      eventType: "COMMENT_ADDED",
      title: "طلب تعديلات",
      description: `طلب العميل تعديلات على المشروع "${project.name}": ${message.slice(0, 200)}`,
      metadata: { message },
      actorName: project.client?.name ?? "العميل",
    });

    // Notify management and editors
    await notificationService.notifyManagement({
      type: "CHANGES_REQUESTED",
      title: "طلب تعديلات",
      message: `طلب العميل ${project.client?.name ?? ""} تعديلات على المشروع "${project.name}"`,
      entity: "project",
      entityId: project.id,
    });

    revalidatePath(`/p/${token}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "فشل في طلب التعديلات" };
  }
}
