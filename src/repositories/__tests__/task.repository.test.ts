import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    task: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    taskChecklist: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    taskComment: { create: vi.fn(), findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { taskRepository } from "@/repositories/task.repository";

const mockTask = {
  id: "task-1", taskCode: "TSK-000001", projectId: "project-1",
  title: "Test", status: "TODO", priority: "MEDIUM", progress: 0,
  dueDate: new Date("2026-06-20"), completedAt: null, order: 0,
  createdAt: new Date(), updatedAt: new Date(),
  assignee: { id: "tm1", fullName: "Test", employeeCode: "EMP-001" },
  _count: { checklists: 3, subtasks: 2 },
};

describe("taskRepository.findById", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls findUnique with includes", async () => {
    vi.mocked(prisma.task.findUnique).mockResolvedValue(mockTask as never);
    await taskRepository.findById("task-1");
    expect(prisma.task.findUnique).toHaveBeenCalledWith({
      where: { id: "task-1" },
      include: expect.objectContaining({
        project: expect.any(Object),
        assignee: expect.any(Object),
        checklists: expect.any(Object),
        comments: expect.any(Object),
        subtasks: expect.any(Object),
      }),
    });
  });
});

describe("taskRepository.findMany", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls findMany and count in parallel", async () => {
    vi.mocked(prisma.task.findMany).mockResolvedValue([mockTask] as never);
    vi.mocked(prisma.task.count).mockResolvedValue(1);
    vi.mocked(prisma.taskChecklist.count).mockResolvedValue(2);

    const result = await taskRepository.findMany({ search: "test", status: "todo" });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });
});

describe("taskRepository.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls create with data and includes", async () => {
    vi.mocked(prisma.task.create).mockResolvedValue(mockTask as never);
    const data = { taskCode: "TSK-000001", projectId: "p1", title: "Test", dueDate: new Date(), status: "TODO", priority: "MEDIUM" } as never;
    await taskRepository.create(data);
    expect(prisma.task.create).toHaveBeenCalledWith({
      data,
      include: expect.objectContaining({ project: expect.any(Object), assignee: expect.any(Object) }),
    });
  });
});

describe("taskRepository.softDelete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets status to DONE with completedAt and progress 100", async () => {
    vi.mocked(prisma.task.update).mockResolvedValue({ ...mockTask, status: "DONE" } as never);
    await taskRepository.softDelete("task-1");
    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: "task-1" },
      data: { status: "DONE", completedAt: expect.any(Date), progress: 100 },
    });
  });
});

describe("taskRepository.findKanban", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 4 columns grouped by status", async () => {
    vi.mocked(prisma.task.findMany).mockResolvedValue([
      { ...mockTask, status: "TODO" },
      { ...mockTask, status: "DONE" },
    ] as never);

    const result = await taskRepository.findKanban({});
    expect(result).toHaveLength(4);
    expect(result.map((c) => c.status)).toEqual(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]);
  });
});

describe("taskRepository.getDashboardStats", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns dashboard stats", async () => {
    vi.mocked(prisma.task.count).mockResolvedValue(5).mockResolvedValueOnce(5).mockResolvedValueOnce(3).mockResolvedValueOnce(2).mockResolvedValueOnce(8);
    const result = await taskRepository.getDashboardStats();
    expect(result.tasksToday).toBe(5);
    expect(result.overdueTasks).toBe(3);
    expect(result.reviewTasks).toBe(2);
    expect(result.completedToday).toBe(8);
  });
});

describe("taskRepository.createComment", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates comment with author include", async () => {
    vi.mocked(prisma.taskComment.create).mockResolvedValue({
      id: "c1", taskId: "t1", authorId: "u1", content: "Test", createdAt: new Date(),
      author: { id: "u1", fullName: "User" },
    } as never);

    await taskRepository.createComment({ taskId: "t1", authorId: "u1", content: "Test" });
    expect(prisma.taskComment.create).toHaveBeenCalledWith({
      data: { taskId: "t1", authorId: "u1", content: "Test" },
      include: { author: { select: { id: true, fullName: true } } },
    });
  });
});
