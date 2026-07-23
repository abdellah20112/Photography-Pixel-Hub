import { notificationService } from "@/services/notification.service";
import { timelineService } from "@/services/timeline.service";
import { prisma } from "@/lib/prisma";
import type { ProjectWorkflowStatus, NotificationType } from "@prisma/client";

/* ============================================
   Workflow Automation Hooks
   Fires notifications, timeline events, and
   auto-completion logic on workflow transitions.
   ============================================ */

export type WorkflowContext = {
  projectId: string;
  fromStatus: ProjectWorkflowStatus;
  toStatus: ProjectWorkflowStatus;
  actorId?: string;
  actorName?: string;
};

type WorkflowHook = (context: WorkflowContext) => Promise<void>;

const hooks: Record<string, WorkflowHook[]> = {};

export function registerHook(trigger: string, hook: WorkflowHook): void {
  if (!hooks[trigger]) hooks[trigger] = [];
  hooks[trigger]!.push(hook);
}

export async function executeHooks(trigger: string, context: WorkflowContext): Promise<void> {
  const triggerHooks = hooks[trigger] ?? [];
  for (const hook of triggerHooks) {
    try {
      await hook(context);
    } catch {
      // Hooks must never break the workflow
    }
  }
}

export const HOOK_TRIGGERS = {
  ON_PROJECT_APPROVED: "onProjectApproved",
  ON_DELIVERY_PUBLISHED: "onDeliveryPublished",
  ON_PAYMENT_RECEIVED: "onPaymentReceived",
  ON_PROJECT_COMPLETED: "onProjectCompleted",
  ON_WORKFLOW_TRANSITION: "onWorkflowTransition",
} as const;

/* ── Notification helpers ──────────────────── */

async function notifyManagement(
  type: NotificationType,
  title: string,
  message: string,
  entityId?: string
) {
  await notificationService.notifyManagement({
    type,
    title,
    message,
    entity: "project",
    entityId: entityId ?? null,
  });
}

async function getProjectInfo(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      projectCode: true,
      client: { select: { id: true, name: true } },
    },
  });
  return project;
}

/* ── Predefined triggers ───────────────────── */

export async function onProjectApproved(context: WorkflowContext): Promise<void> {
  const project = await getProjectInfo(context.projectId);
  if (!project) return;

  await notifyManagement(
    "CLIENT_APPROVED",
    "تم اعتماد المشروع",
    `تم اعتماد المشروع "${project.name}" من قبل العميل ${project.client.name}`,
    project.id
  );

  await executeHooks(HOOK_TRIGGERS.ON_PROJECT_APPROVED, context);
}

export async function onDeliveryPublished(context: WorkflowContext): Promise<void> {
  const project = await getProjectInfo(context.projectId);
  if (!project) return;

  await notifyManagement(
    "STATUS_CHANGED",
    "تم نشر التسليم",
    `تم نشر تسليم المشروع "${project.name}"`,
    project.id
  );

  await executeHooks(HOOK_TRIGGERS.ON_DELIVERY_PUBLISHED, context);
}

export async function onPaymentReceived(context: WorkflowContext): Promise<void> {
  await executeHooks(HOOK_TRIGGERS.ON_PAYMENT_RECEIVED, context);
}

export async function onProjectCompleted(context: WorkflowContext): Promise<void> {
  const project = await getProjectInfo(context.projectId);
  if (!project) return;

  await notifyManagement(
    "PROJECT_COMPLETED",
    "اكتمل المشروع",
    `اكتمل المشروع "${project.name}" بنجاح`,
    project.id
  );

  // Decrease model pending videos for completed project
  const assignments = await prisma.projectModel.findMany({
    where: { projectId: context.projectId },
    select: { id: true, modelId: true, videosCount: true },
  });

  for (const assignment of assignments) {
    await prisma.model.update({
      where: { id: assignment.modelId },
      data: { availability: "متاح" },
    });
  }

  // Publish completion timeline event
  await timelineService.publish({
    projectId: context.projectId,
    eventType: "PROJECT_COMPLETED",
    title: "اكتمل المشروع",
    description: `تم إكمال المشروع "${project.name}" تلقائياً بعد التحميل النهائي`,
    actorId: context.actorId,
    actorName: context.actorName ?? "النظام",
  });

  await executeHooks(HOOK_TRIGGERS.ON_PROJECT_COMPLETED, context);
}

export async function onWorkflowTransition(context: WorkflowContext): Promise<void> {
  const project = await getProjectInfo(context.projectId);
  if (!project) return;

  // Fire specific hooks based on target status
  if (context.toStatus === "APPROVED") {
    await onProjectApproved(context);
  } else if (context.toStatus === "DELIVERED") {
    await onDeliveryPublished(context);
  } else if (context.toStatus === "COMPLETED") {
    await onProjectCompleted(context);
  } else if (context.toStatus === "REVISION") {
    await notifyManagement(
      "CHANGES_REQUESTED",
      "طلب تعديلات",
      `طلب العميل ${project.client.name} تعديلات على المشروع "${project.name}"`,
      project.id
    );
  }

  await executeHooks(HOOK_TRIGGERS.ON_WORKFLOW_TRANSITION, context);
}
