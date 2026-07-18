import { describe, it, expect } from "vitest";

import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  taskCommentSchema,
  checklistItemSchema,
  taskQuerySchema,
  taskStatusSchema,
  taskPrioritySchema,
  taskFilterSchema,
  taskSortSchema,
} from "@/lib/validations/task";

const validTask = {
  projectId: "project-1",
  title: "تجهيز الاستوديو",
  dueDate: new Date("2026-06-20").toISOString(),
};

describe("createTaskSchema", () => {
  it("accepts valid input", () => {
    expect(createTaskSchema.safeParse(validTask).success).toBe(true);
  });

  it("rejects missing projectId", () => {
    expect(createTaskSchema.safeParse({ ...validTask, projectId: "" }).success).toBe(false);
  });

  it("rejects missing dueDate", () => {
    expect(createTaskSchema.safeParse({ projectId: "p1", title: "Test" }).success).toBe(false);
  });

  it("rejects negative estimatedHours", () => {
    expect(createTaskSchema.safeParse({ ...validTask, estimatedHours: -5 }).success).toBe(false);
  });

  it("accepts optional fields", () => {
    expect(createTaskSchema.safeParse({
      ...validTask, shootId: "s1", parentTaskId: "t1", description: "وصف",
      priority: "HIGH", assignedTo: "tm1", estimatedHours: 4, startDate: new Date().toISOString(),
    }).success).toBe(true);
  });
});

describe("updateTaskSchema", () => {
  it("accepts valid update", () => {
    expect(updateTaskSchema.safeParse({ ...validTask, status: "DONE", progress: 100 }).success).toBe(true);
  });

  it("rejects progress > 100", () => {
    expect(updateTaskSchema.safeParse({ ...validTask, progress: 150 }).success).toBe(false);
  });

  it("rejects progress < 0", () => {
    expect(updateTaskSchema.safeParse({ ...validTask, progress: -10 }).success).toBe(false);
  });
});

describe("moveTaskSchema", () => {
  it("accepts valid move", () => {
    expect(moveTaskSchema.safeParse({ taskId: "t1", status: "IN_PROGRESS", order: 2 }).success).toBe(true);
  });

  it("rejects missing taskId", () => {
    expect(moveTaskSchema.safeParse({ status: "TODO", order: 0 }).success).toBe(false);
  });
});

describe("taskCommentSchema", () => {
  it("accepts valid comment", () => {
    expect(taskCommentSchema.safeParse({ taskId: "t1", content: "Test comment" }).success).toBe(true);
  });

  it("rejects empty content", () => {
    expect(taskCommentSchema.safeParse({ taskId: "t1", content: "" }).success).toBe(false);
  });
});

describe("checklistItemSchema", () => {
  it("accepts valid item", () => {
    expect(checklistItemSchema.safeParse({ title: "Item 1", completed: false, order: 0 }).success).toBe(true);
  });

  it("rejects empty title", () => {
    expect(checklistItemSchema.safeParse({ title: "", completed: false, order: 0 }).success).toBe(false);
  });
});

describe("taskStatusSchema", () => {
  it("accepts all statuses", () => {
    ["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE"].forEach(s => {
      expect(taskStatusSchema.safeParse(s).success).toBe(true);
    });
  });
});

describe("taskPrioritySchema", () => {
  it("accepts all priorities", () => {
    ["LOW", "MEDIUM", "HIGH", "URGENT"].forEach(p => {
      expect(taskPrioritySchema.safeParse(p).success).toBe(true);
    });
  });
});

describe("taskFilterSchema", () => {
  it("accepts all filters", () => {
    ["all", "todo", "in_progress", "in_review", "blocked", "done"].forEach(f => {
      expect(taskFilterSchema.safeParse(f).success).toBe(true);
    });
  });
});

describe("taskSortSchema", () => {
  it("accepts all sorts", () => {
    ["newest", "oldest", "due_date", "priority", "alphabetical"].forEach(s => {
      expect(taskSortSchema.safeParse(s).success).toBe(true);
    });
  });
});

describe("taskQuerySchema", () => {
  it("uses defaults", () => {
    const result = taskQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(25);
    }
  });
});
