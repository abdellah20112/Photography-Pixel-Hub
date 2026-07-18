"use server";

import { scheduleService } from "@/services/schedule.service";
import { getCurrentUser } from "@/lib/auth/session";
import type { ShootFilterValue, ShootSortValue } from "@/lib/validations/schedule";

export async function getShootsAction(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  projectId?: string;
  filter?: ShootFilterValue;
  sort?: ShootSortValue;
  startDate?: string;
  endDate?: string;
}) {
  const user = await getCurrentUser();
  if (!user) return { items: [], total: 0, page: 1, pageSize: 25, totalPages: 0 };

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 25;
  const skip = (page - 1) * pageSize;

  const { items, total } = await scheduleService.list({
    search: params?.search,
    projectId: params?.projectId,
    filter: params?.filter,
    sort: params?.sort,
    startDate: params?.startDate ? new Date(params.startDate) : undefined,
    endDate: params?.endDate ? new Date(params.endDate) : undefined,
    skip,
    take: pageSize,
  });

  const totalPages = Math.ceil(total / pageSize);

  return {
    items: items.map((s) => ({
      id: s.id,
      shootCode: s.shootCode,
      projectId: s.projectId,
      title: s.title,
      description: s.description,
      location: s.location,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      status: s.status,
      notes: s.notes,
      createdAt: s.createdAt,
      project: s.project,
      assignmentCount: s._count.assignments,
    })),
    total, page, pageSize, totalPages,
  };
}
