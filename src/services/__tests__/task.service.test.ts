import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/repositories/task.repository", () => ({
  taskRepository: {
    findById: vi.fn(),
    findByTaskCode: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
    findKanban: vi.fn(),
    count: vi.fn(),
    findLatestTaskCode: vi.fn(),
    createChecklistItem: vi.fn(),
    updateChecklistItem: vi.fn(),
    deleteChecklistItem: vi.fn(),
    findChecklistByTask: vi.fn(),
    createComment: vi.fn(),
    findCommentsByTask: vi.fn(),
    getDashboardStats: vi.fn(),
    getTeamMemberStats: vi.fn(),
  },
}));

vi.mock("@/services/activity.service", () => ({
  activityService: { log: vi.fn().mockResolvedValue(undefined), list: vi.fn(), count: vi.fn() },
}));

vi.mock("@/services/timeline.service", () => ({
  timelineService: { publish: vi.fn().mockResolvedValue(undefined), getByProject: vi.fn(), list: vi.fn(), getWorkflowStats: vi.fn() },
}));

vi.mock("@/lib/prisma", () => {
  const mockTx = { task: { findFirst: vi.fn() } };
  return {
    prisma: {
      ...mockTx,
      taskChecklist: { findUnique: vi.fn() },
      $transaction: vi.fn(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)),
    },
  };
});

import { taskService, taskProgressService, taskStatisticsService } from "@/services/task.service";
import { taskRepository } from "@/repositories/task.repository";

const mockTask = {
  id: "task-1", taskCode: "TSK-000001", projectId: "project-1", shootId: null,
  parentTaskId: null, title: "Test Task", description: null, status: "TODO",
  priority: "MEDIUM", assignedTo: null, estimatedHours: 4, actualHours: 0,
  startDate: null, dueDate: new Date("2026-06-20"), completedAt: null,
  progress: 0, order: 0, createdAt: new Date(), updatedAt: new Date(),
  project: { id: "project-1", name: "Test", projectCode: "PR-001" },
  assignee: null, checklists: [], comments: [], subtasks: [],
};

describe("taskService.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a task with generated code", async () => {
    vi.mocked(taskRepository.create).mockResolvedValue(mockTask as never);

    const result = await taskService.create({
      projectId: "project-1", title: "Test Task", dueDate: new Date("2026-06-20"),
    });

    expect(result).toEqual(mockTask);
    expect(taskRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        taskCode: expect.any(String),
        projectId: "project-1",
        title: "Test Task",
        status: "TODO",
      })
    );
  });

  it("publishes TASK_CREATED timeline", async () => {
    vi.mocked(taskRepository.create).mockResolvedValue(mockTask as never);
    const { timelineService } = await import("@/services/timeline.service");

    await taskService.create({ projectId: "project-1", title: "Test", dueDate: new Date() });

    expect(timelineService.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "TASK_CREATED", projectId: "project-1" })
    );
  });

  it("publishes TASK_ASSIGNED when assignedTo provided", async () => {
    vi.mocked(taskRepository.create).mockResolvedValue(mockTask as never);
    const { timelineService } = await import("@/services/timeline.service");

    await taskService.create({
      projectId: "project-1", title: "Test", dueDate: new Date(), assignedTo: "tm1",
    });

    expect(timelineService.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "TASK_ASSIGNED" })
    );
  });
});

describe("taskService.move", () => {
  beforeEach(() => vi.clearAllMocks());

  it("moves task to new status", async () => {
    vi.mocked(taskRepository.findById).mockResolvedValue({ ...mockTask, status: "TODO" } as never);
    vi.mocked(taskRepository.update).mockResolvedValue({ ...mockTask, status: "IN_PROGRESS" } as never);

    await taskService.move("task-1", "IN_PROGRESS", 2);

    expect(taskRepository.update).toHaveBeenCalledWith(
      "task-1",
      expect.objectContaining({ status: "IN_PROGRESS", order: 2 })
    );
  });

  it("sets completedAt and progress=100 when moved to DONE", async () => {
    vi.mocked(taskRepository.findById).mockResolvedValue({ ...mockTask, status: "IN_PROGRESS" } as never);
    vi.mocked(taskRepository.update).mockResolvedValue({ ...mockTask, status: "DONE" } as never);

    await taskService.move("task-1", "DONE", 0);

    expect(taskRepository.update).toHaveBeenCalledWith(
      "task-1",
      expect.objectContaining({
        status: "DONE",
        completedAt: expect.any(Date),
        progress: 100,
      })
    );
  });

  it("publishes TASK_STARTED on move to IN_PROGRESS", async () => {
    vi.mocked(taskRepository.findById).mockResolvedValue({ ...mockTask, status: "TODO" } as never);
    vi.mocked(taskRepository.update).mockResolvedValue({ ...mockTask, status: "IN_PROGRESS" } as never);
    const { timelineService } = await import("@/services/timeline.service");

    await taskService.move("task-1", "IN_PROGRESS", 0);

    expect(timelineService.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "TASK_STARTED" })
    );
  });

  it("publishes TASK_COMPLETED on move to DONE", async () => {
    vi.mocked(taskRepository.findById).mockResolvedValue({ ...mockTask, status: "IN_PROGRESS" } as never);
    vi.mocked(taskRepository.update).mockResolvedValue({ ...mockTask, status: "DONE" } as never);
    const { timelineService } = await import("@/services/timeline.service");

    await taskService.move("task-1", "DONE", 0);

    expect(timelineService.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "TASK_COMPLETED" })
    );
  });
});

describe("taskProgressService.calculateProgress", () => {
  it("returns 0 for no checklist items", () => {
    expect(taskProgressService.calculateProgress(0, 0)).toBe(0);
  });

  it("returns 50 for half completed", () => {
    expect(taskProgressService.calculateProgress(4, 2)).toBe(50);
  });

  it("returns 100 for all completed", () => {
    expect(taskProgressService.calculateProgress(3, 3)).toBe(100);
  });

  it("returns 33 for 1 of 3", () => {
    expect(taskProgressService.calculateProgress(3, 1)).toBe(33);
  });
});

describe("taskService.addComment", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a comment", async () => {
    vi.mocked(taskRepository.createComment).mockResolvedValue({
      id: "c1", taskId: "task-1", authorId: "u1", content: "Test", createdAt: new Date(),
      author: { id: "u1", fullName: "User" },
    } as never);
    vi.mocked(taskRepository.findById).mockResolvedValue(mockTask as never);

    await taskService.addComment("task-1", "u1", "Test comment");

    expect(taskRepository.createComment).toHaveBeenCalledWith(
      expect.objectContaining({ taskId: "task-1", authorId: "u1", content: "Test comment" })
    );
  });

  it("publishes COMMENT_ADDED timeline", async () => {
    vi.mocked(taskRepository.createComment).mockResolvedValue({ id: "c1" } as never);
    vi.mocked(taskRepository.findById).mockResolvedValue(mockTask as never);
    const { timelineService } = await import("@/services/timeline.service");

    await taskService.addComment("task-1", "u1", "Test");

    expect(timelineService.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "COMMENT_ADDED" })
    );
  });
});

describe("taskStatisticsService.getDashboardStats", () => {
  it("delegates to repository", async () => {
    const stats = { tasksToday: 5, overdueTasks: 3, reviewTasks: 2, completedToday: 8 };
    vi.mocked(taskRepository.getDashboardStats).mockResolvedValue(stats);

    const result = await taskStatisticsService.getDashboardStats();
    expect(result).toEqual(stats);
  });
});

describe("taskService.getKanban", () => {
  it("delegates to repository", async () => {
    vi.mocked(taskRepository.findKanban).mockResolvedValue([] as never);

    await taskService.getKanban({ projectId: "p1" });

    expect(taskRepository.findKanban).toHaveBeenCalledWith({ projectId: "p1" });
  });
});
