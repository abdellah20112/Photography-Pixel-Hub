"use server";

import { getSettings } from "@/lib/config/site-settings";
import { getCurrentUser } from "@/lib/auth/session";
import type { SiteSettings } from "@/lib/config/site-settings";

/* ============================================
   Get Site Settings (auth required)
   ============================================ */

export async function getSettingsAction(): Promise<SiteSettings> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("يجب تسجيل الدخول");
  }

  return getSettings();
}
