"use server";

import { revalidatePath } from "next/cache";

import { workflowService } from "@/services/workflow.service";
import { getCurrentUser } from "@/lib/auth/session";
import type { ProjectWorkflowStatus } from "@prisma/client";

/* ============================================
   Transition Workflow Server Action
   Validates and executes a workflow transition.
   ============================================ */

export async function transitionWorkflowAction(params: {
  projectId: string;
  toStatus: ProjectWorkflowStatus;
}): Promise<{
  success: boolean;
  error?: string;
  fromStatus?: ProjectWorkflowStatus;
  toStatus?: ProjectWorkflowStatus;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  try {
    const result = await workflowService.transition(
      params.projectId,
      params.toStatus,
      { actorId: user.id, actorName: user.name }
    );

    revalidatePath(`/dashboard/projects/${params.projectId}`);
    return result;
  } catch {
    return { success: false, error: "فشل في تغيير حالة المشروع" };
  }
}
