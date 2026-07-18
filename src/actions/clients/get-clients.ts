"use server";

import { clientService } from "@/services/client.service";
import { getCurrentUser } from "@/lib/auth/session";
import { PAGINATION } from "@/lib/constants";
import type { ClientFilterValue, ClientSortValue } from "@/lib/validations/client";

/* ============================================
   Get Clients Server Action
   Paginated list with search, filter, and sort.
   ============================================ */

export async function getClientsAction(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  filter?: ClientFilterValue;
  sort?: ClientSortValue;
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

  const { items, total } = await clientService.list({
    userId: user.id,
    skip,
    take: pageSize,
    search: params?.search,
    filter: params?.filter ?? "all",
    sort: params?.sort ?? "newest",
  });

  const totalPages = Math.ceil(total / pageSize);

  return {
    items: items.map((c) => ({
      id: c.id,
      clientCode: c.clientCode,
      name: c.name,
      company: c.company,
      phone: c.phone,
      email: c.email,
      notes: c.notes,
      status: c.status,
      archivedAt: c.archivedAt,
      projectCount: c._count.projects,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
}
