"use server";

import { financialStatisticsService } from "@/services/financial.service";
import { getCurrentUser } from "@/lib/auth/session";
import type { FinancialStats } from "@/types/financial";

/* ============================================
   Get Financial Stats Server Action
   ============================================ */

export async function getFinancialStatsAction(): Promise<FinancialStats> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      revenueToday: 0,
      revenueThisMonth: 0,
      outstandingAmount: 0,
      overdueInvoices: 0,
      paidThisMonth: 0,
      pendingQuotes: 0,
    };
  }

  return financialStatisticsService.getStats();
}
