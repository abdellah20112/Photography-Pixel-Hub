"use server";

import { modelService } from "@/services/model.service";
import { getCurrentUser } from "@/lib/auth/session";
import type { ModelDashboardStats } from "@/types/model";

/* ============================================
   Get Model Dashboard Stats Server Action
   ============================================ */

export async function getModelDashboardStatsAction(): Promise<ModelDashboardStats> {
  const user = await getCurrentUser();
  if (!user) {
    return { activeModels: 0, busyToday: 0, pendingPayments: 0, topModels: [] };
  }

  return modelService.getDashboardStats();
}
