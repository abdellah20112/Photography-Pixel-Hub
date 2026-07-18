"use server";

import { revalidatePath } from "next/cache";

import { deliveryService } from "@/services/delivery.service";
import { getCurrentUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";

/* ============================================
   Restore Delivery Server Action
   ============================================ */

export async function restoreDeliveryAction(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  try {
    await deliveryService.restore(id, { actorId: user.id });
    revalidatePath(ROUTES.DASHBOARD_DELIVERIES);
    return { success: true };
  } catch {
    return { success: false, error: "فشل في استعادة التسليم" };
  }
}
