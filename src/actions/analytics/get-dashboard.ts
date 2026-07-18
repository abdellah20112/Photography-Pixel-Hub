"use server";

import { analyticsService, resolveDateRange } from "@/services/analytics.service";
import { getCurrentUser } from "@/lib/auth/session";
import type { DashboardData } from "@/types/analytics";

export async function getDashboardAction(params: {
  preset: string;
  customStart?: string;
  customEnd?: string;
}): Promise<DashboardData | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const range = resolveDateRange(params.preset, { start: params.customStart, end: params.customEnd });
  return analyticsService.getDashboard(range);
}

export async function getChartsAction(params: {
  section: string;
  preset: string;
  customStart?: string;
  customEnd?: string;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const range = resolveDateRange(params.preset, { start: params.customStart, end: params.customEnd });
  return analyticsService.getCharts(params.section, range);
}
