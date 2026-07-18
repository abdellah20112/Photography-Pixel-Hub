"use server";

import { revalidatePath } from "next/cache";

import { clientService } from "@/services/client.service";
import { getCurrentUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";

/* ============================================
   Delete (Archive) Client Server Action
   Soft delete only — never permanently deletes.
   ============================================ */

export async function deleteClientAction(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  try {
    await clientService.archive(id, { actorId: user.id });
    revalidatePath(ROUTES.DASHBOARD_CLIENTS);
    return { success: true };
  } catch {
    return { success: false, error: "فشل في أرشفة العميل" };
  }
}
