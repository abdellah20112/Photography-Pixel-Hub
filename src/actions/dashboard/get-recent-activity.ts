"use server";

import { timelineService } from "@/services/timeline.service";
import { getCurrentUser } from "@/lib/auth/session";
import type { ProjectEventType } from "@prisma/client";

/* ============================================
   Get Recent Activity (auth required)
   Dashboard widget feed — newest 10 events.
   ============================================ */

export type RecentActivityItem = {
  id: string;
  eventType: ProjectEventType;
  title: string;
  description: string | null;
  actorName: string;
  createdAt: Date;
  project: {
    id: string;
    name: string;
    projectCode: string;
  } | null;
};

export async function getRecentActivityAction(
  take = 10,
): Promise<RecentActivityItem[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const { items } = await timelineService.list({ take });

  return items.map((e) => ({
    id: e.id,
    eventType: e.eventType,
    title: e.title,
    description: e.description,
    actorName: e.actorName,
    createdAt: e.createdAt,
    project: e.project
      ? {
          id: e.project.id,
          name: e.project.name,
          projectCode: e.project.projectCode,
        }
      : null,
  }));
}
