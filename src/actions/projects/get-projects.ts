"use server";

import { projectService } from "@/services/project.service";
import { getCurrentUser } from "@/lib/auth/session";
import { PAGINATION } from "@/lib/constants";
import type { ProjectFilterValue, ProjectSortValue } from "@/lib/validations/project";

/* ============================================
   Get Projects Server Action
   Paginated list with search, filter, and sort.
   ============================================ */

export async function getProjectsAction(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  filter?: ProjectFilterValue;
  sort?: ProjectSortValue;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
      totalPages: 0,
    };
  }

  const page = params?.page ?? PAGINATION.DEFAULT_PAGE;
  const pageSize = params?.pageSize ?? 10;
  const skip = (page - 1) * pageSize;

  const { items, total } = await projectService.list({
    skip,
    take: pageSize,
    search: params?.search,
    filter: params?.filter ?? "all",
    sort: params?.sort ?? "newest",
  });

  const totalPages = Math.ceil(total / pageSize);

  return {
    items: items.map((p) => ({
      id: p.id,
      projectCode: p.projectCode,
      clientId: p.clientId,
      name: p.name,
      description: p.description,
      status: p.status,
      retentionPeriod: p.retentionPeriod,
      deadline: p.deadline,
      archivedAt: p.archivedAt,
      videoCount: p._count.videos,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      client: {
        id: p.client.id,
        name: p.client.name,
        clientCode: p.client.clientCode,
      },
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
}
