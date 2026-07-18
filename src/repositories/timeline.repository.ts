import { prisma } from "@/lib/prisma";
import type { Prisma, ProjectEventType } from "@prisma/client";

/* ============================================
   Project Timeline Repository
   The ONLY layer that interacts with Prisma
   for ProjectTimelineEvent operations.
   ============================================ */

export type TimelineEventWithProject = Prisma.ProjectTimelineEventGetPayload<{
  include: { project: true };
}>;

export type TimelineEventCreateInput = Prisma.ProjectTimelineEventUncheckedCreateInput;
export type TimelineEventWhereInput = Prisma.ProjectTimelineEventWhereInput;

export const timelineRepository = {
  findById(id: string) {
    return prisma.projectTimelineEvent.findUnique({
      where: { id },
      include: { project: true },
    });
  },

  create(data: TimelineEventCreateInput) {
    return prisma.projectTimelineEvent.create({
      data,
    });
  },

  /** Get timeline events for a specific project (newest first). */
  findByProject(projectId: string, take = 50) {
    return prisma.projectTimelineEvent.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take,
    });
  },

  /** Paginated global timeline with search and filter. */
  async findMany(params: {
    projectId?: string;
    eventType?: ProjectEventType;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    const where: TimelineEventWhereInput = {};

    if (params.projectId) {
      where.projectId = params.projectId;
    }

    if (params.eventType) {
      where.eventType = params.eventType;
    }

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
        { actorName: { contains: params.search, mode: "insensitive" } },
        { project: { name: { contains: params.search, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.projectTimelineEvent.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: "desc" },
        include: {
          project: {
            select: { id: true, name: true, projectCode: true },
          },
        },
      }),
      prisma.projectTimelineEvent.count({ where }),
    ]);

    return { items, total };
  },

  count(where?: TimelineEventWhereInput) {
    return prisma.projectTimelineEvent.count({ where });
  },

  /** Get workflow statistics for dashboard widgets. */
  async getWorkflowStats() {
    const [
      editing,
      review,
      approved,
      delivered,
      completed,
    ] = await Promise.all([
      prisma.project.count({ where: { workflowStatus: "EDITING" } }),
      prisma.project.count({ where: { workflowStatus: "REVIEW" } }),
      prisma.project.count({ where: { workflowStatus: "APPROVED" } }),
      prisma.project.count({ where: { workflowStatus: "DELIVERED" } }),
      prisma.project.count({ where: { workflowStatus: "COMPLETED" } }),
    ]);

    return { editing, review, approved, delivered, completed };
  },
};
