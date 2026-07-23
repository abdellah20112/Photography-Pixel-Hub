"use server";

import { saveSettings } from "@/lib/config/site-settings";
import { getCurrentUser } from "@/lib/auth/session";
import type { SiteSettings } from "@/lib/config/site-settings";

/* ============================================
   Save Site Settings (auth required)
   ============================================ */

export async function saveSettingsAction(
  data: Partial<SiteSettings>,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  try {
    await saveSettings(data);
    return { success: true };
  } catch {
    return { success: false, error: "فشل في حفظ الإعدادات" };
  }
}
