"use server";

import { clientService } from "@/services/client.service";
import { getCurrentUser } from "@/lib/auth/session";

/* ============================================
   Export Clients Server Action
   Exports non-archived clients as CSV.
   ============================================ */

export async function exportClientsAction(): Promise<{
  success: boolean;
  csv?: string;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  try {
    const csv = await clientService.exportCsv(user.id);
    return { success: true, csv };
  } catch {
    return { success: false, error: "فشل في تصدير العملاء" };
  }
}
