import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── Mock dependencies ───────────────────── */

vi.mock("@/lib/prisma", () => ({
  prisma: {
    projectTimelineEvent: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    project: {
      count: vi.fn(),
    },
  },
}));

/* ── Imports ─────────────────────────────── */

import { prisma } from "@/lib/prisma";
import { timelineRepository } from "@/repositories/timeline.repository";

/* ============================================
   Timeline Repository Tests
   ============================================ */

const mockEvent = {
  id: "event-1",
  projectId: "project-1",
  eventType: "PROJECT_CREATED",
  title: "Test Event",
  description: "Test description",
  metadata: null,
  actorId: null,
  actorName: "System",
  createdAt: new Date("2025-01-01"),
  project: { id: "project-1", name: "Test Project", projectCode: "PR-000001" },
};

describe("timelineRepository.findById", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls findUnique with id", async () => {
    vi.mocked(prisma.projectTimelineEvent.findUnique).mockResolvedValue(mockEvent as never);

    const result = await timelineRepository.findById("event-1");

    expect(result).toEqual(mockEvent);
    expect(prisma.projectTimelineEvent.findUnique).toHaveBeenCalledWith({
      where: { id: "event-1" },
      include: { project: true },
    });
  });
});

describe("timelineRepository.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls create with data", async () => {
    vi.mocked(prisma.projectTimelineEvent.create).mockResolvedValue(mockEvent as never);

    const data = {
      projectId: "project-1",
      eventType: "PROJECT_CREATED",
      title: "Test",
      description: null,
      metadata: undefined,
      actorId: null,
      actorName: "System",
    } as never;

    const result = await timelineRepository.create(data);

    expect(result).toEqual(mockEvent);
    expect(prisma.projectTimelineEvent.create).toHaveBeenCalledWith({ data });
  });
});

describe("timelineRepository.findByProject", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls findMany with projectId, newest first", async () => {
    vi.mocked(prisma.projectTimelineEvent.findMany).mockResolvedValue([mockEvent] as never);

    const result = await timelineRepository.findByProject("project-1", 50);

    expect(result).toHaveLength(1);
    expect(prisma.projectTimelineEvent.findMany).toHaveBeenCalledWith({
      where: { projectId: "project-1" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  });
});

describe("timelineRepository.findMany", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls findMany and count in parallel", async () => {
    vi.mocked(prisma.projectTimelineEvent.findMany).mockResolvedValue([mockEvent] as never);
    vi.mocked(prisma.projectTimelineEvent.count).mockResolvedValue(1);

    const result = await timelineRepository.findMany({
      search: "test",
      skip: 0,
      take: 25,
    });

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("searches by title, description, actorName, and project name", async () => {
    vi.mocked(prisma.projectTimelineEvent.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.projectTimelineEvent.count).mockResolvedValue(0);

    await timelineRepository.findMany({ search: "test" });

    const call = vi.mocked(prisma.projectTimelineEvent.findMany).mock.calls[0]![0] as {
      where: { OR?: unknown[] };
    };
    expect(call.where.OR).toHaveLength(4);
  });

  it("filters by eventType", async () => {
    vi.mocked(prisma.projectTimelineEvent.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.projectTimelineEvent.count).mockResolvedValue(0);

    await timelineRepository.findMany({ eventType: "PROJECT_CREATED" });

    const call = vi.mocked(prisma.projectTimelineEvent.findMany).mock.calls[0]![0] as {
      where: { eventType?: string };
    };
    expect(call.where.eventType).toBe("PROJECT_CREATED");
  });
});

describe("timelineRepository.getWorkflowStats", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns counts for each workflow status", async () => {
    vi.mocked(prisma.project.count)
      .mockResolvedValueOnce(2) // editing
      .mockResolvedValueOnce(3) // review
      .mockResolvedValueOnce(1) // approved
      .mockResolvedValueOnce(0) // delivered
      .mockResolvedValueOnce(5); // completed

    const result = await timelineRepository.getWorkflowStats();

    expect(result.editing).toBe(2);
    expect(result.review).toBe(3);
    expect(result.approved).toBe(1);
    expect(result.delivered).toBe(0);
    expect(result.completed).toBe(5);
  });
});
