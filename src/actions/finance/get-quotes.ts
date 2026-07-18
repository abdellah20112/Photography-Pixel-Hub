"use server";

import { quoteService } from "@/services/financial.service";
import { getCurrentUser } from "@/lib/auth/session";

/* ============================================
   Get Quotes Server Action
   ============================================ */

export async function getQuotesAction(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  clientId?: string;
  projectId?: string;
  filter?: string;
  sort?: string;
}) {
  const user = await getCurrentUser();
  if (!user) return { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const skip = (page - 1) * pageSize;

  const { items, total } = await quoteService.list({
    search: params?.search,
    clientId: params?.clientId,
    projectId: params?.projectId,
    filter: params?.filter,
    sort: params?.sort,
    skip,
    take: pageSize,
  });

  const totalPages = Math.ceil(total / pageSize);

  return {
    items: items.map((q) => ({
      id: q.id,
      quoteCode: q.quoteCode,
      clientId: q.clientId,
      projectId: q.projectId,
      status: q.status,
      total: q.total,
      validUntil: q.validUntil,
      createdAt: q.createdAt,
      client: q.client,
    })),
    total, page, pageSize, totalPages,
  };
}
