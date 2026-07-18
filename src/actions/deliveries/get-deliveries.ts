"use server";

import { deliveryService } from "@/services/delivery.service";
import { getCurrentUser } from "@/lib/auth/session";
import { PAGINATION } from "@/lib/constants";
import type { DeliveryFilterValue, DeliverySortValue } from "@/lib/validations/delivery";

/* ============================================
   Get Deliveries Server Action
   Paginated list with search, filter, and sort.
   ============================================ */

export async function getDeliveriesAction(params?: {
  page?: number;
  pageSize?: number;
  projectId?: string;
  search?: string;
  filter?: DeliveryFilterValue;
  sort?: DeliverySortValue;
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

  const { items, total } = await deliveryService.list({
    projectId: params?.projectId,
    skip,
    take: pageSize,
    search: params?.search,
    filter: params?.filter ?? "all",
    sort: params?.sort ?? "newest",
  });

  const totalPages = Math.ceil(total / pageSize);

  return {
    items: items.map((d) => ({
      id: d.id,
      deliveryCode: d.deliveryCode,
      projectId: d.projectId,
      title: d.title,
      slug: d.slug,
      status: d.status,
      expiresAt: d.expiresAt,
      downloadEnabled: d.downloadEnabled,
      allowStreaming: d.allowStreaming,
      passwordProtected: d.passwordProtected,
      viewCount: d.viewCount,
      downloadCount: d.downloadCount,
      lastViewedAt: d.lastViewedAt,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      project: {
        id: d.project.id,
        name: d.project.name,
        projectCode: d.project.projectCode,
      },
      videoCount: d._count.videos,
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
}
