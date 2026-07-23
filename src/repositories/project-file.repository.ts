import { prisma } from "@/lib/prisma";
import type { Prisma, ProjectFileType } from "@prisma/client";

/* ============================================
   ProjectFile Repository
   The ONLY layer that interacts with Prisma
   for ProjectFile operations.
   ============================================ */

export type ProjectFileWithRelations = Prisma.ProjectFileGetPayload<{
  include: { project: true };
}>;

export type ProjectFileCreateInput = Prisma.ProjectFileUncheckedCreateInput;
export type ProjectFileWhereInput = Prisma.ProjectFileWhereInput;

export const projectFileRepository = {
  findById(id: string) {
    return prisma.projectFile.findUnique({
      where: { id },
      include: { project: { select: { id: true, name: true, projectCode: true } } },
    });
  },

  create(data: ProjectFileCreateInput) {
    return prisma.projectFile.create({
      data,
      include: { project: { select: { id: true, name: true, projectCode: true } } },
    });
  },

  update(id: string, data: Partial<ProjectFileCreateInput>) {
    return prisma.projectFile.update({
      where: { id },
      data,
      include: { project: { select: { id: true, name: true, projectCode: true } } },
    });
  },

  delete(id: string) {
    return prisma.projectFile.delete({ where: { id } });
  },

  async findMany(params: {
    where?: ProjectFileWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.ProjectFileOrderByWithRelationInput;
  }) {
    const [items, total] = await Promise.all([
      prisma.projectFile.findMany({
        where: params.where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy ?? { createdAt: "desc" },
      }),
      prisma.projectFile.count({ where: params.where }),
    ]);
    return { items, total };
  },

  count(where?: ProjectFileWhereInput) {
    return prisma.projectFile.count({ where });
  },

  findByProject(projectId: string) {
    return prisma.projectFile.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
  },

  findByProjectAndType(projectId: string, fileType: ProjectFileType) {
    return prisma.projectFile.findMany({
      where: { projectId, fileType },
      orderBy: { createdAt: "desc" },
    });
  },
};
