"use server";

import { deliveryService } from "@/services/delivery.service";
import { getCurrentUser } from "@/lib/auth/session";

/* ============================================
   Get Delivery Details Server Action
   Returns delivery with statistics and timeline.
   ============================================ */

export async function getDeliveryDetailsAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const delivery = await deliveryService.getById(id);
  if (!delivery) return null;

  const statistics = await deliveryService.getStatistics(id);
  const timeline = await deliveryService.getTimeline(id, 20);

  return {
    delivery,
    statistics,
    timeline,
  };
}
