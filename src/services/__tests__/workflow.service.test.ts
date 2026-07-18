import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── Mock dependencies ───────────────────── */

vi.mock("@/repositories/timeline.repository", () => ({
  timelineRepository: {
    findById: vi.fn(),
    create: vi.fn(),
    findByProject: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    getWorkflowStats: vi.fn(),
  },
}));

vi.mock("@/repositories/project.repository", () => ({
  projectRepository: {
    findById: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/workflow/hooks", () => ({
  onProjectApproved: vi.fn().mockResolvedValue(undefined),
  onDeliveryPublished: vi.fn().mockResolvedValue(undefined),
  onPaymentReceived: vi.fn().mockResolvedValue(undefined),
  onProjectCompleted: vi.fn().mockResolvedValue(undefined),
  onWorkflowTransition: vi.fn().mockResolvedValue(undefined),
}));

/* ── Imports ─────────────────────────────── */

import { workflowService } from "@/services/workflow.service";
import { timelineService } from "@/services/timeline.service";
import { timelineRepository } from "@/repositories/timeline.repository";
import { prisma } from "@/lib/prisma";

/* ============================================
   Timeline Service Tests
   ============================================ */

describe("timelineService.publish", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a timeline event", async () => {
    vi.mocked(timelineRepository.create).mockResolvedValue({
      id: "event-1",
      projectId: "project-1",
      eventType: "PROJECT_CREATED",
      title: "Test Event",
      description: null,
      metadata: null,
      actorId: null,
      actorName: "System",
      createdAt: new Date(),
    } as never);

    await timelineService.publish({
      projectId: "project-1",
      eventType: "PROJECT_CREATED",
      title: "Test Event",
      actorName: "System",
    });

    expect(timelineRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "project-1",
        eventType: "PROJECT_CREATED",
        title: "Test Event",
        actorName: "System",
      })
    );
  });

  it("passes optional fields", async () => {
    vi.mocked(timelineRepository.create).mockResolvedValue({} as never);

    await timelineService.publish({
      projectId: "project-1",
      eventType: "WORKFLOW_TRANSITION",
      title: "Transition",
      description: "From A to B",
      metadata: { from: "NEW", to: "PLANNING" },
      actorId: "user-1",
      actorName: "Test User",
    });

    expect(timelineRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "From A to B",
        metadata: { from: "NEW", to: "PLANNING" },
        actorId: "user-1",
      })
    );
  });
});

describe("timelineService.getByProject", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls repository.findByProject", async () => {
    vi.mocked(timelineRepository.findByProject).mockResolvedValue([] as never);

    await timelineService.getByProject("project-1");

    expect(timelineRepository.findByProject).toHaveBeenCalledWith("project-1", 50);
  });
});

/* ============================================
   Workflow Service Tests
   ============================================ */

const mockProject = {
  id: "project-1",
  name: "Test Project",
  workflowStatus: "NEW",
};

describe("workflowService.validateTransition", () => {
  it("validates allowed transition", () => {
    const result = workflowService.validateTransition("NEW", "PLANNING");
    expect(result.valid).toBe(true);
  });

  it("rejects same status", () => {
    const result = workflowService.validateTransition("NEW", "NEW");
    expect(result.valid).toBe(false);
  });

  it("rejects invalid transition", () => {
    const result = workflowService.validateTransition("NEW", "EDITING");
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe("workflowService.transition", () => {
  beforeEach(() => vi.clearAllMocks());

  it("transitions project to valid status", async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as never);
    vi.mocked(timelineRepository.create).mockResolvedValue({} as never);

    const result = await workflowService.transition("project-1", "PLANNING", {
      actorId: "user-1",
      actorName: "Test User",
    });

    expect(result.success).toBe(true);
    expect(result.fromStatus).toBe("NEW");
    expect(result.toStatus).toBe("PLANNING");
  });

  it("rejects invalid transition", async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as never);

    const result = await workflowService.transition("project-1", "EDITING");

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns error for non-existent project", async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(null);

    const result = await workflowService.transition("nonexistent", "PLANNING");

    expect(result.success).toBe(false);
    expect(result.error).toContain("غير موجود");
  });

  it("publishes timeline event on transition", async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as never);
    vi.mocked(timelineRepository.create).mockResolvedValue({} as never);

    await workflowService.transition("project-1", "PLANNING", {
      actorId: "user-1",
      actorName: "Test User",
    });

    expect(timelineRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "WORKFLOW_TRANSITION",
        title: "تغيير حالة المشروع",
        metadata: { fromStatus: "NEW", toStatus: "PLANNING" },
      })
    );
  });

  it("publishes PROJECT_COMPLETED when transitioning to COMPLETED", async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue({
      ...mockProject,
      workflowStatus: "PAID",
    } as never);
    vi.mocked(timelineRepository.create).mockResolvedValue({} as never);

    await workflowService.transition("project-1", "COMPLETED");

    const calls = vi.mocked(timelineRepository.create).mock.calls;
    const completedCall = calls.find(
      (c) => (c[0] as { eventType: string }).eventType === "PROJECT_COMPLETED"
    );
    expect(completedCall).toBeDefined();
  });
});

describe("workflowService.getStats", () => {
  beforeEach(() => vi.clearAllMocks());

  it("delegates to timelineService", async () => {
    const stats = { editing: 2, review: 3, approved: 1, delivered: 0, completed: 5 };
    vi.mocked(timelineRepository.getWorkflowStats).mockResolvedValue(stats as never);

    const result = await workflowService.getStats();

    expect(result).toEqual(stats);
  });
});
