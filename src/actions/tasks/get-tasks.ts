"use server";

import { taskService, taskStatisticsService } from "@/services/task.service";
import { getCurrentUser } from "@/lib/auth/session";
import type { TaskFilterValue, TaskSortValue, TaskPriorityValue } from "@/lib/validations/task";

export async function getTasksAction(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  projectId?: string;
  shootId?: string;
  assignedTo?: string;
  status?: TaskFilterValue;
  priority?: TaskPriorityValue;
  sort?: TaskSortValue;
}) {
  const user = await getCurrentUser();
  if (!user) return { items: [], total: 0, page: 1, pageSize: 25, totalPages: 0 };

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 25;
  const skip = (page - 1) * pageSize;

  const { items, total } = await taskService.list({
    search: params?.search,
    projectId: params?.projectId,
    shootId: params?.shootId,
    assignedTo: params?.assignedTo,
    status: params?.status,
    priority: params?.priority,
    sort: params?.sort,
    skip,
    take: pageSize,
  });

  const totalPages = Math.ceil(total / pageSize);

  return {
    items: items.map((t) => ({
      id: t.id,
      taskCode: t.taskCode,
      projectId: t.projectId,
      shootId: t.shootId,
      parentTaskId: t.parentTaskId,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      assignedTo: t.assignedTo,
      estimatedHours: t.estimatedHours,
      actualHours: t.actualHours,
      startDate: t.startDate,
      dueDate: t.dueDate,
      completedAt: t.completedAt,
      progress: t.progress,
      order: t.order,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      assignee: t.assignee,
      checklistCount: t._count.checklists,
      checklistCompleted: "checklistCompleted" in t ? (t as { checklistCompleted: number }).checklistCompleted : 0,
      subtaskCount: t._count.subtasks,
    })),
    total, page, pageSize, totalPages,
  };
}

export async function getKanbanAction(params?: {
  projectId?: string;
  shootId?: string;
  assignedTo?: string;
}) {
  const user = await getCurrentUser();
  if (!user) return [];

  return taskService.getKanban({ projectId: params?.projectId, shootId: params?.shootId, assignedTo: params?.assignedTo });
}

export async function getTaskDashboardStatsAction() {
  const user = await getCurrentUser();
  if (!user) return { tasksToday: 0, overdueTasks: 0, reviewTasks: 0, completedToday: 0 };

  return taskStatisticsService.getDashboardStats();
}
