import { prisma } from "@/lib/prisma";
import type { Prisma, TeamMemberStatus, TeamRole } from "@prisma/client";

/* ============================================
   Team Repository
   TeamMember + ProjectAssignment data access.
   ============================================ */

export type TeamMemberWithRelations = Prisma.TeamMemberGetPayload<{
  include: { projectAssignments: { include: { project: true } } };
}>;

export type TeamMemberCreateInput = Prisma.TeamMemberUncheckedCreateInput;
export type TeamMemberUpdateInput = Prisma.TeamMemberUncheckedUpdateInput;
export type TeamMemberWhereInput = Prisma.TeamMemberWhereInput;

function buildWhere(params: {
  search?: string;
  filter?: string;
  roleFilter?: string;
}): TeamMemberWhereInput {
  const where: TeamMemberWhereInput = {};

  if (params.filter === "active") where.status = "ACTIVE";
  else if (params.filter === "inactive") where.status = "INACTIVE";
  else if (params.filter === "on_leave") where.status = "ON_LEAVE";

  if (params.roleFilter && params.roleFilter !== "all") {
    where.role = params.roleFilter as TeamRole;
  }

  if (params.search) {
    where.OR = [
      { fullName: { contains: params.search, mode: "insensitive" } },
      { employeeCode: { contains: params.search, mode: "insensitive" } },
      { phone: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
    ];
  }

  return where;
}

function buildOrderBy(sort: string): Prisma.TeamMemberOrderByWithRelationInput {
  if (sort === "oldest") return { createdAt: "asc" };
  if (sort === "alphabetical") return { fullName: "asc" };
  return { createdAt: "desc" };
}

export const teamRepository = {
  findById(id: string) {
    return prisma.teamMember.findUnique({
      where: { id },
      include: {
        projectAssignments: {
          include: {
            project: { select: { id: true, name: true, projectCode: true } },
          },
        },
      },
    });
  },

  findByEmail(email: string) {
    return prisma.teamMember.findUnique({ where: { email } });
  },

  findByEmployeeCode(code: string) {
    return prisma.teamMember.findUnique({ where: { employeeCode: code } });
  },

  create(data: TeamMemberCreateInput) {
    return prisma.teamMember.create({ data });
  },

  update(id: string, data: TeamMemberUpdateInput) {
    return prisma.teamMember.update({ where: { id }, data });
  },

  softDelete(id: string) {
    return prisma.teamMember.update({
      where: { id },
      data: { status: "INACTIVE" as TeamMemberStatus },
    });
  },

  restore(id: string) {
    return prisma.teamMember.update({
      where: { id },
      data: { status: "ACTIVE" as TeamMemberStatus },
    });
  },

  delete(id: string) {
    return prisma.teamMember.delete({ where: { id } });
  },

  async findMany(params: {
    search?: string;
    filter?: string;
    roleFilter?: string;
    sort?: string;
    skip?: number;
    take?: number;
  }) {
    const where = buildWhere(params);
    const orderBy = buildOrderBy(params.sort ?? "newest");

    const [items, total] = await Promise.all([
      prisma.teamMember.findMany({
        where, skip: params.skip, take: params.take, orderBy,
        include: {
          _count: {
            select: {
              projectAssignments: { where: { completedAt: null } },
            },
          },
        },
      }),
      prisma.teamMember.count({ where }),
    ]);

    return { items, total };
  },

  count(where?: TeamMemberWhereInput) {
    return prisma.teamMember.count({ where });
  },

  findLatestEmployeeCode() {
    return prisma.teamMember.findFirst({
      orderBy: { employeeCode: "desc" },
      select: { employeeCode: true },
    });
  },

  async getStatistics(memberId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [active, completed, thisMonth] = await Promise.all([
      prisma.projectAssignment.count({
        where: { teamMemberId: memberId, completedAt: null },
      }),
      prisma.projectAssignment.count({
        where: { teamMemberId: memberId, completedAt: { not: null } },
      }),
      prisma.projectAssignment.count({
        where: { teamMemberId: memberId, assignedAt: { gte: startOfMonth } },
      }),
    ]);

    return { activeProjects: active, completedProjects: completed, projectsThisMonth: thisMonth };
  },

  // ── Assignments ──────────────────────────

  findAssignment(projectId: string, teamMemberId: string) {
    return prisma.projectAssignment.findUnique({
      where: { projectId_teamMemberId: { projectId, teamMemberId } },
      include: {
        teamMember: {
          select: { id: true, fullName: true, employeeCode: true, phone: true, photo: true },
        },
      },
    });
  },

  createAssignment(data: {
    projectId: string;
    teamMemberId: string;
    role: TeamRole;
    notes?: string | null;
  }) {
    return prisma.projectAssignment.create({
      data,
      include: {
        teamMember: {
          select: { id: true, fullName: true, employeeCode: true, phone: true, photo: true },
        },
      },
    });
  },

  updateAssignment(id: string, data: {
    role?: TeamRole;
    notes?: string | null;
    completedAt?: Date | null;
  }) {
    return prisma.projectAssignment.update({
      where: { id },
      data,
      include: {
        teamMember: {
          select: { id: true, fullName: true, employeeCode: true, phone: true, photo: true },
        },
      },
    });
  },

  deleteAssignment(id: string) {
    return prisma.projectAssignment.delete({ where: { id } });
  },

  findAssignmentsByProject(projectId: string) {
    return prisma.projectAssignment.findMany({
      where: { projectId },
      include: {
        teamMember: {
          select: { id: true, fullName: true, employeeCode: true, phone: true, photo: true },
        },
      },
      orderBy: { assignedAt: "desc" },
    });
  },

  async getDashboardStats() {
    const [active, busy, editors, photographers] = await Promise.all([
      prisma.teamMember.count({ where: { status: "ACTIVE" } }),
      prisma.teamMember.count({
        where: {
          status: "ACTIVE",
          projectAssignments: { some: { completedAt: null } },
        },
      }),
      prisma.teamMember.count({
        where: {
          status: "ACTIVE",
          role: "EDITOR",
          projectAssignments: { some: { completedAt: null } },
        },
      }),
      prisma.teamMember.count({
        where: {
          status: "ACTIVE",
          role: "PHOTOGRAPHER",
          projectAssignments: { some: { completedAt: null } },
        },
      }),
    ]);

    return { activeEmployees: active, busyEmployees: busy, editorsWorking: editors, photographersWorking: photographers };
  },
};
