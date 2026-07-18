"use server";

import { revalidatePath } from "next/cache";

import { deliveryService } from "@/services/delivery.service";
import { getCurrentUser } from "@/lib/auth/session";
import { createDeliverySchema } from "@/lib/validations/delivery";
import { ROUTES } from "@/lib/constants";

/* ============================================
   Create Delivery Server Action
   ============================================ */

export type CreateDeliveryState = {
  success: boolean;
  error?: string;
};

export async function createDeliveryAction(
  _prev: CreateDeliveryState,
  formData: FormData
): Promise<CreateDeliveryState> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const videoIds = formData.getAll("videoIds") as string[];

  const parsed = createDeliverySchema.safeParse({
    projectId: formData.get("projectId"),
    title: formData.get("title"),
    expiresAt: formData.get("expiresAt"),
    downloadEnabled: formData.get("downloadEnabled") === "true",
    allowStreaming: formData.get("allowStreaming") === "true",
    allowComments: formData.get("allowComments") === "true",
    passwordProtected: formData.get("passwordProtected") === "true",
    password: formData.get("password") || undefined,
    videoIds,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة",
    };
  }

  try {
    await deliveryService.create(
      {
        projectId: parsed.data.projectId,
        title: parsed.data.title,
        expiresAt: parsed.data.expiresAt,
        downloadEnabled: parsed.data.downloadEnabled,
        allowStreaming: parsed.data.allowStreaming,
        allowComments: parsed.data.allowComments,
        passwordProtected: parsed.data.passwordProtected,
        password: parsed.data.password,
        videoIds: parsed.data.videoIds,
      },
      { actorId: user.id }
    );

    revalidatePath(ROUTES.DASHBOARD_DELIVERIES);
    return { success: true };
  } catch {
    return { success: false, error: "فشل في إنشاء التسليم" };
  }
}
