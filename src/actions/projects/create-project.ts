"use server";

import { revalidatePath } from "next/cache";

import { projectService } from "@/services/project.service";
import { getCurrentUser } from "@/lib/auth/session";
import { createProjectSchema } from "@/lib/validations/project";
import { ROUTES } from "@/lib/constants";

/* ============================================
   Create Project Server Action
   ============================================ */

export type CreateProjectState = {
  success: boolean;
  error?: string;
};

export async function createProjectAction(
  _prev: CreateProjectState,
  formData: FormData
): Promise<CreateProjectState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const parsed = createProjectSchema.safeParse({
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
    await projectService.create(
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
    return { success: true };
  } catch {
    return { success: false, error: "فشل في إنشاء المشروع" };
  }
}
