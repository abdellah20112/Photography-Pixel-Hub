"use server";

import { revalidatePath } from "next/cache";

import { workflowService } from "@/services/workflow.service";
import { timelineService } from "@/services/timeline.service";
import { notificationService } from "@/services/notification.service";
import { projectRepository } from "@/repositories/project.repository";

/* ============================================
   Client Approve Project (Public — by token)
   Transitions project to APPROVED status.
   ============================================ */

export async function approveProjectAction(token: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const project = await projectRepository.findByToken(token);
  if (!project) return { success: false, error: "المشروع غير موجود" };

  try {
    // Transition to APPROVED
    await workflowService.transition(
      project.id,
      "APPROVED",
      { actorId: undefined, actorName: project.client?.name ?? "العميل" }
    );

    // Publish timeline event
    await timelineService.publish({
      projectId: project.id,
      eventType: "VIDEO_APPROVED",
      title: "اعتماد العميل",
      description: `اعتمد العميل المشروع "${project.name}"`,
      actorName: project.client?.name ?? "العميل",
    });

    // Notify management
    await notificationService.notifyManagement({
      type: "CLIENT_APPROVED",
      title: "تم اعتماد المشروع",
      message: `اعتمد العميل ${project.client?.name ?? ""} المشروع "${project.name}"`,
      entity: "project",
      entityId: project.id,
    });

    revalidatePath(`/p/${token}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "فشل في الاعتماد" };
  }
}
