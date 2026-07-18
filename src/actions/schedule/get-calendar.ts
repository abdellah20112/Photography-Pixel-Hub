"use server";

import { scheduleService } from "@/services/schedule.service";
import { getCurrentUser } from "@/lib/auth/session";

export async function getCalendarAction(params: { startDate: string; endDate: string }) {
  const user = await getCurrentUser();
  if (!user) return [];

  return scheduleService.getCalendar(new Date(params.startDate), new Date(params.endDate));
}

export async function getTodayShootsAction() {
  const user = await getCurrentUser();
  if (!user) return [];

  return scheduleService.getByDate(new Date());
}

export async function getUpcomingShootsAction(days = 7) {
  const user = await getCurrentUser();
  if (!user) return [];

  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return scheduleService.getCalendar(now, future);
}

export async function getShootDashboardStatsAction() {
  const user = await getCurrentUser();
  if (!user) return { todayShoots: 0, tomorrowShoots: 0, upcomingWeek: 0, busyTeam: 0, availableTeam: 0 };

  return scheduleService.getDashboardStats();
}
