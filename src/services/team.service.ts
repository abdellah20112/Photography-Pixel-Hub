import { prisma } from "@/lib/prisma";
import { teamRepository } from "@/repositories/team.repository";
import { activityService } from "@/services/activity.service";
import { timelineService } from "@/services/timeline.service";
import type { TeamMemberStatus, TeamRole } from "@prisma/client";

/* ============================================
   Team Service
   TeamService + AssignmentService + WorkloadService
   ============================================ */

function formatEmployeeCode(sequence: number): string {
  return `EMP-${String(sequence).padStart(6, "0")}`;
}

async function generateUniqueEmployeeCode(): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const latest = await tx.teamMember.findFirst({
      orderBy: { employeeCode: "desc" },
      select: { employeeCode: true },
    });

    let sequence = 1;
    if (latest?.employeeCode) {
      const match = latest.employeeCode.match(/^EMP-(\d+)$/);
      if (match) sequence = parseInt(match[1]!, 10) + 1;
    }

    return formatEmployeeCode(sequence);
  });
}

export const teamService = {
  async getById(id: string) {
    return teamRepository.findById(id);
  },

  async getByEmail(email: string) {
    return teamRepository.findByEmail(email);
  },

  async create(
    data: {
      fullName: string;
      email: string;
      phone: string;
      photo?: string;
      role: TeamRole;
      status?: TeamMemberStatus;
      joinDate: Date;
      notes?: string;
    },
    options?: { actorId?: string }
  ) {
    // Check email uniqueness
    const existing = await teamRepository.findByEmail(data.email);
    if (existing) {
      throw new Error("البريد الإلكتروني مستخدم بالفعل");
    }

    const employeeCode = await generateUniqueEmployeeCode();

    const member = await teamRepository.create({
      employeeCode,
      fullName: data.fullName.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      photo: data.photo?.trim() || null,
      role: data.role,
      status: data.status ?? ("ACTIVE" as TeamMemberStatus),
      joinDate: data.joinDate,
      notes: data.notes?.trim() || null,
    });

    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "CREATE",
        entity: "team_member",
        entityId: member.id,
        metadata: { employeeCode: member.employeeCode, fullName: member.fullName },
      });
    }

    return member;
  },

  async update(
    id: string,
    data: {
      fullName: string;
      email: string;
      phone: string;
      photo?: string;
      role: TeamRole;
      status: TeamMemberStatus;
      joinDate: Date;
      notes?: string;
    },
    options?: { actorId?: string }
  ) {
    const member = await teamRepository.update(id, {
      fullName: data.fullName.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      photo: data.photo?.trim() || null,
      role: data.role,
      status: data.status,
      joinDate: data.joinDate,
      notes: data.notes?.trim() || null,
    });

    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "UPDATE",
        entity: "team_member",
        entityId: id,
        metadata: { employeeCode: member.employeeCode },
      });
    }

    return member;
  },

  async softDelete(id: string, options?: { actorId?: string }) {
    const member = await teamRepository.softDelete(id);

    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "ARCHIVE",
        entity: "team_member",
        entityId: id,
        metadata: { employeeCode: member.employeeCode },
      });
    }

    return member;
  },

  async restore(id: string, options?: { actorId?: string }) {
    const member = await teamRepository.restore(id);

    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "RESTORE",
        entity: "team_member",
        entityId: id,
        metadata: { employeeCode: member.employeeCode },
      });
    }

    return member;
  },

  async delete(id: string, options?: { actorId?: string }) {
    return this.softDelete(id, options);
  },

  async list(params: {
    search?: string;
    filter?: string;
    roleFilter?: string;
    sort?: string;
    skip?: number;
    take?: number;
  }) {
    return teamRepository.findMany(params);
  },

  async count(filter?: string) {
    if (filter === "active") return teamRepository.count({ status: "ACTIVE" });
    if (filter === "inactive") return teamRepository.count({ status: "INACTIVE" });
    if (filter === "on_leave") return teamRepository.count({ status: "ON_LEAVE" });
    return teamRepository.count();
  },

  // ── AssignmentService ─────────────────────

  async assignToProject(
    data: {
      projectId: string;
      teamMemberId: string;
      role: TeamRole;
      notes?: string;
    },
    options?: { actorId?: string; actorName?: string }
  ) {
    const existing = await teamRepository.findAssignment(data.projectId, data.teamMemberId);
    if (existing) {
      throw new Error("الموظف مُعيّن بالفعل في هذا المشروع");
    }

    const assignment = await teamRepository.createAssignment({
      projectId: data.projectId,
      teamMemberId: data.teamMemberId,
      role: data.role,
      notes: data.notes || null,
    });

    await timelineService.publish({
      projectId: data.projectId,
      eventType: "TEAM_MEMBER_ASSIGNED",
      title: "تعيين موظف",
      description: `${assignment.teamMember.fullName} (${assignment.teamMember.employeeCode}) — ${data.role}`,
      metadata: {
        teamMemberId: data.teamMemberId,
        employeeCode: assignment.teamMember.employeeCode,
        role: data.role,
      },
      actorId: options?.actorId,
      actorName: options?.actorName ?? "النظام",
    });

    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "CREATE",
        entity: "project_assignment",
        entityId: assignment.id,
        metadata: { projectId: data.projectId, teamMemberId: data.teamMemberId },
      });
    }

    return assignment;
  },

  async updateAssignment(
    id: string,
    data: {
      role?: TeamRole;
      notes?: string;
      completed?: boolean;
    },
    options?: { actorId?: string; actorName?: string }
  ) {
    const updateData: { role?: TeamRole; notes?: string | null; completedAt?: Date | null } = {};

    if (data.role !== undefined) updateData.role = data.role;
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (data.completed === true) updateData.completedAt = new Date();
    if (data.completed === false) updateData.completedAt = null;

    const assignment = await teamRepository.updateAssignment(id, updateData as never);

    // If role changed, publish timeline event
    if (data.role !== undefined) {
      // Get projectId — assignment includes teamMember but not project
      const fullAssignment = await prisma.projectAssignment.findUnique({
        where: { id },
        select: { projectId: true },
      });

      if (fullAssignment) {
        await timelineService.publish({
          projectId: fullAssignment.projectId,
          eventType: "TEAM_ROLE_CHANGED",
          title: "تغيير دور الموظف",
          description: `${assignment.teamMember.fullName} — ${data.role}`,
          metadata: { assignmentId: id, newRole: data.role },
          actorId: options?.actorId,
          actorName: options?.actorName ?? "النظام",
        });
      }
    }

    return assignment;
  },

  async removeFromProject(
    id: string,
    options?: { actorId?: string; actorName?: string }
  ) {
    const assignment = await teamRepository.deleteAssignment(id);

    // Need projectId for timeline — fetch before delete
    const fullAssignment = await prisma.projectAssignment.findUnique({
      where: { id },
      select: { projectId: true, teamMemberId: true },
    }).catch(() => null);

    if (fullAssignment) {
      await timelineService.publish({
        projectId: fullAssignment.projectId,
        eventType: "TEAM_MEMBER_REMOVED",
        title: "إزالة موظف",
        description: `تمت إزالة موظف من المشروع`,
        metadata: { assignmentId: id, teamMemberId: fullAssignment.teamMemberId },
        actorId: options?.actorId,
        actorName: options?.actorName ?? "النظام",
      });
    }

    return assignment;
  },

  async getAssignmentsByProject(projectId: string) {
    return teamRepository.findAssignmentsByProject(projectId);
  },

  // ── WorkloadService ────────────────────────

  async getStatistics(memberId: string) {
    return teamRepository.getStatistics(memberId);
  },

  async getDashboardStats() {
    return teamRepository.getDashboardStats();
  },
};
