"use server";

import { modelService } from "@/services/model.service";
import { getCurrentUser } from "@/lib/auth/session";
import { PAGINATION } from "@/lib/constants";
import type { ModelFilterValue, ModelSortValue } from "@/lib/validations/model";

/* ============================================
   Get Models Server Action
   Paginated list with search, filter, and sort.
   ============================================ */

export async function getModelsAction(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  filter?: ModelFilterValue;
  sort?: ModelSortValue;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
  }

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const skip = (page - 1) * pageSize;

  const { items, total } = await modelService.list({
    skip,
    take: pageSize,
    search: params?.search,
    filter: params?.filter ?? "all",
    sort: params?.sort ?? "newest",
  });

  const totalPages = Math.ceil(total / pageSize);

  return {
    items: items.map((m) => ({
      id: m.id,
      modelCode: m.modelCode,
      fullName: m.fullName,
      phone: m.phone,
      whatsapp: m.whatsapp,
      email: m.email,
      photo: m.photo,
      status: m.status,
      notes: m.notes,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      projectCount: m._count.projectModels,
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
}
