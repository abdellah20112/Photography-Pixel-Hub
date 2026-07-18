import { prisma } from "@/lib/prisma";
import { deliveryRepository } from "@/repositories/delivery.repository";
import { activityService } from "@/services/activity.service";
import { storageService } from "@/lib/storage/storage.service";
import { generateToken } from "@/lib/utils";
import bcrypt from "bcryptjs";
import type { DeliveryStatus } from "@prisma/client";

/* ============================================
   Delivery Service
   Business logic layer — calls repositories only.
   ============================================ */

/** Format a sequential delivery code: DL-000001, DL-000002, etc. */
function formatDeliveryCode(sequence: number): string {
  return `DL-${String(sequence).padStart(6, "0")}`;
}

/** Generate the next unique delivery code using a transaction. */
async function generateUniqueDeliveryCode(): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const latest = await tx.delivery.findFirst({
      orderBy: { deliveryCode: "desc" },
      select: { deliveryCode: true },
    });

    let sequence = 1;
    if (latest?.deliveryCode) {
      const match = latest.deliveryCode.match(/^DL-(\d+)$/);
      if (match) {
        sequence = parseInt(match[1]!, 10) + 1;
      }
    }

    return formatDeliveryCode(sequence);
  });
}

/** Generate a URL-safe slug from a title. */
function generateSlug(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50);
  const suffix = generateToken(8);
  return `${base}-${suffix}`;
}

/** Hash a password using bcrypt. */
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/** Verify a password against a hash. */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Check if delivery has expired. */
function isExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  return new Date() > expiresAt;
}

export const deliveryService = {
  async getById(id: string) {
    return deliveryRepository.findById(id);
  },

  async getBySlug(slug: string) {
    return deliveryRepository.findBySlug(slug);
  },

  async getByDeliveryCode(deliveryCode: string) {
    return deliveryRepository.findByDeliveryCode(deliveryCode);
  },

  async create(
    data: {
      projectId: string;
      title: string;
      expiresAt: Date;
      downloadEnabled: boolean;
      allowStreaming: boolean;
      allowComments: boolean;
      passwordProtected: boolean;
      password?: string;
      videoIds: string[];
    },
    options?: { actorId?: string }
  ) {
    const deliveryCode = await generateUniqueDeliveryCode();
    const slug = generateSlug(data.title);

    let passwordHash: string | null = null;
    if (data.passwordProtected && data.password) {
      passwordHash = await hashPassword(data.password);
    }

    const delivery = await deliveryRepository.create({
      deliveryCode,
      projectId: data.projectId,
      title: data.title.trim(),
      slug,
      status: "ACTIVE" as DeliveryStatus,
      expiresAt: data.expiresAt,
      downloadEnabled: data.downloadEnabled,
      allowStreaming: data.allowStreaming,
      allowComments: data.allowComments,
      passwordProtected: data.passwordProtected,
      passwordHash,
      viewCount: 0,
      downloadCount: 0,
    });

    // Set videos
    if (data.videoIds.length > 0) {
      await deliveryRepository.setVideos(delivery.id, data.videoIds);
    }

    // Activity log: Delivery Created
    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "DELIVERY_CREATED",
        entity: "delivery",
        entityId: delivery.id,
        metadata: {
          deliveryCode: delivery.deliveryCode,
          title: delivery.title,
          projectId: delivery.projectId,
        },
      });
    }

    return delivery;
  },

  async update(
    id: string,
    data: {
      title: string;
      expiresAt: Date;
      downloadEnabled: boolean;
      allowStreaming: boolean;
      allowComments: boolean;
      passwordProtected: boolean;
      password?: string;
      videoIds: string[];
      status?: DeliveryStatus;
    },
    options?: { actorId?: string }
  ) {
    const updateData: Record<string, unknown> = {
      title: data.title.trim(),
      expiresAt: data.expiresAt,
      downloadEnabled: data.downloadEnabled,
      allowStreaming: data.allowStreaming,
      allowComments: data.allowComments,
      passwordProtected: data.passwordProtected,
    };

    if (data.status) {
      updateData.status = data.status;
    }

    // Handle password change
    if (data.passwordProtected && data.password) {
      updateData.passwordHash = await hashPassword(data.password);
    } else if (!data.passwordProtected) {
      updateData.passwordHash = null;
    }

    const delivery = await deliveryRepository.update(id, updateData as never);

    // Update videos
    await deliveryRepository.setVideos(id, data.videoIds);

    // Activity log: Delivery Updated
    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "DELIVERY_UPDATED",
        entity: "delivery",
        entityId: id,
        metadata: {
          deliveryCode: delivery.deliveryCode,
          title: delivery.title,
        },
      });
    }

    return delivery;
  },

  /** Soft delete — disable delivery. */
  async softDelete(id: string, options?: { actorId?: string }) {
    const delivery = await deliveryRepository.softDelete(id);

    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "DELIVERY_DISABLED",
        entity: "delivery",
        entityId: id,
        metadata: {
          deliveryCode: delivery.deliveryCode,
          title: delivery.title,
        },
      });
    }

    return delivery;
  },

  /** Restore a disabled delivery. */
  async restore(id: string, options?: { actorId?: string }) {
    const delivery = await deliveryRepository.restore(id);

    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "DELIVERY_PUBLISHED",
        entity: "delivery",
        entityId: id,
        metadata: {
          deliveryCode: delivery.deliveryCode,
          title: delivery.title,
        },
      });
    }

    return delivery;
  },

  /** Soft delete alias. */
  async delete(id: string, options?: { actorId?: string }) {
    return this.softDelete(id, options);
  },

  async list(params: {
    projectId?: string;
    skip?: number;
    take?: number;
    search?: string;
    filter?: string;
    sort?: string;
  }) {
    return deliveryRepository.findMany(params);
  },

  async count(params: { projectId?: string; filter?: string }) {
    if (params.filter && params.filter !== "all") {
      const statusMap: Record<string, string> = {
        active: "ACTIVE",
        expired: "EXPIRED",
        disabled: "DISABLED",
      };
      const status = statusMap[params.filter];
      if (status) {
        return deliveryRepository.count({
          projectId: params.projectId,
          status: status as DeliveryStatus,
        });
      }
    }
    return deliveryRepository.count({
      projectId: params.projectId,
    });
  },

  async getStatistics(deliveryId: string) {
    return deliveryRepository.getStatistics(deliveryId);
  },

  async getTimeline(deliveryId: string, take = 20) {
    return activityService.list({
      entity: "delivery",
      entityId: deliveryId,
      take,
    });
  },

  /** Check delivery access status for public portal. */
  checkAccess(delivery: {
    status: string;
    expiresAt: Date | null;
  }): "active" | "expired" | "disabled" {
    if (delivery.status === "DISABLED") return "disabled";
    if (isExpired(delivery.expiresAt)) return "expired";
    return "active";
  },

  /** Verify password for a delivery. */
  async verifyPassword(slug: string, password: string): Promise<boolean> {
    const delivery = await deliveryRepository.findBySlug(slug);
    if (!delivery || !delivery.passwordProtected || !delivery.passwordHash) {
      return false;
    }
    return verifyPassword(password, delivery.passwordHash);
  },

  /** Increment view count (public). */
  async trackView(id: string) {
    return deliveryRepository.incrementViewCount(id);
  },

  /** Increment download count and get signed URL (public). */
  async trackDownload(id: string, storageKey: string): Promise<string> {
    await deliveryRepository.incrementDownloadCount(id);
    return storageService.getDownloadUrl(storageKey);
  },

  /** Get signed streaming URL for a video (public). */
  async getStreamUrl(storageKey: string): Promise<string> {
    return storageService.getStreamingUrl(storageKey);
  },

  /** Get signed download URL (public). */
  async getDownloadUrl(storageKey: string): Promise<string> {
    return storageService.getDownloadUrl(storageKey);
  },
};
