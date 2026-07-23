import { prisma } from "@/lib/prisma";
import { notificationRepository } from "@/repositories/notification.repository";
import type { NotificationType, UserRole } from "@prisma/client";

/* ============================================
   Notification Service
   Business logic layer for notifications.
   ============================================ */

export const notificationService = {
  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    entity?: string | null;
    entityId?: string | null;
  }) {
    return notificationRepository.create(data);
  },

  /** Notify all users with a specific role. */
  async notifyRole(
    role: UserRole,
    data: {
      type: NotificationType;
      title: string;
      message: string;
      entity?: string | null;
      entityId?: string | null;
    }
  ) {
    const users = await prisma.user.findMany({
      where: { role },
      select: { id: true },
    });

    await Promise.all(
      users.map((user) =>
        notificationRepository.create({
          userId: user.id,
          type: data.type,
          title: data.title,
          message: data.message,
          entity: data.entity,
          entityId: data.entityId,
        })
      )
    );
  },

  /** Notify management roles (OWNER, ADMIN). */
  async notifyManagement(data: {
    type: NotificationType;
    title: string;
    message: string;
    entity?: string | null;
    entityId?: string | null;
  }) {
    const users = await prisma.user.findMany({
      where: { role: { in: ["OWNER", "ADMIN"] } },
      select: { id: true },
    });

    await Promise.all(
      users.map((user) =>
        notificationRepository.create({
          userId: user.id,
          type: data.type,
          title: data.title,
          message: data.message,
          entity: data.entity,
          entityId: data.entityId,
        })
      )
    );
  },

  async list(userId: string, params: { skip?: number; take?: number; unreadOnly?: boolean }) {
    const where = params.unreadOnly
      ? { userId, readAt: null }
      : { userId };

    const [items, total, unreadCount] = await Promise.all([
      notificationRepository.findMany({
        where,
        skip: params.skip,
        take: params.take ?? 20,
      }),
      notificationRepository.count({ userId }),
      notificationRepository.getUnreadCount(userId),
    ]);

    return { items, total, unreadCount };
  },

  async markAsRead(id: string) {
    return notificationRepository.markAsRead(id);
  },

  async markAllAsRead(userId: string) {
    return notificationRepository.markAllAsRead(userId);
  },

  async getUnreadCount(userId: string) {
    return notificationRepository.getUnreadCount(userId);
  },
};
