"use server";

import { revalidatePath } from "next/cache";

import { deliveryService } from "@/services/delivery.service";
import { getCurrentUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";

/* ============================================
   Delete Delivery Server Action
   Soft delete — sets status to DISABLED.
   ============================================ */

export async function deleteDeliveryAction(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  try {
    await deliveryService.softDelete(id, { actorId: user.id });
    revalidatePath(ROUTES.DASHBOARD_DELIVERIES);
    return { success: true };
  } catch {
    return { success: false, error: "فشل في حذف التسليم" };
  }
}
