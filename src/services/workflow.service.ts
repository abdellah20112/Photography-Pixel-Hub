import { prisma } from "@/lib/prisma";
import { projectRepository } from "@/repositories/project.repository";
import { timelineService } from "@/services/timeline.service";
import {
  isTransitionAllowed,
  getAllowedTransitions,
  WORKFLOW_STATUS_LABELS,
} from "@/lib/workflow/transitions";
import {
  onProjectApproved,
  onDeliveryPublished,
  onPaymentReceived,
  onProjectCompleted,
  onWorkflowTransition,
} from "@/lib/workflow/hooks";
import type { ProjectWorkflowStatus } from "@prisma/client";

/* ============================================
   Workflow Service
   Validates transitions, changes status,
   publishes timeline events, and triggers
   automation hooks.
   ============================================ */

export const workflowService = {
  /** Get the current workflow status of a project. */
  async getStatus(projectId: string): Promise<ProjectWorkflowStatus | null> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { workflowStatus: true },
    });
    return project?.workflowStatus ?? null;
  },

  /** Get all allowed transitions from the current status. */
  getAllowedTransitions(current: ProjectWorkflowStatus): ProjectWorkflowStatus[] {
    return getAllowedTransitions(current);
  },

  /** Validate a transition without executing it. */
  validateTransition(
    from: ProjectWorkflowStatus,
    to: ProjectWorkflowStatus
  ): { valid: boolean; error?: string } {
    if (from === to) {
      return { valid: false, error: "الحالة الحالية مطابقة للحالة المطلوبة" };
    }

    if (!isTransitionAllowed(from, to)) {
      return {
        valid: false,
        error: `لا يمكن الانتقال من ${WORKFLOW_STATUS_LABELS[from]} إلى ${WORKFLOW_STATUS_LABELS[to]}`,
      };
    }

    return { valid: true };
  },

  /**
   * Transition a project to a new workflow status.
   * Validates, updates, publishes timeline event,
   * and triggers automation hooks.
   */
  async transition(
    projectId: string,
    toStatus: ProjectWorkflowStatus,
    options?: { actorId?: string; actorName?: string }
  ): Promise<{
    success: boolean;
    error?: string;
    fromStatus?: ProjectWorkflowStatus;
    toStatus?: ProjectWorkflowStatus;
  }> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { workflowStatus: true, name: true },
    });

    if (!project) {
      return { success: false, error: "المشروع غير موجود" };
    }

    const fromStatus = project.workflowStatus;

    // Validate transition
    const validation = this.validateTransition(fromStatus, toStatus);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Update project status
    await projectRepository.update(projectId, {
      workflowStatus: toStatus,
    } as never);

    // Publish timeline event
    await timelineService.publish({
      projectId,
      eventType: "WORKFLOW_TRANSITION",
      title: `تغيير حالة المشروع`,
      description: `من ${WORKFLOW_STATUS_LABELS[fromStatus]} إلى ${WORKFLOW_STATUS_LABELS[toStatus]}`,
      metadata: { fromStatus, toStatus },
      actorId: options?.actorId,
      actorName: options?.actorName ?? "النظام",
    });

    // Trigger hooks
    const context = { projectId, fromStatus, toStatus, actorId: options?.actorId };

    await onWorkflowTransition(context);

    if (toStatus === "APPROVED") {
      await onProjectApproved(context);
    }

    if (toStatus === "DELIVERED") {
      await onDeliveryPublished(context);
    }

    if (toStatus === "PAID") {
      await onPaymentReceived(context);
    }

    if (toStatus === "COMPLETED") {
      await onProjectCompleted(context);

      // Also publish completion event
      await timelineService.publish({
        projectId,
        eventType: "PROJECT_COMPLETED",
        title: "اكتمل المشروع",
        description: `اكتمل مشروع ${project.name}`,
        actorId: options?.actorId,
        actorName: options?.actorName ?? "النظام",
      });
    }

    return { success: true, fromStatus, toStatus };
  },

  /** Get workflow history for a project (timeline events). */
  async getHistory(projectId: string, take = 50) {
    return timelineService.getByProject(projectId, take);
  },

  /** Get dashboard workflow statistics. */
  async getStats() {
    return timelineService.getWorkflowStats();
  },
};
