import { Badge } from "@/components/ui/badge";
import { WORKFLOW_STATUS_LABELS } from "@/lib/workflow/transitions";
import type { ProjectWorkflowStatus } from "@prisma/client";

/* ============================================
   WorkflowBadge — Colored badge per workflow status
   ============================================ */

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-slate-500 hover:bg-slate-500",
  PLANNING: "bg-blue-500 hover:bg-blue-500",
  SHOOTING: "bg-cyan-500 hover:bg-cyan-500",
  EDITING: "bg-amber-500 hover:bg-amber-500",
  REVIEW: "bg-purple-500 hover:bg-purple-500",
  REVISION: "bg-orange-500 hover:bg-orange-500",
  APPROVED: "bg-green-600 hover:bg-green-600",
  DELIVERED: "bg-indigo-500 hover:bg-indigo-500",
  PAID: "bg-teal-500 hover:bg-teal-500",
  COMPLETED: "bg-green-700 hover:bg-green-700",
  ARCHIVED: "",
};

export function WorkflowBadge({ status }: { status: ProjectWorkflowStatus }) {
  const label = WORKFLOW_STATUS_LABELS[status] ?? status;
  const className = STATUS_COLORS[status];

  if (status === "ARCHIVED") {
    return <Badge variant="secondary">{label}</Badge>;
  }

  return (
    <Badge variant="default" className={className}>
      {label}
    </Badge>
  );
}
