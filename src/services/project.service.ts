import { prisma } from "@/lib/prisma";
import { projectRepository } from "@/repositories/project.repository";
import { activityService } from "@/services/activity.service";
import { generateToken } from "@/lib/utils";
import type { ProjectStatus, RetentionPeriod } from "@prisma/client";

/* ============================================
   Project Service
   Business logic layer — calls repositories only.
   ============================================ */

/** Format a sequential project code: PR-000001, PR-000002, etc. */
function formatProjectCode(sequence: number): string {
  return `PR-${String(sequence).padStart(6, "0")}`;
}

/** Generate the next unique project code using a transaction. */
async function generateUniqueProjectCode(): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const latest = await tx.project.findFirst({
      orderBy: { projectCode: "desc" },
      select: { projectCode: true },
    });

    let sequence = 1;
    if (latest?.projectCode) {
      const match = latest.projectCode.match(/^PR-(\d+)$/);
      if (match) {
        sequence = parseInt(match[1]!, 10) + 1;
      }
    }

    return formatProjectCode(sequence);
  });
}

/** Convert service input to repository input (trim, normalize). */
function normalizeInput(data: {
  name: string;
  description?: string;
}) {
  return {
    name: data.name.trim(),
    description: data.description?.trim() || null,
  };
}

export const projectService = {
  async getById(id: string) {
    return projectRepository.findById(id);
  },

  async getByProjectCode(projectCode: string) {
    return projectRepository.findByProjectCode(projectCode);
  },

  async getByToken(token: string) {
    return projectRepository.findByToken(token);
  },

  async create(
    data: {
      clientId: string;
      name: string;
      description?: string;
      retentionPeriod: RetentionPeriod;
      deadline: Date;
      status?: ProjectStatus;
    },
    options?: { actorId?: string }
  ) {
    const normalized = normalizeInput(data);
    const projectCode = await generateUniqueProjectCode();
    const token = generateToken(32);

    const project = await projectRepository.create({
      ...normalized,
      clientId: data.clientId,
      projectCode,
      token,
      retentionPeriod: data.retentionPeriod,
      deadline: data.deadline,
      status: data.status ?? ("DRAFT" as ProjectStatus),
    });

    // Activity log: Project Created
    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "CREATE",
        entity: "project",
        entityId: project.id,
        metadata: {
          name: project.name,
          projectCode: project.projectCode,
        },
      });
    }

    return project;
  },

  async update(
    id: string,
    data: {
      clientId?: string;
      name: string;
      description?: string;
      retentionPeriod: RetentionPeriod;
      deadline: Date;
      status: ProjectStatus;
    },
    options?: { actorId?: string }
  ) {
    // Fetch current project to detect retention change
    const current = await projectRepository.findById(id);
    const retentionChanged =
      current && current.retentionPeriod !== data.retentionPeriod;

    const normalized = normalizeInput(data);

    const project = await projectRepository.update(id, {
      ...normalized,
      clientId: data.clientId,
      retentionPeriod: data.retentionPeriod,
      deadline: data.deadline,
      status: data.status,
    });

    // Activity log: Project Updated
    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "UPDATE",
        entity: "project",
        entityId: project.id,
        metadata: {
          name: project.name,
          projectCode: project.projectCode,
        },
      });

      // Activity log: Retention Changed
      if (retentionChanged) {
        await activityService.log({
          userId: options.actorId,
          type: "RETENTION_CHANGE",
          entity: "project",
          entityId: project.id,
          metadata: {
            projectCode: project.projectCode,
            from: current?.retentionPeriod,
            to: data.retentionPeriod,
          },
        });
      }
    }

    return project;
  },

  /** Soft delete — archives the project. */
  async archive(id: string, options?: { actorId?: string }) {
    const project = await projectRepository.softDelete(id);

    // Activity log: Project Archived
    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "ARCHIVE",
        entity: "project",
        entityId: id,
        metadata: {
          name: project.name,
          projectCode: project.projectCode,
        },
      });
    }

    return project;
  },

  /** Restore an archived project. */
  async restore(id: string, options?: { actorId?: string }) {
    const project = await projectRepository.restore(id);

    // Activity log: Project Restored
    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "RESTORE",
        entity: "project",
        entityId: id,
        metadata: {
          name: project.name,
          projectCode: project.projectCode,
        },
      });
    }

    return project;
  },

  /** Soft delete alias for backward compatibility. */
  async delete(id: string, options?: { actorId?: string }) {
    return this.archive(id, options);
  },

  async list(params: {
    clientId?: string;
    skip?: number;
    take?: number;
    search?: string;
    filter?: string;
    sort?: string;
  }) {
    return projectRepository.findMany(params);
  },

  async count(params: { clientId?: string; filter?: string }) {
    if (params.filter === "archived") {
      return projectRepository.count({
        clientId: params.clientId,
        status: "ARCHIVED",
      });
    }
    if (params.filter && params.filter !== "all") {
      const statusMap: Record<string, string> = {
        draft: "DRAFT",
        in_progress: "IN_PROGRESS",
        ready: "READY",
        download_enabled: "DOWNLOAD_ENABLED",
        completed: "COMPLETED",
      };
      const status = statusMap[params.filter];
      if (status) {
        return projectRepository.count({
          clientId: params.clientId,
          status: status as ProjectStatus,
        });
      }
    }
    return projectRepository.count({
      clientId: params.clientId,
      status: { not: "ARCHIVED" },
    });
  },

  async getStatistics(projectId: string) {
    return projectRepository.getStatistics(projectId);
  },

  async getTimeline(projectId: string, take = 20) {
    return activityService.list({
      entity: "project",
      entityId: projectId,
      take,
    });
  },

  /** Export all non-archived projects as CSV rows. */
  async exportCsv(clientId?: string): Promise<string> {
    const projects = await projectRepository.findAllForExport(clientId);

    const headers = [
      "كود المشروع",
      "اسم المشروع",
      "العميل",
      "كود العميل",
      "الحالة",
      "فترة الاحتفاظ",
      "الموعد النهائي",
      "عدد الفيديوهات",
      "تاريخ الإنشاء",
    ];

    const escapeCsv = (value: string | null | undefined): string => {
      if (value == null) return "";
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const retentionLabels: Record<string, string> = {
      TWENTY_FOUR_HOURS: "24 ساعة",
      FORTY_EIGHT_HOURS: "48 ساعة",
      SEVENTY_TWO_HOURS: "72 ساعة",
      SEVEN_DAYS: "7 أيام",
      CUSTOM: "مخصص",
    };

    const rows = projects.map((p) =>
      [
        p.projectCode,
        p.name,
        p.client.name,
        p.client.clientCode,
        p.status,
        retentionLabels[p.retentionPeriod] ?? p.retentionPeriod,
        p.deadline ? p.deadline.toISOString() : "",
        String(p._count.videos),
        p.createdAt.toISOString(),
      ]
        .map(escapeCsv)
        .join(",")
    );

    // Add BOM for Excel UTF-8 detection
    return "\uFEFF" + [headers.map(escapeCsv).join(","), ...rows].join("\n");
  },
};
