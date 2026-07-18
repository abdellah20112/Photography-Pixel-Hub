import { prisma } from "@/lib/prisma";
import type { Prisma, DeliveryStatus } from "@prisma/client";

/* ============================================
   Delivery Repository
   The ONLY layer that interacts with Prisma
   for Delivery operations.
   ============================================ */

export type DeliveryWithRelations = Prisma.DeliveryGetPayload<{
  include: {
    project: true;
    videos: { include: { video: true } };
  };
}>;

export type DeliveryCreateInput = Prisma.DeliveryUncheckedCreateInput;
export type DeliveryUpdateInput = Prisma.DeliveryUncheckedUpdateInput;
export type DeliveryWhereInput = Prisma.DeliveryWhereInput;
export type DeliveryWhereUniqueInput = Prisma.DeliveryWhereUniqueInput;

/** Map filter values to Prisma status conditions. */
function statusFromFilter(
  filter: string
): DeliveryStatus | undefined {
  const map: Record<string, DeliveryStatus> = {
    active: "ACTIVE",
    expired: "EXPIRED",
    disabled: "DISABLED",
  };
  return map[filter];
}

/** Build the WHERE clause for search + filter. */
function buildWhere(params: {
  projectId?: string;
  search?: string;
  filter?: string;
}): DeliveryWhereInput {
  const where: DeliveryWhereInput = {};

  if (params.filter && params.filter !== "all") {
    where.status = statusFromFilter(params.filter);
  }

  if (params.projectId) {
    where.projectId = params.projectId;
  }

  if (params.search) {
    where.OR = [
      { deliveryCode: { contains: params.search, mode: "insensitive" } },
      { title: { contains: params.search, mode: "insensitive" } },
      { project: { name: { contains: params.search, mode: "insensitive" } } },
    ];
  }

  return where;
}

/** Build the ORDER BY clause for sorting. */
function buildOrderBy(sort: string): Prisma.DeliveryOrderByWithRelationInput {
  if (sort === "oldest") return { createdAt: "asc" };
  if (sort === "alphabetical") return { title: "asc" };
  return { createdAt: "desc" };
}

export const deliveryRepository = {
  findById(id: string) {
    return prisma.delivery.findUnique({
      where: { id },
      include: {
        project: true,
        videos: {
          include: { video: true },
          orderBy: { order: "asc" },
        },
      },
    });
  },

  findBySlug(slug: string) {
    return prisma.delivery.findUnique({
      where: { slug },
      include: {
        project: true,
        videos: {
          include: { video: true },
          orderBy: { order: "asc" },
        },
      },
    });
  },

  findByDeliveryCode(deliveryCode: string) {
    return prisma.delivery.findUnique({
      where: { deliveryCode },
      include: { project: true },
    });
  },

  create(data: DeliveryCreateInput) {
    return prisma.delivery.create({
      data,
      include: {
        project: true,
        videos: { include: { video: true } },
      },
    });
  },

  update(id: string, data: DeliveryUpdateInput) {
    return prisma.delivery.update({
      where: { id },
      data,
      include: {
        project: true,
        videos: { include: { video: true } },
      },
    });
  },

  /** Soft delete — set status to DISABLED. */
  softDelete(id: string) {
    return prisma.delivery.update({
      where: { id },
      data: { status: "DISABLED" as DeliveryStatus },
      include: { project: true },
    });
  },

  /** Restore a disabled delivery. */
  restore(id: string) {
    return prisma.delivery.update({
      where: { id },
      data: { status: "ACTIVE" as DeliveryStatus },
      include: { project: true },
    });
  },

  /** Hard delete — used only in tests/cleanup. */
  delete(id: string) {
    return prisma.delivery.delete({ where: { id } });
  },

  /** Paginated list with search, filter, and sort. */
  async findMany(params: {
    projectId?: string;
    skip?: number;
    take?: number;
    search?: string;
    filter?: string;
    sort?: string;
  }) {
    const where = buildWhere(params);
    const orderBy = buildOrderBy(params.sort ?? "newest");

    const [items, total] = await Promise.all([
      prisma.delivery.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy,
        include: {
          project: {
            select: { id: true, name: true, projectCode: true },
          },
          _count: {
            select: { videos: true },
          },
        },
      }),
      prisma.delivery.count({ where }),
    ]);

    return { items, total };
  },

  count(where?: DeliveryWhereInput) {
    return prisma.delivery.count({ where });
  },

  /** Find the latest delivery code for sequential generation. */
  findLatestDeliveryCode() {
    return prisma.delivery.findFirst({
      orderBy: { deliveryCode: "desc" },
      select: { deliveryCode: true },
    });
  },

  /** Get statistics for a delivery. */
  async getStatistics(deliveryId: string) {
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      select: { viewCount: true, downloadCount: true, lastViewedAt: true },
    });

    const videoCount = await prisma.deliveryVideo.count({
      where: { deliveryId },
    });

    return {
      views: delivery?.viewCount ?? 0,
      downloads: delivery?.downloadCount ?? 0,
      videos: videoCount,
      lastViewedAt: delivery?.lastViewedAt ?? null,
    };
  },

  /** Increment view count and update lastViewedAt. */
  incrementViewCount(id: string) {
    return prisma.delivery.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date(),
      },
    });
  },

  /** Increment download count. */
  incrementDownloadCount(id: string) {
    return prisma.delivery.update({
      where: { id },
      data: {
        downloadCount: { increment: 1 },
      },
    });
  },

  /** Set delivery videos (replace all). */
  async setVideos(deliveryId: string, videoIds: string[]) {
    await prisma.deliveryVideo.deleteMany({ where: { deliveryId } });

    if (videoIds.length > 0) {
      await prisma.deliveryVideo.createMany({
        data: videoIds.map((videoId, index) => ({
          deliveryId,
          videoId,
          order: index,
        })),
      });
    }

    return prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        videos: {
          include: { video: true },
          orderBy: { order: "asc" },
        },
      },
    });
  },
};
