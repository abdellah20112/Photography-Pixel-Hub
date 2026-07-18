"use server";

import { deliveryService } from "@/services/delivery.service";
import { activityService } from "@/services/activity.service";
import { deliveryRepository } from "@/repositories/delivery.repository";
import type { PublicDeliveryData, DeliveryVideoItem } from "@/types/delivery";

/* ============================================
   Access Delivery Server Action (Public)
   Verifies password, returns signed URLs.
   No authentication required.
   ============================================ */

export async function accessDeliveryAction(slug: string, password?: string): Promise<{
  success: boolean;
  data?: PublicDeliveryData;
  error?: string;
  status?: "active" | "expired" | "disabled" | "password-required";
}> {
  const delivery = await deliveryRepository.findBySlug(slug);

  if (!delivery) {
    return { success: false, status: "disabled", error: "التسليم غير موجود" };
  }

  const accessStatus = deliveryService.checkAccess(delivery);

  if (accessStatus === "disabled") {
    return { success: false, status: "disabled", error: "هذا التسليم غير متاح" };
  }

  if (accessStatus === "expired") {
    return { success: false, status: "expired", error: "انتهت صلاحية هذا التسليم" };
  }

  // Password check
  if (delivery.passwordProtected) {
    if (!password) {
      return { success: false, status: "password-required", error: "كلمة المرور مطلوبة" };
    }

    const valid = await deliveryService.verifyPassword(slug, password);
    if (!valid) {
      return { success: false, status: "password-required", error: "كلمة المرور غير صحيحة" };
    }
  }

  // Track view
  await deliveryService.trackView(delivery.id);

  // Log view activity
  await activityService.log({
    userId: delivery.project.clientId,
    type: "DELIVERY_VIEWED",
    entity: "delivery",
    entityId: delivery.id,
    metadata: { deliveryCode: delivery.deliveryCode, slug },
  }).catch(() => {});

  // Generate signed URLs for each video
  const videos: DeliveryVideoItem[] = [];
  for (const dv of delivery.videos) {
    const video = dv.video;
    if (video.status !== "READY" || video.deletedAt) continue;

    let streamUrl = "";
    let downloadUrl = "";

    if (delivery.allowStreaming) {
      streamUrl = await deliveryService.getStreamUrl(video.storageKey);
    }

    if (delivery.downloadEnabled) {
      downloadUrl = await deliveryService.getDownloadUrl(video.storageKey);
    }

    videos.push({
      id: dv.id,
      order: dv.order,
      videoId: video.id,
      title: video.title,
      duration: video.duration,
      width: video.width,
      height: video.height,
      fileSize: Number(video.fileSize),
      thumbnailUrl: video.thumbnailUrl,
      streamUrl,
      downloadUrl,
    });
  }

  const data: PublicDeliveryData = {
    deliveryId: delivery.id,
    deliveryCode: delivery.deliveryCode,
    title: delivery.title,
    slug: delivery.slug,
    expiresAt: delivery.expiresAt,
    downloadEnabled: delivery.downloadEnabled,
    allowStreaming: delivery.allowStreaming,
    passwordProtected: delivery.passwordProtected,
    viewCount: delivery.viewCount + 1,
    downloadCount: delivery.downloadCount,
    videoCount: videos.length,
    project: {
      name: delivery.project.name,
      projectCode: delivery.project.projectCode,
    },
    videos,
  };

  return { success: true, data };
}
