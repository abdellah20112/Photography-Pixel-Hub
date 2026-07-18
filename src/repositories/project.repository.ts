import { prisma } from "@/lib/prisma";
import type { Prisma, ProjectStatus } from "@prisma/client";

/* ============================================
   Project Repository
   The ONLY layer that interacts with Prisma
   for Project operations.
   ============================================ */

export type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: { client: true; videos: true };
}>;

export type ProjectCreateInput = Prisma.ProjectUncheckedCreateInput;
export type ProjectUpdateInput = Prisma.ProjectUncheckedUpdateInput;
export type ProjectWhereInput = Prisma.ProjectWhereInput;
export type ProjectWhereUniqueInput = Prisma.ProjectWhereUniqueInput;

/** Map filter values to Prisma status conditions. */
function statusFromFilter(
  filter: string
): Prisma.ProjectWhereInput["status"] | undefined {
  const map: Record<string, string> = {
    draft: "DRAFT",
    in_progress: "IN_PROGRESS",
    ready: "READY",
    download_enabled: "DOWNLOAD_ENABLED",
    completed: "COMPLETED",
    archived: "ARCHIVED",
  };
  return map[filter] as Prisma.ProjectWhereInput["status"] | undefined;
}

/** Build the WHERE clause for search + filter. */
function buildWhere(params: {
  clientId?: string;
  search?: string;
  filter?: string;
}): ProjectWhereInput {
  const where: ProjectWhereInput = {};

  // Soft-delete: archived projects excluded from default queries
  if (params.filter === "archived") {
    where.status = "ARCHIVED";
  } else if (params.filter && params.filter !== "all") {
    where.status = statusFromFilter(params.filter);
  } else {
    // "all" — exclude archived by default
    where.status = { not: "ARCHIVED" };
  }

  if (params.clientId) {
    where.clientId = params.clientId;
  }

  if (params.search) {
    where.OR = [
      { projectCode: { contains: params.search, mode: "insensitive" } },
      { name: { contains: params.search, mode: "insensitive" } },
      { client: { name: { contains: params.search, mode: "insensitive" } } },
    ];
  }

  return where;
}

/** Build the ORDER BY clause for sorting. */
function buildOrderBy(sort: string): Prisma.ProjectOrderByWithRelationInput {
  if (sort === "oldest") return { createdAt: "asc" };
  if (sort === "deadline") return { deadline: "asc" };
  if (sort === "alphabetical") return { name: "asc" };
  return { createdAt: "desc" };
}

export const projectRepository = {
  findById(id: string) {
    return prisma.project.findUnique({
      where: { id },
      include: { client: true, videos: true },
    });
  },

  findByProjectCode(projectCode: string) {
    return prisma.project.findUnique({
      where: { projectCode },
      include: { client: true, videos: true },
    });
  },

  findByToken(token: string) {
    return prisma.project.findUnique({
      where: { token },
      include: { client: true, videos: true },
    });
  },

  create(data: ProjectCreateInput) {
    return prisma.project.create({
      data,
      include: { client: true, videos: true },
    });
  },

  update(id: string, data: ProjectUpdateInput) {
    return prisma.project.update({
      where: { id },
      data,
      include: { client: true, videos: true },
    });
  },

  /** Soft delete — set status to ARCHIVED and archivedAt. */
  softDelete(id: string) {
    return prisma.project.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date(),
      },
      include: { client: true },
    });
  },

  /** Restore an archived project. */
  restore(id: string, status: string = "DRAFT") {
    return prisma.project.update({
      where: { id },
      data: {
        status: status as ProjectStatus,
        archivedAt: null,
      },
      include: { client: true },
    });
  },

  /** Hard delete — used only in tests/cleanup, never in production. */
  delete(id: string) {
    return prisma.project.delete({ where: { id } });
  },

  /** Paginated list with search, filter, and sort. */
  async findMany(params: {
    clientId?: string;
    skip?: number;
    take?: number;
    search?: string;
    filter?: string;
    sort?: string;
  }) {
    const where = buildWhere(params);
    const orderBy = buildOrderBy(params.sort ?? "newest");

    const [items, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy,
        include: {
          client: {
            select: { id: true, name: true, clientCode: true },
          },
          _count: {
            select: { videos: true },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return { items, total };
  },

  count(where?: ProjectWhereInput) {
    return prisma.project.count({ where });
  },

  /** Find the latest project code for sequential generation. */
  findLatestProjectCode() {
    return prisma.project.findFirst({
      orderBy: { projectCode: "desc" },
      select: { projectCode: true },
    });
  },

  /** Get statistics for a project. */
  async getStatistics(projectId: string) {
    const [videos, views, downloads] = await Promise.all([
      prisma.video.findMany({
        where: { projectId },
        select: { fileSize: true },
      }),
      prisma.view.count({ where: { projectId } }),
      prisma.download.count({ where: { projectId } }),
    ]);

    const storageSize = videos.reduce((sum, v) => sum + Number(v.fileSize), 0);

    return {
      videos: videos.length,
      views,
      downloads,
      storageSize,
    };
  },

  /** Export all non-archived projects as flat rows for CSV. */
  async findAllForExport(clientId?: string) {
    return prisma.project.findMany({
      where: {
        ...(clientId ? { clientId } : {}),
        status: { not: "ARCHIVED" },
      },
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          select: { name: true, clientCode: true },
        },
        _count: {
          select: { videos: true },
        },
      },
    });
  },
};
