import type { ProjectWorkflowStatus } from "@prisma/client";

/* ============================================
   Workflow Transition Rules
   Defines the allowed state transitions for
   the project workflow engine.
   ============================================ */

/** Allowed transitions: from → to[] */
export const WORKFLOW_TRANSITIONS: Record<ProjectWorkflowStatus, ProjectWorkflowStatus[]> = {
  NEW: ["PLANNING"],
  PLANNING: ["SHOOTING"],
  SHOOTING: ["EDITING"],
  EDITING: ["REVIEW"],
  REVIEW: ["REVISION", "APPROVED"],
  REVISION: ["REVIEW"],
  APPROVED: ["DELIVERED"],
  DELIVERED: ["PAID"],
  PAID: ["COMPLETED"],
  COMPLETED: ["ARCHIVED"],
  ARCHIVED: [],
};

/** Check if a transition is allowed. */
export function isTransitionAllowed(
  from: ProjectWorkflowStatus,
  to: ProjectWorkflowStatus
): boolean {
  const allowed = WORKFLOW_TRANSITIONS[from] ?? [];
  return allowed.includes(to);
}

/** Get all allowed next statuses from the current one. */
export function getAllowedTransitions(
  current: ProjectWorkflowStatus
): ProjectWorkflowStatus[] {
  return WORKFLOW_TRANSITIONS[current] ?? [];
}

/** Arabic labels for workflow statuses. */
export const WORKFLOW_STATUS_LABELS: Record<ProjectWorkflowStatus, string> = {
  NEW: "جديد",
  PLANNING: "تخطيط",
  SHOOTING: "تصوير",
  EDITING: "مونتاج",
  REVIEW: "مراجعة",
  REVISION: "تعديلات",
  APPROVED: "معتمد",
  DELIVERED: "تم التسليم",
  PAID: "مدفوع",
  COMPLETED: "مكتمل",
  ARCHIVED: "مؤرشف",
};

/** Ordered workflow steps for visual progress. */
export const WORKFLOW_ORDER: ProjectWorkflowStatus[] = [
  "NEW",
  "PLANNING",
  "SHOOTING",
  "EDITING",
  "REVIEW",
  "APPROVED",
  "DELIVERED",
  "PAID",
  "COMPLETED",
];
