"use server";

import { teamService } from "@/services/team.service";
import { getCurrentUser } from "@/lib/auth/session";
import type { TeamFilterValue, TeamSortValue, RoleFilterValue } from "@/lib/validations/team";

export async function getTeamMembersAction(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  filter?: TeamFilterValue;
  roleFilter?: RoleFilterValue;
  sort?: TeamSortValue;
}) {
  const user = await getCurrentUser();
  if (!user) return { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const skip = (page - 1) * pageSize;

  const { items, total } = await teamService.list({
    search: params?.search,
    filter: params?.filter,
    roleFilter: params?.roleFilter,
    sort: params?.sort,
    skip,
    take: pageSize,
  });

  const totalPages = Math.ceil(total / pageSize);

  return {
    items: items.map((m) => ({
      id: m.id,
      employeeCode: m.employeeCode,
      fullName: m.fullName,
      email: m.email,
      phone: m.phone,
      photo: m.photo,
      role: m.role,
      status: m.status,
      joinDate: m.joinDate,
      notes: m.notes,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      activeProjectCount: m._count.projectAssignments,
    })),
    total, page, pageSize, totalPages,
  };
}
