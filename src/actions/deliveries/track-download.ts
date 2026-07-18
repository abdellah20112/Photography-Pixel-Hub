"use server";

import { deliveryService } from "@/services/delivery.service";
import { activityService } from "@/services/activity.service";
import { deliveryRepository } from "@/repositories/delivery.repository";

/* ============================================
   Track Download Server Action (Public)
   Increments download count, returns signed URL.
   No authentication required.
   ============================================ */

export async function trackDownloadAction(
  deliveryId: string,
  videoId: string,
  storageKey: string
): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  const delivery = await deliveryRepository.findById(deliveryId);

  if (!delivery || !delivery.downloadEnabled) {
    return { success: false, error: "التحميل غير متاح" };
  }

  const accessStatus = deliveryService.checkAccess(delivery);

  if (accessStatus !== "active") {
    return { success: false, error: "التسليم غير متاح" };
  }

  try {
    const url = await deliveryService.trackDownload(deliveryId, storageKey);

    // Log download activity
    await activityService.log({
      userId: delivery.project.clientId,
      type: "DOWNLOAD_STARTED",
      entity: "delivery",
      entityId: deliveryId,
      metadata: { deliveryCode: delivery.deliveryCode, videoId },
    }).catch(() => {});

    return { success: true, url };
  } catch {
    return { success: false, error: "فشل في توليد رابط التحميل" };
  }
}
