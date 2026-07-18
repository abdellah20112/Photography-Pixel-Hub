"use server";

import { revalidatePath } from "next/cache";

import { projectService } from "@/services/project.service";
import { getCurrentUser } from "@/lib/auth/session";
import { updateProjectSchema } from "@/lib/validations/project";
import { ROUTES } from "@/lib/constants";

/* ============================================
   Update Project Server Action
   ============================================ */

export type UpdateProjectState = {
  success: boolean;
  error?: string;
};

export async function updateProjectAction(
  id: string,
  _prev: UpdateProjectState,
  formData: FormData
): Promise<UpdateProjectState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const parsed = updateProjectSchema.safeParse({
    clientId: formData.get("clientId"),
    name: formData.get("name"),
    description: formData.get("description"),
    retentionPeriod: formData.get("retentionPeriod"),
    deadline: formData.get("deadline"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة",
    };
  }

  try {
    await projectService.update(
      id,
      {
        clientId: parsed.data.clientId,
        name: parsed.data.name,
        description: parsed.data.description,
        retentionPeriod: parsed.data.retentionPeriod,
        deadline: parsed.data.deadline,
        status: parsed.data.status,
      },
      { actorId: user.id }
    );

    revalidatePath(ROUTES.DASHBOARD_PROJECTS);
    revalidatePath(`/dashboard/projects/${id}`);
    return { success: true };
  } catch {
    return { success: false, error: "فشل في تحديث المشروع" };
  }
}
