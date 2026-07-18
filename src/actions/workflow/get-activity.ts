"use server";

import { timelineService } from "@/services/timeline.service";
import { getCurrentUser } from "@/lib/auth/session";
import type { ProjectEventType } from "@prisma/client";

/* ============================================
   Get Activity Server Action
   Global timeline feed with search, filter, pagination.
   ============================================ */

export async function getActivityAction(params?: {
  page?: number;
  pageSize?: number;
  projectId?: string;
  eventType?: ProjectEventType;
  search?: string;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return { items: [], total: 0, page: 1, pageSize: 25, totalPages: 0 };
  }

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 25;
  const skip = (page - 1) * pageSize;

  const { items, total } = await timelineService.list({
    projectId: params?.projectId,
    eventType: params?.eventType,
    search: params?.search,
    skip,
    take: pageSize,
  });

  const totalPages = Math.ceil(total / pageSize);

  return {
    items: items.map((e) => ({
      id: e.id,
      projectId: e.projectId,
      eventType: e.eventType,
      title: e.title,
      description: e.description,
      metadata: e.metadata,
      actorId: e.actorId,
      actorName: e.actorName,
      createdAt: e.createdAt,
      project: e.project
        ? {
            id: e.project.id,
            name: e.project.name,
            projectCode: e.project.projectCode,
          }
        : null,
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
}
