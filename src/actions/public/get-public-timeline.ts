"use server";

import { projectRepository } from "@/repositories/project.repository";
import { timelineService } from "@/services/timeline.service";

/* ============================================
   Get Public Timeline (by token)
   Returns timeline events for the project.
   No authentication required — token-based.
   ============================================ */

export type PortalTimelineEvent = {
  id: string;
  eventType: string;
  title: string;
  description: string | null;
  actorName: string;
  createdAt: Date;
};

export async function getPublicTimelineAction(
  token: string,
): Promise<PortalTimelineEvent[]> {
  const project = await projectRepository.findByToken(token);
  if (!project) return [];

  const events = await timelineService.getByProject(project.id, 30);

  return events.map((e) => ({
    id: e.id,
    eventType: e.eventType,
    title: e.title,
    description: e.description,
    actorName: e.actorName,
    createdAt: e.createdAt,
  }));
}
