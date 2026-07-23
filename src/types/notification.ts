import type { NotificationType } from "@prisma/client";

/* ============================================
   Notification Types
   ============================================ */

export type NotificationRow = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  entity: string | null;
  entityId: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export type NotificationWithUnread = {
  items: NotificationRow[];
  total: number;
  unreadCount: number;
};
