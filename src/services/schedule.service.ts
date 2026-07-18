import { prisma } from "@/lib/prisma";
import { shootRepository } from "@/repositories/schedule.repository";
import { activityService } from "@/services/activity.service";
import { timelineService } from "@/services/timeline.service";
import type { ShootStatus } from "@prisma/client";
import type { ConflictResult } from "@/types/schedule";

/* ============================================
   Schedule Service
   ScheduleService + AvailabilityService +
   ConflictDetectionService
   ============================================ */

function formatShootCode(sequence: number): string {
  return `SH-${String(sequence).padStart(6, "0")}`;
}

async function generateUniqueShootCode(): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const latest = await tx.shoot.findFirst({
      orderBy: { shootCode: "desc" },
      select: { shootCode: true },
    });

    let sequence = 1;
    if (latest?.shootCode) {
      const match = latest.shootCode.match(/^SH-(\d+)$/);
      if (match) sequence = parseInt(match[1]!, 10) + 1;
    }

    return formatShootCode(sequence);
  });
}

// ── ConflictDetectionService ────────────────

export const conflictDetectionService = {
  /** Check if a team member has scheduling conflicts. */
  async checkTeamMemberConflict(
    teamMemberId: string,
    startTime: Date,
    endTime: Date,
    excludeShootId?: string
  ): Promise<boolean> {
    const overlapping = await shootRepository.findOverlappingShoots(
      teamMemberId, startTime, endTime, excludeShootId
    );
    return overlapping.length > 0;
  },

  /** Check if a model has scheduling conflicts. */
  async checkModelConflict(
    modelId: string,
    startTime: Date,
    endTime: Date,
    excludeShootId?: string
  ): Promise<boolean> {
    const overlapping = await shootRepository.findOverlappingShootsForModel(
      modelId, startTime, endTime, excludeShootId
    );
    return overlapping.length > 0;
  },

  /** Full conflict check for a shoot with assignments. */
  async checkConflicts(params: {
    startTime: Date;
    endTime: Date;
    teamMemberIds?: string[];
    modelIds?: string[];
    excludeShootId?: string;
  }): Promise<ConflictResult> {
    const conflicts: ConflictResult["conflicts"] = [];

    for (const tmId of params.teamMemberIds ?? []) {
      const hasConflict = await this.checkTeamMemberConflict(
        tmId, params.startTime, params.endTime, params.excludeShootId
      );
      if (hasConflict) {
        const member = await prisma.teamMember.findUnique({
          where: { id: tmId },
          select: { fullName: true },
        });
        conflicts.push({
          type: "team_member",
          id: tmId,
          name: member?.fullName ?? tmId,
          reason: "تعارض في الجدولة — الموظف لديه تصوير آخر في نفس الوقت",
        });
      }
    }

    for (const mId of params.modelIds ?? []) {
      const hasConflict = await this.checkModelConflict(
        mId, params.startTime, params.endTime, params.excludeShootId
      );
      if (hasConflict) {
        const model = await prisma.model.findUnique({
          where: { id: mId },
          select: { fullName: true },
        });
        conflicts.push({
          type: "model",
          id: mId,
          name: model?.fullName ?? mId,
          reason: "تعارض في الجدولة — الموديل لديه تصوير آخر في نفس الوقت",
        });
      }
    }

    return { hasConflict: conflicts.length > 0, conflicts };
  },
};

// ── AvailabilityService ─────────────────────

export const availabilityService = {
  /** Check if a team member is available at a given time. */
  async isTeamMemberAvailable(
    teamMemberId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    return !(await conflictDetectionService.checkTeamMemberConflict(teamMemberId, startTime, endTime));
  },

  /** Check if a model is available at a given time. */
  async isModelAvailable(
    modelId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    return !(await conflictDetectionService.checkModelConflict(modelId, startTime, endTime));
  },

  /** Get all available team members for a time slot. */
  async getAvailableTeamMembers(startTime: Date, endTime: Date) {
    const allMembers = await prisma.teamMember.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, fullName: true, employeeCode: true, role: true, photo: true },
    });

    const available: typeof allMembers = [];
    for (const member of allMembers) {
      const isAvailable = await this.isTeamMemberAvailable(member.id, startTime, endTime);
      if (isAvailable) available.push(member);
    }

    return available;
  },

  /** Get all available models for a time slot. */
  async getAvailableModels(startTime: Date, endTime: Date) {
    const allModels = await prisma.model.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, fullName: true, modelCode: true, photo: true },
    });

    const available: typeof allModels = [];
    for (const model of allModels) {
      const isAvailable = await this.isModelAvailable(model.id, startTime, endTime);
      if (isAvailable) available.push(model);
    }

    return available;
  },
};

// ── ScheduleService ─────────────────────────

export const scheduleService = {
  async getById(id: string) {
    return shootRepository.findById(id);
  },

  async create(
    data: {
      projectId: string;
      title: string;
      description?: string;
      location?: string;
      date: Date;
      startTime: Date;
      endTime: Date;
      notes?: string;
    },
    options?: { actorId?: string; actorName?: string }
  ) {
    const shootCode = await generateUniqueShootCode();

    const shoot = await shootRepository.create({
      shootCode,
      projectId: data.projectId,
      title: data.title.trim(),
      description: data.description || null,
      location: data.location || null,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      status: "SCHEDULED" as ShootStatus,
      notes: data.notes || null,
    });

    // Publish timeline
    await timelineService.publish({
      projectId: data.projectId,
      eventType: "SHOOT_CREATED",
      title: "إنشاء جلسة تصوير",
      description: `${shootCode} — ${data.title}`,
      metadata: { shootId: shoot.id, shootCode, date: data.date.toISOString() },
      actorId: options?.actorId,
      actorName: options?.actorName ?? "النظام",
    });

    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "CREATE",
        entity: "shoot",
        entityId: shoot.id,
        metadata: { shootCode, title: data.title },
      });
    }

    return shoot;
  },

  async update(
    id: string,
    data: {
      title: string;
      description?: string;
      location?: string;
      date: Date;
      startTime: Date;
      endTime: Date;
      status?: ShootStatus;
      notes?: string;
    },
    options?: { actorId?: string; actorName?: string }
  ) {
    const existing = await shootRepository.findById(id);
    const oldStatus = existing?.status;

    const shoot = await shootRepository.update(id, {
      title: data.title.trim(),
      description: data.description || null,
      location: data.location || null,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      notes: data.notes || null,
      ...(data.status ? { status: data.status } : {}),
    });

    // Publish timeline for status changes
    if (data.status && data.status !== oldStatus && shoot.projectId) {
      const eventMap: Record<string, { type: string; title: string }> = {
        CONFIRMED: { type: "SHOOT_CONFIRMED", title: "تأكيد جلسة تصوير" },
        IN_PROGRESS: { type: "SHOOT_STARTED", title: "بدء جلسة تصوير" },
        COMPLETED: { type: "SHOOT_COMPLETED", title: "إكمال جلسة تصوير" },
        CANCELLED: { type: "SHOOT_CANCELLED", title: "إلغاء جلسة تصوير" },
      };

      const eventInfo = eventMap[data.status];
      if (eventInfo) {
        await timelineService.publish({
          projectId: shoot.projectId,
          eventType: eventInfo.type as never,
          title: eventInfo.title,
          description: `${shoot.shootCode} — ${shoot.title}`,
          metadata: { shootId: id, oldStatus, newStatus: data.status },
          actorId: options?.actorId,
          actorName: options?.actorName ?? "النظام",
        });
      }
    } else {
      // Regular update
      await timelineService.publish({
        projectId: shoot.projectId,
        eventType: "SHOOT_UPDATED",
        title: "تحديث جلسة تصوير",
        description: `${shoot.shootCode} — ${shoot.title}`,
        metadata: { shootId: id },
        actorId: options?.actorId,
        actorName: options?.actorName ?? "النظام",
      });
    }

    return shoot;
  },

  async softDelete(id: string, options?: { actorId?: string; actorName?: string }) {
    const shoot = await shootRepository.softDelete(id);

    if (shoot.projectId) {
      await timelineService.publish({
        projectId: shoot.projectId,
        eventType: "SHOOT_CANCELLED",
        title: "إلغاء جلسة تصوير",
        description: `${shoot.shootCode}`,
        metadata: { shootId: id },
        actorId: options?.actorId,
        actorName: options?.actorName ?? "النظام",
      });
    }

    return shoot;
  },

  async delete(id: string, options?: { actorId?: string; actorName?: string }) {
    return this.softDelete(id, options);
  },

  async list(params: {
    search?: string;
    projectId?: string;
    filter?: string;
    sort?: string;
    startDate?: Date;
    endDate?: Date;
    skip?: number;
    take?: number;
  }) {
    return shootRepository.findMany(params);
  },

  // ── Assignments ──────────────────────────

  async assign(
    data: {
      shootId: string;
      teamMemberId?: string;
      modelId?: string;
      role: string;
    },
    options?: { actorId?: string; actorName?: string }
  ) {
    // Check conflicts before assigning
    const shoot = await shootRepository.findById(data.shootId);
    if (!shoot) throw new Error("جلسة التصوير غير موجودة");

    if (data.teamMemberId) {
      const conflict = await conflictDetectionService.checkTeamMemberConflict(
        data.teamMemberId, shoot.startTime, shoot.endTime, data.shootId
      );
      if (conflict) {
        throw new Error("تعارض في الجدولة — الموظف لديه تصوير آخر في نفس الوقت");
      }
    }

    if (data.modelId) {
      const conflict = await conflictDetectionService.checkModelConflict(
        data.modelId, shoot.startTime, shoot.endTime, data.shootId
      );
      if (conflict) {
        throw new Error("تعارض في الجدولة — الموديل لديه تصوير آخر في نفس الوقت");
      }
    }

    const assignment = await shootRepository.createAssignment({
      shootId: data.shootId,
      teamMemberId: data.teamMemberId || null,
      modelId: data.modelId || null,
      role: data.role,
    });

    return assignment;
  },

  async removeAssignment(id: string) {
    return shootRepository.deleteAssignment(id);
  },

  async getAssignments(shootId: string) {
    return shootRepository.findAssignmentsByShoot(shootId);
  },

  // ── Calendar ─────────────────────────────

  async getCalendar(startDate: Date, endDate: Date) {
    return shootRepository.findByDateRange(startDate, endDate);
  },

  async getByDate(date: Date) {
    return shootRepository.findByDate(date);
  },

  async getDashboardStats() {
    return shootRepository.getDashboardStats();
  },
};
