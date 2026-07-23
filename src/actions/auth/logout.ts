"use server";

import { authService } from "@/services/auth.service";
import { getCurrentUser } from "@/lib/auth/session";

/* ============================================
   Logout Server Action
   ============================================ */

export async function logoutAction(): Promise<{ success: boolean }> {
  const user = await getCurrentUser();
  await authService.logout(user?.id);
  return { success: true };
}
