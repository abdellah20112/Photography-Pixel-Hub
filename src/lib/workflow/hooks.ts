import type { ProjectWorkflowStatus } from "@prisma/client";

/* ============================================
   Workflow Automation Hooks
   Extension points for future automation.
   Currently no-op — architecture only.
   ============================================ */

export type WorkflowContext = {
  projectId: string;
  fromStatus: ProjectWorkflowStatus;
  toStatus: ProjectWorkflowStatus;
  actorId?: string;
};

/** Hook type definition. */
type WorkflowHook = (context: WorkflowContext) => Promise<void>;

/** Registered hooks by trigger point. */
const hooks: Record<string, WorkflowHook[]> = {};

/** Register a hook for a specific trigger. */
export function registerHook(trigger: string, hook: WorkflowHook): void {
  if (!hooks[trigger]) hooks[trigger] = [];
  hooks[trigger]!.push(hook);
}

/** Execute all hooks for a trigger. Errors are caught and logged. */
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

/* ── Predefined trigger names ────────────── */

export const HOOK_TRIGGERS = {
  ON_PROJECT_APPROVED: "onProjectApproved",
  ON_DELIVERY_PUBLISHED: "onDeliveryPublished",
  ON_PAYMENT_RECEIVED: "onPaymentReceived",
  ON_PROJECT_COMPLETED: "onProjectCompleted",
  ON_WORKFLOW_TRANSITION: "onWorkflowTransition",
} as const;

/* ── Extension point declarations ─────────── */

/** Called when a project transitions to APPROVED. */
export async function onProjectApproved(context: WorkflowContext): Promise<void> {
  await executeHooks(HOOK_TRIGGERS.ON_PROJECT_APPROVED, context);
}

/** Called when a delivery is published. */
export async function onDeliveryPublished(context: WorkflowContext): Promise<void> {
  await executeHooks(HOOK_TRIGGERS.ON_DELIVERY_PUBLISHED, context);
}

/** Called when payment is received (PAID status). */
export async function onPaymentReceived(context: WorkflowContext): Promise<void> {
  await executeHooks(HOOK_TRIGGERS.ON_PAYMENT_RECEIVED, context);
}

/** Called when a project is completed. */
export async function onProjectCompleted(context: WorkflowContext): Promise<void> {
  await executeHooks(HOOK_TRIGGERS.ON_PROJECT_COMPLETED, context);
}

/** Called on every workflow transition. */
export async function onWorkflowTransition(context: WorkflowContext): Promise<void> {
  await executeHooks(HOOK_TRIGGERS.ON_WORKFLOW_TRANSITION, context);
}
