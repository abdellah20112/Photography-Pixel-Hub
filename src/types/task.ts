import type { Task, TaskChecklist, TaskComment, TeamMember, Project } from "@prisma/client";

/* ============================================
   Task Types
   ============================================ */

export type TaskTableRow = {
  id: string;
  taskCode: string;
  projectId: string;
  shootId: string | null;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  status: Task["status"];
  priority: Task["priority"];
  assignedTo: string | null;
  estimatedHours: number;
  actualHours: number;
  startDate: Date | null;
  dueDate: Date;
  completedAt: Date | null;
  progress: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  assignee: { id: string; fullName: string; employeeCode: string } | null;
  checklistCount: number;
  checklistCompleted: number;
  subtaskCount: number;
};

export type TaskWithRelations = Task & {
  project: Pick<Project, "id" | "name" | "projectCode">;
  assignee: Pick<TeamMember, "id" | "fullName" | "employeeCode"> | null;
  checklists: TaskChecklist[];
  comments: (TaskComment & { author: Pick<TeamMember, "id" | "fullName"> })[];
  subtasks: Task[];
};

export type KanbanColumn = {
  status: Task["status"];
  title: string;
  tasks: TaskTableRow[];
};

export type TaskDashboardStats = {
  tasksToday: number;
  overdueTasks: number;
  reviewTasks: number;
  completedToday: number;
};

export type TaskProgressInfo = {
  progress: number;
  completedPercent: number;
  remainingPercent: number;
  checklistTotal: number;
  checklistCompleted: number;
};
