import { prisma } from "@/lib/prisma";
import type { Prisma, NotificationType } from "@prisma/client";

/* ============================================
   Notification Repository
   ============================================ */

export type NotificationWhereInput = Prisma.NotificationWhereInput;

export const notificationRepository = {
  create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    entity?: string | null;
    entityId?: string | null;
  }) {
    return prisma.notification.create({ data });
  },

  findMany(params: {
    where?: NotificationWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.NotificationOrderByWithRelationInput;
  }) {
    return prisma.notification.findMany({
      where: params.where,
      skip: params.skip,
      take: params.take,
      orderBy: params.orderBy ?? { createdAt: "desc" },
    });
  },

  count(where?: NotificationWhereInput) {
    return prisma.notification.count({ where });
  },

  markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  },

  markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  },

  getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, readAt: null },
    });
  },
};
