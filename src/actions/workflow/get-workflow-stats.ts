"use server";

import { workflowService } from "@/services/workflow.service";
import { getCurrentUser } from "@/lib/auth/session";

/* ============================================
   Get Workflow Stats Server Action
   Returns dashboard widget statistics.
   ============================================ */

export async function getWorkflowStatsAction(): Promise<{
  editing: number;
  review: number;
  approved: number;
  delivered: number;
  completed: number;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { editing: 0, review: 0, approved: 0, delivered: 0, completed: 0 };
  }

  return workflowService.getStats();
}
