import { prisma } from "@/lib/prisma";
import type { Prisma, ShootStatus } from "@prisma/client";

/* ============================================
   Shoot Repository
   ============================================ */

export type ShootWithRelations = Prisma.ShootGetPayload<{
  include: {
    project: true;
    assignments: {
      include: { teamMember: true; model: true };
    };
  };
}>;

function buildWhere(params: {
  search?: string;
  projectId?: string;
  filter?: string;
  startDate?: Date;
  endDate?: Date;
}): Prisma.ShootWhereInput {
  const where: Prisma.ShootWhereInput = {};

  if (params.filter && params.filter !== "all") {
    const map: Record<string, string> = {
      scheduled: "SCHEDULED", confirmed: "CONFIRMED",
      in_progress: "IN_PROGRESS", completed: "COMPLETED", cancelled: "CANCELLED",
    };
    if (map[params.filter]) where.status = map[params.filter] as ShootStatus;
  }

  if (params.projectId) where.projectId = params.projectId;

  if (params.startDate || params.endDate) {
    where.date = {};
    if (params.startDate) where.date.gte = params.startDate;
    if (params.endDate) where.date.lte = params.endDate;
  }

  if (params.search) {
    where.OR = [
      { shootCode: { contains: params.search, mode: "insensitive" } },
      { title: { contains: params.search, mode: "insensitive" } },
      { location: { contains: params.search, mode: "insensitive" } },
      { project: { name: { contains: params.search, mode: "insensitive" } } },
    ];
  }

  return where;
}

function buildOrderBy(sort: string): Prisma.ShootOrderByWithRelationInput {
  if (sort === "oldest") return { createdAt: "asc" };
  if (sort === "date_asc") return { date: "asc" };
  if (sort === "date_desc") return { date: "desc" };
  return { createdAt: "desc" };
}

export const shootRepository = {
  findById(id: string) {
    return prisma.shoot.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, projectCode: true } },
        assignments: {
          include: {
            teamMember: { select: { id: true, fullName: true, employeeCode: true } },
            model: { select: { id: true, fullName: true, modelCode: true } },
          },
        },
      },
    });
  },

  findByShootCode(code: string) {
    return prisma.shoot.findUnique({ where: { shootCode: code } });
  },

  create(data: Prisma.ShootUncheckedCreateInput) {
    return prisma.shoot.create({
      data,
      include: {
        project: { select: { id: true, name: true, projectCode: true } },
        assignments: true,
      },
    });
  },

  update(id: string, data: Prisma.ShootUncheckedUpdateInput) {
    return prisma.shoot.update({
      where: { id },
      data,
      include: {
        project: { select: { id: true, name: true, projectCode: true } },
        assignments: {
          include: {
            teamMember: { select: { id: true, fullName: true, employeeCode: true } },
            model: { select: { id: true, fullName: true, modelCode: true } },
          },
        },
      },
    });
  },

  softDelete(id: string) {
    return prisma.shoot.update({
      where: { id },
      data: { status: "CANCELLED" as ShootStatus },
    });
  },

  delete(id: string) {
    return prisma.shoot.delete({ where: { id } });
  },

  async findMany(params: {
    search?: string;
    projectId?: string;
    filter?: string;
    sort?: string;
    startDate?: Date;
    endDate?: Date;
    skip?: number;
    take?: number;
  }) {
    const where = buildWhere(params);
    const orderBy = buildOrderBy(params.sort ?? "newest");

    const [items, total] = await Promise.all([
      prisma.shoot.findMany({
        where, skip: params.skip, take: params.take, orderBy,
        include: {
          project: { select: { id: true, name: true, projectCode: true } },
          _count: { select: { assignments: true } },
        },
      }),
      prisma.shoot.count({ where }),
    ]);

    return { items, total };
  },

  count(where?: Prisma.ShootWhereInput) {
    return prisma.shoot.count({ where });
  },

  findLatestShootCode() {
    return prisma.shoot.findFirst({
      orderBy: { shootCode: "desc" },
      select: { shootCode: true },
    });
  },

  /** Find shoots within a date range for calendar. */
  findByDateRange(startDate: Date, endDate: Date) {
    return prisma.shoot.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        status: { not: "CANCELLED" },
      },
      include: {
        project: { select: { id: true, name: true, projectCode: true } },
      },
      orderBy: { startTime: "asc" },
    });
  },

  /** Find shoots for a specific date. */
  findByDate(date: Date) {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    return this.findByDateRange(start, end);
  },

  // ── Assignments ──────────────────────────

  createAssignment(data: {
    shootId: string;
    teamMemberId?: string | null;
    modelId?: string | null;
    role: string;
  }) {
    return prisma.shootAssignment.create({
      data: {
        shootId: data.shootId,
        teamMemberId: data.teamMemberId || null,
        modelId: data.modelId || null,
        role: data.role,
      },
      include: {
        teamMember: { select: { id: true, fullName: true, employeeCode: true } },
        model: { select: { id: true, fullName: true, modelCode: true } },
      },
    });
  },

  deleteAssignment(id: string) {
    return prisma.shootAssignment.delete({ where: { id } });
  },

  findAssignmentsByShoot(shootId: string) {
    return prisma.shootAssignment.findMany({
      where: { shootId },
      include: {
        teamMember: { select: { id: true, fullName: true, employeeCode: true } },
        model: { select: { id: true, fullName: true, modelCode: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  },

  /** Find overlapping shoots for conflict detection. */
  findOverlappingShoots(
    teamMemberId: string,
    startTime: Date,
    endTime: Date,
    excludeShootId?: string
  ) {
    return prisma.shootAssignment.findMany({
      where: {
        teamMemberId,
        shoot: {
          startTime: { lt: endTime },
          endTime: { gt: startTime },
          status: { notIn: ["CANCELLED", "COMPLETED"] },
          ...(excludeShootId ? { id: { not: excludeShootId } } : {}),
        },
      },
      include: {
        shoot: { select: { id: true, title: true, shootCode: true, startTime: true, endTime: true } },
      },
    });
  },

  findOverlappingShootsForModel(
    modelId: string,
    startTime: Date,
    endTime: Date,
    excludeShootId?: string
  ) {
    return prisma.shootAssignment.findMany({
      where: {
        modelId,
        shoot: {
          startTime: { lt: endTime },
          endTime: { gt: startTime },
          status: { notIn: ["CANCELLED", "COMPLETED"] },
          ...(excludeShootId ? { id: { not: excludeShootId } } : {}),
        },
      },
      include: {
        shoot: { select: { id: true, title: true, shootCode: true, startTime: true, endTime: true } },
      },
    });
  },

  /** Get dashboard stats. */
  async getDashboardStats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    const startOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [today, tomorrow, upcoming, busyTeam, activeTeam] = await Promise.all([
      prisma.shoot.count({
        where: { date: { gte: startOfToday, lt: startOfTomorrow }, status: { notIn: ["CANCELLED", "COMPLETED"] } },
      }),
      prisma.shoot.count({
        where: { date: { gte: startOfTomorrow, lt: new Date(startOfTomorrow.getTime() + 24 * 60 * 60 * 1000) }, status: { notIn: ["CANCELLED", "COMPLETED"] } },
      }),
      prisma.shoot.count({
        where: { date: { gte: startOfToday, lt: startOfWeek }, status: { notIn: ["CANCELLED", "COMPLETED"] } },
      }),
      prisma.teamMember.count({
        where: { status: "ACTIVE", shootAssignments: { some: { shoot: { date: { gte: startOfToday, lt: startOfTomorrow }, status: { notIn: ["CANCELLED", "COMPLETED"] } } } } },
      }),
      prisma.teamMember.count({ where: { status: "ACTIVE" } }),
    ]);

    return {
      todayShoots: today,
      tomorrowShoots: tomorrow,
      upcomingWeek: upcoming,
      busyTeam: busyTeam,
      availableTeam: activeTeam - busyTeam,
    };
  },
};
