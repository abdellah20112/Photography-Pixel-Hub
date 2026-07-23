import { prisma } from "@/lib/prisma";
import type { Prisma, ModelStatus } from "@prisma/client";

/* ============================================
   Model Repository
   The ONLY layer that interacts with Prisma
   for Model and ProjectModel operations.
   ============================================ */

export type ModelWithRelations = Prisma.ModelGetPayload<{
  include: { projectModels: { include: { project: true } } };
}>;

export type ModelCreateInput = Prisma.ModelUncheckedCreateInput;
export type ModelUpdateInput = Prisma.ModelUncheckedUpdateInput;
export type ModelWhereInput = Prisma.ModelWhereInput;

/** Build the WHERE clause for search + filter. */
function buildWhere(params: {
  search?: string;
  filter?: string;
}): ModelWhereInput {
  const where: ModelWhereInput = {};

  if (params.filter === "active") {
    where.status = "ACTIVE";
  } else if (params.filter === "inactive") {
    where.status = "INACTIVE";
  }

  if (params.search) {
    where.OR = [
      { modelCode: { contains: params.search, mode: "insensitive" } },
      { fullName: { contains: params.search, mode: "insensitive" } },
      { phone: { contains: params.search, mode: "insensitive" } },
    ];
  }

  return where;
}

/** Build the ORDER BY clause for sorting. */
function buildOrderBy(sort: string): Prisma.ModelOrderByWithRelationInput {
  if (sort === "oldest") return { createdAt: "asc" };
  if (sort === "alphabetical") return { fullName: "asc" };
  return { createdAt: "desc" };
}

export const modelRepository = {
  findById(id: string) {
    return prisma.model.findUnique({
      where: { id },
      include: {
        projectModels: {
          include: {
            project: {
              select: { id: true, name: true, projectCode: true },
            },
          },
        },
      },
    });
  },

  findByModelCode(modelCode: string) {
    return prisma.model.findUnique({ where: { modelCode } });
  },

  create(data: ModelCreateInput) {
    return prisma.model.create({
      data,
    });
  },

  update(id: string, data: ModelUpdateInput) {
    return prisma.model.update({
      where: { id },
      data,
    });
  },

  /** Soft delete — set status to INACTIVE. */
  softDelete(id: string) {
    return prisma.model.update({
      where: { id },
      data: { status: "INACTIVE" as ModelStatus },
    });
  },

  /** Restore — set status to ACTIVE. */
  restore(id: string) {
    return prisma.model.update({
      where: { id },
      data: { status: "ACTIVE" as ModelStatus },
    });
  },

  /** Hard delete — used only in tests/cleanup. */
  delete(id: string) {
    return prisma.model.delete({ where: { id } });
  },

  /** Paginated list with search, filter, and sort. */
  async findMany(params: {
    skip?: number;
    take?: number;
    search?: string;
    filter?: string;
    sort?: string;
  }) {
    const where = buildWhere(params);
    const orderBy = buildOrderBy(params.sort ?? "newest");

    const [items, total] = await Promise.all([
      prisma.model.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy,
        include: {
          _count: {
            select: { projectModels: true },
          },
        },
      }),
      prisma.model.count({ where }),
    ]);

    return { items, total };
  },

  count(where?: ModelWhereInput) {
    return prisma.model.count({ where });
  },

  /** Find the latest model code for sequential generation. */
  findLatestModelCode() {
    return prisma.model.findFirst({
      orderBy: { modelCode: "desc" },
      select: { modelCode: true },
    });
  },

  /** Get model statistics for profile/dashboard. */
  async getStatistics(modelId: string) {
    const assignments = await prisma.projectModel.findMany({
      where: { modelId },
      select: {
        videosCount: true,
        totalAmount: true,
        paymentStatus: true,
      },
    });

    const totalVideos = assignments.reduce((sum, a) => sum + a.videosCount, 0);
    const totalEarnings = assignments.reduce((sum, a) => sum + a.totalAmount, 0);
    const pendingAmount = assignments
      .filter((a) => a.paymentStatus !== "PAID")
      .reduce((sum, a) => sum + a.totalAmount, 0);
    const paidAmount = assignments
      .filter((a) => a.paymentStatus === "PAID")
      .reduce((sum, a) => sum + a.totalAmount, 0);

    return {
      totalProjects: assignments.length,
      totalVideos,
      totalEarnings,
      pendingAmount,
      paidAmount,
    };
  },

  // ── Project Model Assignments ────────────

  findAssignment(projectId: string, modelId: string) {
    return prisma.projectModel.findUnique({
      where: { projectId_modelId: { projectId, modelId } },
      include: { model: true, project: true },
    });
  },

  createAssignment(data: {
    projectId: string;
    modelId: string;
    videosCount: number;
    pricePerVideo: number;
    totalAmount: number;
    script?: string | null;
    notes?: string | null;
  }) {
    return prisma.projectModel.create({
      data,
      include: {
        model: {
          select: { id: true, fullName: true, modelCode: true, phone: true, whatsapp: true, photo: true },
        },
      },
    });
  },

  updateAssignment(id: string, data: {
    videosCount?: number;
    pricePerVideo?: number;
    totalAmount?: number;
    paymentStatus?: string;
    notes?: string | null;
  }) {
    return prisma.projectModel.update({
      where: { id },
      data: data as never,
      include: {
        model: {
          select: { id: true, fullName: true, modelCode: true, phone: true, whatsapp: true, photo: true },
        },
      },
    });
  },

  deleteAssignment(id: string) {
    return prisma.projectModel.delete({ where: { id } });
  },

  findAssignmentsByProject(projectId: string) {
    return prisma.projectModel.findMany({
      where: { projectId },
      include: {
        model: {
          select: { id: true, fullName: true, modelCode: true, phone: true, whatsapp: true, photo: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /** Dashboard stats. */
  async getDashboardStats() {
    const [activeModels, pendingPayments] = await Promise.all([
      prisma.model.count({ where: { status: "ACTIVE" } }),
      prisma.projectModel.count({ where: { paymentStatus: { not: "PAID" } } }),
    ]);

    // Top models by earnings
    const topModelAggregations = await prisma.projectModel.groupBy({
      by: ["modelId"],
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: "desc" } },
      take: 5,
    });

    const topModelIds = topModelAggregations.map((t) => t.modelId);
    const topModelsData = await prisma.model.findMany({
      where: { id: { in: topModelIds } },
      select: { id: true, modelCode: true, fullName: true },
    });

    const topModels = topModelAggregations.map((agg) => {
      const model = topModelsData.find((m) => m.id === agg.modelId);
      return {
        id: agg.modelId,
        modelCode: model?.modelCode ?? "",
        fullName: model?.fullName ?? "",
        totalEarnings: agg._sum.totalAmount ?? 0,
        projectCount: 0,
      };
    });

    return {
      activeModels,
      busyToday: 0, // Placeholder — would check assignments created today
      pendingPayments,
      topModels,
    };
  },
};
