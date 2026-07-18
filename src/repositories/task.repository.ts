import { prisma } from "@/lib/prisma";
import type { Prisma, TaskStatus, TaskPriority } from "@prisma/client";

/* ============================================
   Task Repository
   ============================================ */

export type TaskWithRelations = Prisma.TaskGetPayload<{
  include: {
    project: true;
    assignee: true;
    checklists: true;
    comments: { include: { author: true } };
    subtasks: true;
  };
}>;

export type TaskCreateInput = Prisma.TaskUncheckedCreateInput;
export type TaskUpdateInput = Prisma.TaskUncheckedUpdateInput;
export type TaskWhereInput = Prisma.TaskWhereInput;

function buildWhere(params: {
  search?: string;
  projectId?: string;
  shootId?: string;
  assignedTo?: string;
  status?: string;
  priority?: string;
}): TaskWhereInput {
  const where: TaskWhereInput = { parentTaskId: null };

  if (params.status && params.status !== "all") {
    const map: Record<string, string> = {
      todo: "TODO", in_progress: "IN_PROGRESS", in_review: "IN_REVIEW",
      blocked: "BLOCKED", done: "DONE",
    };
    if (map[params.status]) where.status = map[params.status] as TaskStatus;
  }

  if (params.priority) where.priority = params.priority as TaskPriority;
  if (params.projectId) where.projectId = params.projectId;
  if (params.shootId) where.shootId = params.shootId;
  if (params.assignedTo) where.assignedTo = params.assignedTo;

  if (params.search) {
    where.OR = [
      { taskCode: { contains: params.search, mode: "insensitive" } },
      { title: { contains: params.search, mode: "insensitive" } },
      { project: { name: { contains: params.search, mode: "insensitive" } } },
      { assignee: { fullName: { contains: params.search, mode: "insensitive" } } },
    ];
  }

  return where;
}

function buildOrderBy(sort: string): Prisma.TaskOrderByWithRelationInput {
  if (sort === "oldest") return { createdAt: "asc" };
  if (sort === "due_date") return { dueDate: "asc" };
  if (sort === "priority") return { priority: "desc" };
  if (sort === "alphabetical") return { title: "asc" };
  return { createdAt: "desc" };
}

export const taskRepository = {
  findById(id: string) {
    return prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, projectCode: true } },
        assignee: { select: { id: true, fullName: true, employeeCode: true } },
        checklists: { orderBy: { order: "asc" } },
        comments: {
          include: { author: { select: { id: true, fullName: true } } },
          orderBy: { createdAt: "asc" },
        },
        subtasks: { orderBy: { order: "asc" } },
      },
    });
  },

  findByTaskCode(code: string) {
    return prisma.task.findUnique({ where: { taskCode: code } });
  },

  create(data: TaskCreateInput) {
    return prisma.task.create({
      data,
      include: {
        project: { select: { id: true, name: true, projectCode: true } },
        assignee: { select: { id: true, fullName: true, employeeCode: true } },
      },
    });
  },

  update(id: string, data: TaskUpdateInput) {
    return prisma.task.update({
      where: { id },
      data,
      include: {
        project: { select: { id: true, name: true, projectCode: true } },
        assignee: { select: { id: true, fullName: true, employeeCode: true } },
        checklists: { orderBy: { order: "asc" } },
      },
    });
  },

  softDelete(id: string) {
    return prisma.task.update({
      where: { id },
      data: { status: "DONE" as TaskStatus, completedAt: new Date(), progress: 100 },
    });
  },

  delete(id: string) {
    return prisma.task.delete({ where: { id } });
  },

  async findMany(params: {
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
    const where = buildWhere(params);
    const orderBy = buildOrderBy(params.sort ?? "newest");

    const [items, total] = await Promise.all([
      prisma.task.findMany({
        where, skip: params.skip, take: params.take, orderBy,
        include: {
          assignee: { select: { id: true, fullName: true, employeeCode: true } },
          _count: { select: { checklists: true, subtasks: true } },
        },
      }),
      prisma.task.count({ where }),
    ]);

    // Get checklist completed counts
    const tasksWithChecklist = await Promise.all(
      items.map(async (task) => {
        const completed = await prisma.taskChecklist.count({
          where: { taskId: task.id, completed: true },
        });
        return { ...task, checklistCompleted: completed };
      })
    );

    return { items: tasksWithChecklist, total };
  },

  /** Get tasks grouped by status for Kanban. */
  async findKanban(params: {
    projectId?: string;
    shootId?: string;
    assignedTo?: string;
  }) {
    const where: TaskWhereInput = { parentTaskId: null };
    if (params.projectId) where.projectId = params.projectId;
    if (params.shootId) where.shootId = params.shootId;
    if (params.assignedTo) where.assignedTo = params.assignedTo;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { order: "asc" },
      include: {
        assignee: { select: { id: true, fullName: true, employeeCode: true } },
        _count: { select: { checklists: true, subtasks: true } },
      },
    });

    const statuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
    return statuses.map((status) => ({
      status,
      tasks: tasks.filter((t) => t.status === status),
    }));
  },

  count(where?: TaskWhereInput) {
    return prisma.task.count({ where });
  },

  findLatestTaskCode() {
    return prisma.task.findFirst({
      orderBy: { taskCode: "desc" },
      select: { taskCode: true },
    });
  },

  // ── Checklist ────────────────────────────

  createChecklistItem(data: { taskId: string; title: string; order: number }) {
    return prisma.taskChecklist.create({ data });
  },

  updateChecklistItem(id: string, data: { title?: string; completed?: boolean; order?: number }) {
    return prisma.taskChecklist.update({ where: { id }, data });
  },

  deleteChecklistItem(id: string) {
    return prisma.taskChecklist.delete({ where: { id } });
  },

  findChecklistByTask(taskId: string) {
    return prisma.taskChecklist.findMany({
      where: { taskId },
      orderBy: { order: "asc" },
    });
  },

  // ── Comments ─────────────────────────────

  createComment(data: { taskId: string; authorId: string; content: string }) {
    return prisma.taskComment.create({
      data,
      include: { author: { select: { id: true, fullName: true } } },
    });
  },

  findCommentsByTask(taskId: string) {
    return prisma.taskComment.findMany({
      where: { taskId },
      include: { author: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: "asc" },
    });
  },

  // ── Statistics ───────────────────────────

  async getDashboardStats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    const [today, overdue, review, completedToday] = await Promise.all([
      prisma.task.count({
        where: { dueDate: { gte: startOfToday, lt: endOfToday }, status: { not: "DONE" } },
      }),
      prisma.task.count({
        where: { dueDate: { lt: now }, status: { notIn: ["DONE", "BLOCKED"] } },
      }),
      prisma.task.count({ where: { status: "IN_REVIEW" } }),
      prisma.task.count({
        where: { status: "DONE", completedAt: { gte: startOfToday } },
      }),
    ]);

    return { tasksToday: today, overdueTasks: overdue, reviewTasks: review, completedToday };
  },

  async getTeamMemberStats(teamMemberId: string) {
    const [assigned, completed, overdue] = await Promise.all([
      prisma.task.count({ where: { assignedTo: teamMemberId, status: { not: "DONE" } } }),
      prisma.task.count({ where: { assignedTo: teamMemberId, status: "DONE" } }),
      prisma.task.count({
        where: { assignedTo: teamMemberId, dueDate: { lt: new Date() }, status: { notIn: ["DONE", "BLOCKED"] } },
      }),
    ]);

    return { assigned, completed, overdue };
  },
};
