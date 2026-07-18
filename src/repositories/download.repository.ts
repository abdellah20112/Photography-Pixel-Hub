import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/* ============================================
   Download Repository
   The ONLY layer that interacts with Prisma
   for Download operations.
   ============================================ */

export type DownloadWithRelations = Prisma.DownloadGetPayload<{
  include: { video: true; client: true; project: true };
}>;

export type DownloadCreateInput = Prisma.DownloadUncheckedCreateInput;
export type DownloadWhereInput = Prisma.DownloadWhereInput;
export type DownloadWhereUniqueInput = Prisma.DownloadWhereUniqueInput;

export const downloadRepository = {
  findById(id: string) {
    return prisma.download.findUnique({
      where: { id },
      include: { video: true, client: true, project: true },
    });
  },

  create(data: DownloadCreateInput) {
    return prisma.download.create({ data });
  },

  findMany(params: {
    where?: DownloadWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.DownloadOrderByWithRelationInput;
  }) {
    return prisma.download.findMany(params);
  },

  count(where?: DownloadWhereInput) {
    return prisma.download.count({ where });
  },
};
