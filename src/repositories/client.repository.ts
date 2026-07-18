import { prisma } from "@/lib/prisma";
import type { Prisma, ClientStatus } from "@prisma/client";

/* ============================================
   Client Repository
   The ONLY layer that interacts with Prisma
   for Client operations.
   ============================================ */

export type ClientWithRelations = Prisma.ClientGetPayload<{
  include: {
    projects: true;
    _count: {
      select: {
        projects: true;
        downloads: true;
        views: true;
      };
    };
  };
}>;

export type ClientCreateInput = Prisma.ClientUncheckedCreateInput;
export type ClientUpdateInput = Prisma.ClientUncheckedUpdateInput;
export type ClientWhereInput = Prisma.ClientWhereInput;
export type ClientWhereUniqueInput = Prisma.ClientWhereUniqueInput;

/** Build the WHERE clause for search + filter. */
function buildWhere(params: {
  userId: string;
  search?: string;
  filter?: "all" | "active" | "archived" | "blocked";
}): ClientWhereInput {
  const where: ClientWhereInput = { userId: params.userId };

  // Soft-delete: archived clients excluded from default queries
  if (params.filter === "archived") {
    where.status = "ARCHIVED";
  } else if (params.filter === "active") {
    where.status = "ACTIVE";
  } else if (params.filter === "blocked") {
    where.status = "BLOCKED";
  } else {
    // "all" — exclude archived by default unless explicitly filtered
    where.status = { not: "ARCHIVED" };
  }

  if (params.search) {
    where.OR = [
      { clientCode: { contains: params.search, mode: "insensitive" } },
      { name: { contains: params.search, mode: "insensitive" } },
      { company: { contains: params.search, mode: "insensitive" } },
      { phone: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
    ];
  }

  return where;
}

/** Build the ORDER BY clause for sorting. */
function buildOrderBy(sort: "newest" | "oldest" | "alphabetical") {
  if (sort === "oldest") return { createdAt: "asc" as const };
  if (sort === "alphabetical") return { name: "asc" as const };
  return { createdAt: "desc" as const };
}

export const clientRepository = {
  findById(id: string) {
    return prisma.client.findUnique({
      where: { id },
      include: {
        projects: true,
        _count: {
          select: {
            projects: true,
            downloads: true,
            views: true,
          },
        },
      },
    });
  },

  findByClientCode(clientCode: string) {
    return prisma.client.findUnique({
      where: { clientCode },
      include: { projects: true },
    });
  },

  findByToken(token: string) {
    return prisma.client.findUnique({
      where: { token },
      include: { projects: true },
    });
  },

  findByEmail(userId: string, email: string) {
    return prisma.client.findUnique({
      where: { userId_email: { userId, email } },
    });
  },

  create(data: ClientCreateInput) {
    return prisma.client.create({
      data,
      include: {
        projects: true,
        _count: {
          select: {
            projects: true,
            downloads: true,
            views: true,
          },
        },
      },
    });
  },

  update(id: string, data: ClientUpdateInput) {
    return prisma.client.update({
      where: { id },
      data,
      include: {
        projects: true,
        _count: {
          select: {
            projects: true,
            downloads: true,
            views: true,
          },
        },
      },
    });
  },

  /** Soft delete — set status to ARCHIVED and archivedAt. */
  softDelete(id: string) {
    return prisma.client.update({
      where: { id },
      data: {
        status: "ARCHIVED" as ClientStatus,
        archivedAt: new Date(),
      },
    });
  },

  /** Restore an archived client. */
  restore(id: string) {
    return prisma.client.update({
      where: { id },
      data: {
        status: "ACTIVE" as ClientStatus,
        archivedAt: null,
      },
    });
  },

  /** Hard delete — used only in tests/cleanup, never in production. */
  delete(id: string) {
    return prisma.client.delete({ where: { id } });
  },

  /** Paginated list with search, filter, and sort. */
  async findMany(params: {
    userId: string;
    skip?: number;
    take?: number;
    search?: string;
    filter?: "all" | "active" | "archived" | "blocked";
    sort?: "newest" | "oldest" | "alphabetical";
  }) {
    const where = buildWhere(params);
    const orderBy = buildOrderBy(params.sort ?? "newest");

    const [items, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy,
        include: {
          _count: {
            select: {
              projects: true,
            },
          },
        },
      }),
      prisma.client.count({ where }),
    ]);

    return { items, total };
  },

  count(where?: ClientWhereInput) {
    return prisma.client.count({ where });
  },

  /** Count all clients for code generation. */
  countAll() {
    return prisma.client.count();
  },

  /** Find the latest client code for sequential generation. */
  findLatestClientCode() {
    return prisma.client.findFirst({
      orderBy: { clientCode: "desc" },
      select: { clientCode: true },
    });
  },

  /** Get statistics for a client. */
  async getStatistics(clientId: string) {
    const [projects, downloads, views] = await Promise.all([
      prisma.project.count({ where: { clientId } }),
      prisma.download.count({ where: { clientId } }),
      prisma.view.count({ where: { clientId } }),
    ]);

    // Videos are nested under projects
    const projectIds = await prisma.project.findMany({
      where: { clientId },
      select: { id: true },
    });
    const videos = await prisma.video.count({
      where: { projectId: { in: projectIds.map((p) => p.id) } },
    });

    return { projects, videos, downloads, views };
  },

  /** Export all clients (non-archived) as flat rows for CSV. */
  async findAllForExport(userId: string) {
    return prisma.client.findMany({
      where: {
        userId,
        status: { not: "ARCHIVED" },
      },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { projects: true },
        },
      },
    });
  },
};
