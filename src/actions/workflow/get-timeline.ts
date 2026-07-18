"use server";

import { workflowService } from "@/services/workflow.service";
import { getCurrentUser } from "@/lib/auth/session";

/* ============================================
   Get Project Timeline Server Action
   Returns chronological timeline events.
   ============================================ */

export async function getProjectTimelineAction(projectId: string, take = 50) {
  const user = await getCurrentUser();
  if (!user) return [];

  return workflowService.getHistory(projectId, take);
}
