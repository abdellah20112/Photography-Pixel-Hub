import { prisma } from "@/lib/prisma";
import type { Prisma, VideoStatus } from "@prisma/client";

/* ============================================
   Video Repository
   The ONLY layer that interacts with Prisma
   for Video operations.
   ============================================ */

export type VideoWithRelations = Prisma.VideoGetPayload<{
  include: { project: true; downloads: true; views: true };
}>;

export type VideoCreateInput = Prisma.VideoUncheckedCreateInput;
export type VideoUpdateInput = Prisma.VideoUncheckedUpdateInput;
export type VideoWhereInput = Prisma.VideoWhereInput;
export type VideoWhereUniqueInput = Prisma.VideoWhereUniqueInput;

/** Map filter values to Prisma status conditions. */
function statusFromFilter(
  filter: string
): Prisma.VideoWhereInput["status"] | undefined {
  const map: Record<string, string> = {
    ready: "READY",
    processing: "PROCESSING",
    uploading: "UPLOADING",
    failed: "FAILED",
    deleted: "DELETED",
  };
  return map[filter] as Prisma.VideoWhereInput["status"] | undefined;
}

/** Build the WHERE clause for search + filter. */
function buildWhere(params: {
  projectId?: string;
  search?: string;
  filter?: string;
}): VideoWhereInput {
  const where: VideoWhereInput = {};

  // Soft-delete: deleted videos excluded from default queries
  if (params.filter === "deleted") {
    where.status = "DELETED";
  } else if (params.filter && params.filter !== "all") {
    where.status = statusFromFilter(params.filter);
  } else {
    where.status = { not: "DELETED" };
  }

  if (params.projectId) {
    where.projectId = params.projectId;
  }

  if (params.search) {
    where.OR = [
      { videoCode: { contains: params.search, mode: "insensitive" } },
      { title: { contains: params.search, mode: "insensitive" } },
    ];
  }

  return where;
}

/** Build the ORDER BY clause for sorting. */
function buildOrderBy(sort: string): Prisma.VideoOrderByWithRelationInput {
  if (sort === "oldest") return { createdAt: "asc" };
  if (sort === "duration") return { duration: "desc" };
  if (sort === "size") return { fileSize: "desc" };
  return { createdAt: "desc" };
}

export const videoRepository = {
  findById(id: string) {
    return prisma.video.findUnique({
      where: { id },
      include: { project: true, downloads: true, views: true },
    });
  },

  findByVideoCode(videoCode: string) {
    return prisma.video.findUnique({
      where: { videoCode },
      include: { project: true },
    });
  },

  findByStorageKey(storageKey: string) {
    return prisma.video.findUnique({
      where: { storageKey },
      include: { project: true },
    });
  },

  create(data: VideoCreateInput) {
    return prisma.video.create({
      data,
      include: { project: true },
    });
  },

  update(id: string, data: VideoUpdateInput) {
    return prisma.video.update({
      where: { id },
      data,
      include: { project: true },
    });
  },

  /** Soft delete — set status to DELETED and deletedAt. */
  softDelete(id: string) {
    return prisma.video.update({
      where: { id },
      data: {
        status: "DELETED",
        deletedAt: new Date(),
      },
      include: { project: true },
    });
  },

  /** Restore a deleted video. */
  restore(id: string, status: string = "READY") {
    return prisma.video.update({
      where: { id },
      data: {
        status: status as VideoStatus,
        deletedAt: null,
      },
      include: { project: true },
    });
  },

  /** Hard delete — used only in tests/cleanup, never in production. */
  delete(id: string) {
    return prisma.video.delete({ where: { id } });
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
      prisma.video.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy,
        include: {
          project: {
            select: { id: true, name: true, projectCode: true },
          },
        },
      }),
      prisma.video.count({ where }),
    ]);

    return { items, total };
  },

  count(where?: VideoWhereInput) {
    return prisma.video.count({ where });
  },

  /** Find the latest video code for sequential generation. */
  findLatestVideoCode() {
    return prisma.video.findFirst({
      orderBy: { videoCode: "desc" },
      select: { videoCode: true },
    });
  },

  /** Get statistics for a video. */
  async getStatistics(videoId: string) {
    const [views, downloads] = await Promise.all([
      prisma.view.count({ where: { videoId } }),
      prisma.download.count({ where: { videoId } }),
    ]);

    return { views, downloads };
  },

  /** Export all non-deleted videos as flat rows for CSV. */
  async findAllForExport(projectId?: string) {
    return prisma.video.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        status: { not: "DELETED" },
      },
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: { name: true, projectCode: true },
        },
      },
    });
  },
};
