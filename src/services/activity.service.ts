import { activityRepository } from "@/repositories/activity.repository";
import type { ActivityType, Prisma } from "@prisma/client";

/* ============================================
   Activity Service
   Business logic layer — calls repositories only.
   ============================================ */

export const activityService = {
  async log(data: {
    userId: string;
    type: ActivityType;
    entity: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  }) {
    return activityRepository.create({
      userId: data.userId,
      type: data.type,
      entity: data.entity,
      entityId: data.entityId,
      metadata: (data.metadata as Prisma.InputJsonValue) ?? undefined,
    });
  },

  async list(params: {
    userId?: string;
    type?: ActivityType;
    entity?: string;
    entityId?: string;
    skip?: number;
    take?: number;
  }) {
    const where: Record<string, unknown> = {};
    if (params.userId !== undefined) where.userId = params.userId;
    if (params.type !== undefined) where.type = params.type;
    if (params.entity !== undefined) where.entity = params.entity;
    if (params.entityId !== undefined) where.entityId = params.entityId;

    return activityRepository.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: "desc" },
    });
  },

  async count(params: {
    userId?: string;
    type?: ActivityType;
  }) {
    return activityRepository.count({
      userId: params.userId,
      type: params.type,
    });
  },
};
