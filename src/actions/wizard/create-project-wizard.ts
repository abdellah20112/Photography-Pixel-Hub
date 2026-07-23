"use server";

import { revalidatePath } from "next/cache";

import { clientService } from "@/services/client.service";
import { projectService } from "@/services/project.service";
import { modelService } from "@/services/model.service";
import { getCurrentUser } from "@/lib/auth/session";
import { getWhatsAppUrl } from "@/lib/utils/whatsapp";
import { buildWhatsAppMessage } from "@/lib/utils/wizard-message";
import { ROUTES } from "@/lib/constants";

/* ============================================
   Create Project Wizard — Combined Server Action
   Creates client + project + model assignment
   in a single atomic workflow.
   ============================================ */

export type WizardData = {
  /* Step 1 — Client */
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  clientCompany?: string;
  /* Step 2 — Project */
  projectName: string;
  shootingDate: string;
  price: number;
  internalNotes?: string;
  /* Step 3 — Model Assignment */
  modelId: string;
  videosCount: number;
  script?: string;
  modelNotes?: string;
};

export type WizardResult = {
  success: boolean;
  error?: string;
  clientId?: string;
  projectId?: string;
  whatsappUrl?: string;
};

export async function createProjectWizardAction(
  data: WizardData
): Promise<WizardResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  try {
    // Step 1 — Create client
    const client = await clientService.create(
      {
        userId: user.id,
        name: data.clientName,
        phone: data.clientPhone,
        email: data.clientEmail || undefined,
        company: data.clientCompany || undefined,
        status: "ACTIVE",
      },
      { actorId: user.id }
    );

    // Step 2 — Create project
    const shootingDate = new Date(data.shootingDate);
    const deadline = new Date(shootingDate);
    deadline.setDate(deadline.getDate() + 7); // Default deadline: 7 days after shoot

    const project = await projectService.create(
      {
        clientId: client.id,
        name: data.projectName,
        description: data.internalNotes || undefined,
        retentionPeriod: "SEVEN_DAYS",
        deadline,
        shootingDate,
        price: data.price,
        status: "IN_PROGRESS",
      },
      { actorId: user.id }
    );

    // Step 3 — Assign model
    await modelService.assignToProject(
      {
        projectId: project.id,
        modelId: data.modelId,
        videosCount: data.videosCount,
        script: data.script || undefined,
        notes: data.modelNotes || undefined,
      },
      { actorId: user.id, actorName: user.name }
    );

    // Build WhatsApp URL for the client
    const modelName = await modelService.getById(data.modelId);
    const message = buildWhatsAppMessage({
      clientName: data.clientName,
      projectName: data.projectName,
      shootingDate,
      videosCount: data.videosCount,
      price: data.price,
      script: data.script,
      modelName: modelName?.fullName,
    });

    const whatsappUrl = getWhatsAppUrl(data.clientPhone, message);

    revalidatePath(ROUTES.DASHBOARD_CLIENTS);
    revalidatePath(ROUTES.DASHBOARD_PROJECTS);

    return {
      success: true,
      clientId: client.id,
      projectId: project.id,
      whatsappUrl,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "فشل في إنشاء المشروع";
    return { success: false, error: message };
  }
}

/* ── Helper: Get model video count ─────────────── */

export async function getModelVideoCountAction(modelId: string): Promise<{
  currentVideos: number;
  currentProjects: number;
}> {
  const user = await getCurrentUser();
  if (!user) return { currentVideos: 0, currentProjects: 0 };

  const stats = await modelService.getStatistics(modelId);
  return {
    currentVideos: stats.totalVideos,
    currentProjects: stats.totalProjects,
  };
}
