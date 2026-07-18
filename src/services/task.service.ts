import { prisma } from "@/lib/prisma";
import { taskRepository } from "@/repositories/task.repository";
import { activityService } from "@/services/activity.service";
import { timelineService } from "@/services/timeline.service";
import type { TaskStatus } from "@prisma/client";

/* ============================================
   Task Services
   TaskService + TaskProgressService +
   TaskStatisticsService
   ============================================ */

function formatTaskCode(sequence: number): string {
  return `TSK-${String(sequence).padStart(6, "0")}`;
}

async function generateUniqueTaskCode(): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const latest = await tx.task.findFirst({
      orderBy: { taskCode: "desc" },
      select: { taskCode: true },
    });

    let sequence = 1;
    if (latest?.taskCode) {
      const match = latest.taskCode.match(/^TSK-(\d+)$/);
      if (match) sequence = parseInt(match[1]!, 10) + 1;
    }

    return formatTaskCode(sequence);
  });
}

// ── TaskProgressService ─────────────────────

export const taskProgressService = {
  /** Calculate progress from checklist completion. */
  calculateProgress(checklistTotal: number, checklistCompleted: number): number {
    if (checklistTotal === 0) return 0;
    return Math.round((checklistCompleted / checklistTotal) * 100);
  },

  /** Get full progress info for a task. */
  async getProgress(taskId: string) {
    const task = await taskRepository.findById(taskId);
    if (!task) return null;

    const checklistTotal = task.checklists.length;
    const checklistCompleted = task.checklists.filter((c) => c.completed).length;
    const progress = this.calculateProgress(checklistTotal, checklistCompleted);

    return {
      progress,
      completedPercent: progress,
      remainingPercent: 100 - progress,
      checklistTotal,
      checklistCompleted,
    };
  },

  /** Update task progress after checklist change. */
  async updateProgress(taskId: string) {
    const progressInfo = await this.getProgress(taskId);
    if (!progressInfo) return;

    const updateData: { progress: number; status?: TaskStatus; completedAt?: Date } = {
      progress: progressInfo.progress,
    };

    if (progressInfo.progress === 100) {
      updateData.status = "DONE";
      updateData.completedAt = new Date();
    }

    await taskRepository.update(taskId, updateData as never);
  },
};

// ── TaskStatisticsService ───────────────────

export const taskStatisticsService = {
  getDashboardStats() {
    return taskRepository.getDashboardStats();
  },

  getTeamMemberStats(teamMemberId: string) {
    return taskRepository.getTeamMemberStats(teamMemberId);
  },
};

// ── TaskService ──────────────────────────────

export const taskService = {
  async getById(id: string) {
    return taskRepository.findById(id);
  },

  async create(
    data: {
      projectId: string;
      shootId?: string;
      parentTaskId?: string;
      title: string;
      description?: string;
      priority?: string;
      assignedTo?: string;
      estimatedHours?: number;
      startDate?: Date;
      dueDate: Date;
    },
    options?: { actorId?: string; actorName?: string }
  ) {
    const taskCode = await generateUniqueTaskCode();

    const task = await taskRepository.create({
      taskCode,
      projectId: data.projectId,
      shootId: data.shootId || null,
      parentTaskId: data.parentTaskId || null,
      title: data.title.trim(),
      description: data.description || null,
      status: "TODO" as TaskStatus,
      priority: (data.priority ?? "MEDIUM") as never,
      assignedTo: data.assignedTo || null,
      estimatedHours: data.estimatedHours ?? 0,
      actualHours: 0,
      startDate: data.startDate || null,
      dueDate: data.dueDate,
      completedAt: null,
      progress: 0,
      order: 0,
    });

    // Publish timeline
    await timelineService.publish({
      projectId: data.projectId,
      eventType: "TASK_CREATED",
      title: "إنشاء مهمة",
      description: `${taskCode} — ${data.title}`,
      metadata: { taskId: task.id, taskCode },
      actorId: options?.actorId,
      actorName: options?.actorName ?? "النظام",
    });

    // If assigned, publish TASK_ASSIGNED
    if (data.assignedTo) {
      await timelineService.publish({
        projectId: data.projectId,
        eventType: "TASK_ASSIGNED",
        title: "تعيين مهمة",
        description: `${taskCode} — ${data.title}`,
        metadata: { taskId: task.id, assignedTo: data.assignedTo },
        actorId: options?.actorId,
        actorName: options?.actorName ?? "النظام",
      });
    }

    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "CREATE",
        entity: "task",
        entityId: task.id,
        metadata: { taskCode, title: data.title },
      });
    }

    return task;
  },

  async update(
    id: string,
    data: {
      title: string;
      description?: string;
      status?: TaskStatus;
      priority?: string;
      assignedTo?: string;
      estimatedHours?: number;
      actualHours?: number;
      startDate?: Date;
      dueDate: Date;
      progress?: number;
      order?: number;
    },
    options?: { actorId?: string; actorName?: string }
  ) {
    const existing = await taskRepository.findById(id);
    const oldStatus = existing?.status;

    const updateData: Record<string, unknown> = {
      title: data.title.trim(),
      description: data.description || null,
      dueDate: data.dueDate,
    };

    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo || null;
    if (data.estimatedHours !== undefined) updateData.estimatedHours = data.estimatedHours;
    if (data.actualHours !== undefined) updateData.actualHours = data.actualHours;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.progress !== undefined) updateData.progress = data.progress;
    if (data.order !== undefined) updateData.order = data.order;

    if (data.status === "DONE") {
      updateData.completedAt = new Date();
      updateData.progress = 100;
    }

    const task = await taskRepository.update(id, updateData as never);

    // Publish timeline for status changes
    if (data.status && data.status !== oldStatus && task.projectId) {
      const eventMap: Record<string, { type: string; title: string }> = {
        IN_PROGRESS: { type: "TASK_STARTED", title: "بدء مهمة" },
        DONE: { type: "TASK_COMPLETED", title: "إكمال مهمة" },
      };

      const eventInfo = eventMap[data.status as string];
      if (eventInfo) {
        await timelineService.publish({
          projectId: task.projectId,
          eventType: eventInfo.type as never,
          title: eventInfo.title,
          description: `${task.taskCode} — ${task.title}`,
          metadata: { taskId: id, oldStatus, newStatus: data.status },
          actorId: options?.actorId,
          actorName: options?.actorName ?? "النظام",
        });
      }

      // Check if assignedTo changed
      if (data.assignedTo && data.assignedTo !== existing?.assignedTo) {
        await timelineService.publish({
          projectId: task.projectId,
          eventType: "TASK_ASSIGNED",
          title: "تعيين مهمة",
          description: `${task.taskCode} — ${task.title}`,
          metadata: { taskId: id, assignedTo: data.assignedTo },
          actorId: options?.actorId,
          actorName: options?.actorName ?? "النظام",
        });
      }
    } else {
      // Regular update
      await timelineService.publish({
        projectId: task.projectId,
        eventType: "TASK_UPDATED",
        title: "تحديث مهمة",
        description: `${task.taskCode} — ${task.title}`,
        metadata: { taskId: id },
        actorId: options?.actorId,
        actorName: options?.actorName ?? "النظام",
      });
    }

    return task;
  },

  /** Move task to a new status (Kanban drag & drop). */
  async move(id: string, status: TaskStatus, order: number, options?: { actorId?: string; actorName?: string }) {
    const existing = await taskRepository.findById(id);
    const oldStatus = existing?.status;

    const updateData: Record<string, unknown> = { status, order };
    if (status === "DONE") {
      updateData.completedAt = new Date();
      updateData.progress = 100;
    } else if (oldStatus === "DONE") {
      updateData.completedAt = null;
    }

    const task = await taskRepository.update(id, updateData as never);

    // Publish timeline for status change
    if (status !== oldStatus && task.projectId) {
      const eventMap: Record<string, { type: string; title: string }> = {
        IN_PROGRESS: { type: "TASK_STARTED", title: "بدء مهمة" },
        DONE: { type: "TASK_COMPLETED", title: "إكمال مهمة" },
      };

      const eventInfo = eventMap[status];
      if (eventInfo) {
        await timelineService.publish({
          projectId: task.projectId,
          eventType: eventInfo.type as never,
          title: eventInfo.title,
          description: `${task.taskCode} — ${task.title}`,
          metadata: { taskId: id, oldStatus, newStatus: status },
          actorId: options?.actorId,
          actorName: options?.actorName ?? "النظام",
        });
      }
    }

    return task;
  },

  async softDelete(id: string, options?: { actorId?: string; actorName?: string }) {
    const task = await taskRepository.softDelete(id);
    return task;
  },

  async delete(id: string, options?: { actorId?: string; actorName?: string }) {
    return this.softDelete(id, options);
  },

  async list(params: {
    search?: string;
    projectId?: string;
    shootId?: string;
    assignedTo?: string;
    status?: string;
    priority?: string;
    sort?: string;
    skip?: number;
    take?: number;
  }) {
    return taskRepository.findMany(params);
  },

  async getKanban(params: { projectId?: string; shootId?: string; assignedTo?: string }) {
    return taskRepository.findKanban(params);
  },

  // ── Checklist ────────────────────────────

  async addChecklistItem(taskId: string, title: string, order: number) {
    const item = await taskRepository.createChecklistItem({ taskId, title, order });
    await taskProgressService.updateProgress(taskId);
    return item;
  },

  async updateChecklistItem(id: string, data: { title?: string; completed?: boolean; order?: number }) {
    const item = await taskRepository.updateChecklistItem(id, data);
    // Need to update task progress — find taskId from the item
    const fullItem = await prisma.taskChecklist.findUnique({ where: { id }, select: { taskId: true } });
    if (fullItem) {
      await taskProgressService.updateProgress(fullItem.taskId);
    }
    return item;
  },

  async deleteChecklistItem(id: string) {
    const fullItem = await prisma.taskChecklist.findUnique({ where: { id }, select: { taskId: true } });
    const result = await taskRepository.deleteChecklistItem(id);
    if (fullItem) {
      await taskProgressService.updateProgress(fullItem.taskId);
    }
    return result;
  },

  // ── Comments ─────────────────────────────

  async addComment(taskId: string, authorId: string, content: string, options?: { actorId?: string; actorName?: string }) {
    const comment = await taskRepository.createComment({ taskId, authorId, content });

    // Publish timeline
    const task = await taskRepository.findById(taskId);
    if (task?.projectId) {
      await timelineService.publish({
        projectId: task.projectId,
        eventType: "COMMENT_ADDED",
        title: "تعليق على مهمة",
        description: `${task.taskCode} — ${task.title}`,
        metadata: { taskId, commentId: comment.id },
        actorId: options?.actorId,
        actorName: options?.actorName ?? "النظام",
      });
    }

    return comment;
  },

  async getComments(taskId: string) {
    return taskRepository.findCommentsByTask(taskId);
  },
};
