"use server";

import { notificationService } from "@/services/notification.service";
import { getCurrentUser } from "@/lib/auth/session";

/* ============================================
   Get Notifications Server Action
   ============================================ */

export async function getNotificationsAction(params?: {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
}) {
  const user = await getCurrentUser();
  if (!user) return { items: [], total: 0, unreadCount: 0 };

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  return notificationService.list(user.id, {
    skip,
    take: pageSize,
    unreadOnly: params?.unreadOnly,
  });
}

export async function getUnreadCountAction(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;

  return notificationService.getUnreadCount(user.id);
}
