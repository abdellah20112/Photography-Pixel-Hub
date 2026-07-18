"use server";

import { teamService } from "@/services/team.service";
import { getCurrentUser } from "@/lib/auth/session";
import type { TeamDashboardStats } from "@/types/team";

export async function getTeamDashboardStatsAction(): Promise<TeamDashboardStats> {
  const user = await getCurrentUser();
  if (!user) return { activeEmployees: 0, busyEmployees: 0, editorsWorking: 0, photographersWorking: 0 };

  return teamService.getDashboardStats();
}
