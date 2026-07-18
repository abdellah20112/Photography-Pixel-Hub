import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/* ============================================
   Activity Log Repository
   The ONLY layer that interacts with Prisma
   for ActivityLog operations.
   ============================================ */

export type ActivityLogWithRelations = Prisma.ActivityLogGetPayload<{
  include: { user: true };
}>;

export type ActivityLogCreateInput = Prisma.ActivityLogUncheckedCreateInput;
export type ActivityLogWhereInput = Prisma.ActivityLogWhereInput;
export type ActivityLogWhereUniqueInput = Prisma.ActivityLogWhereUniqueInput;

export const activityRepository = {
  findById(id: string) {
    return prisma.activityLog.findUnique({
      where: { id },
      include: { user: true },
    });
  },

  create(data: ActivityLogCreateInput) {
    return prisma.activityLog.create({ data });
  },

  findMany(params: {
    where?: ActivityLogWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.ActivityLogOrderByWithRelationInput;
  }) {
    return prisma.activityLog.findMany(params);
  },

  count(where?: ActivityLogWhereInput) {
    return prisma.activityLog.count({ where });
  },
};
