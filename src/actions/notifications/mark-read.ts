"use server";

import { revalidatePath } from "next/cache";

import { notificationService } from "@/services/notification.service";
import { getCurrentUser } from "@/lib/auth/session";

/* ============================================
   Mark Notification Read Server Actions
   ============================================ */

export async function markNotificationReadAction(id: string): Promise<{ success: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { success: false };

  await notificationService.markAsRead(id);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function markAllNotificationsReadAction(): Promise<{ success: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { success: false };

  await notificationService.markAllAsRead(user.id);
  revalidatePath("/dashboard");
  return { success: true };
}
