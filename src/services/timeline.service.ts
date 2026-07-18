import { timelineRepository } from "@/repositories/timeline.repository";
import type { Prisma, ProjectEventType } from "@prisma/client";

/* ============================================
   Timeline Service
   The ONLY entry point for publishing timeline events.
   Modules must NOT write directly to the timeline table.
   They call TimelineService.publish() instead.
   ============================================ */

export const timelineService = {
  /** Publish a timeline event. Append-only — never edit. */
  async publish(params: {
    projectId: string;
    eventType: ProjectEventType;
    title: string;
    description?: string;
    metadata?: Record<string, unknown>;
    actorId?: string;
    actorName: string;
  }) {
    return timelineRepository.create({
      projectId: params.projectId,
      eventType: params.eventType,
      title: params.title,
      description: params.description ?? null,
      metadata: (params.metadata as Prisma.InputJsonValue) ?? undefined,
      actorId: params.actorId ?? null,
      actorName: params.actorName,
    });
  },

  /** Get timeline for a specific project (newest first). */
  async getByProject(projectId: string, take = 50) {
    return timelineRepository.findByProject(projectId, take);
  },

  /** Global timeline with search and filter. */
  async list(params: {
    projectId?: string;
    eventType?: ProjectEventType;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    return timelineRepository.findMany(params);
  },

  /** Get workflow statistics for dashboard. */
  async getWorkflowStats() {
    return timelineRepository.getWorkflowStats();
  },
};
