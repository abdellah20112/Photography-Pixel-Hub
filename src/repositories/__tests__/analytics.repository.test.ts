import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    payment: { aggregate: vi.fn(), findMany: vi.fn() },
    invoice: { aggregate: vi.fn(), count: vi.fn(), groupBy: vi.fn(), findMany: vi.fn() },
    project: { count: vi.fn(), findMany: vi.fn(), groupBy: vi.fn() },
    task: { count: vi.fn(), groupBy: vi.fn() },
    teamMember: { count: vi.fn(), findMany: vi.fn() },
    projectAssignment: { count: vi.fn() },
    projectModel: { count: vi.fn(), groupBy: vi.fn() },
    model: { count: vi.fn(), findMany: vi.fn() },
    client: { count: vi.fn(), findMany: vi.fn() },
    shoot: { count: vi.fn() },
    delivery: { count: vi.fn() },
    download: { count: vi.fn() },
    reviewComment: { count: vi.fn() },
    activityLog: { count: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { analyticsRepository } from "@/repositories/analytics.repository";

const range = { startDate: new Date("2026-01-01"), endDate: new Date("2026-06-30") };

describe("analyticsRepository.getBusinessOverview", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns aggregated business stats", async () => {
    vi.mocked(prisma.payment.aggregate)
      .mockResolvedValueOnce({ _sum: { amount: 500 } } as never)
      .mockResolvedValueOnce({ _sum: { amount: 5000 } } as never);
    vi.mocked(prisma.invoice.aggregate)
      .mockResolvedValueOnce({ _sum: { remainingAmount: 3000 } } as never)
      .mockResolvedValueOnce({ _sum: { total: 7000 } } as never);
    vi.mocked(prisma.project.count)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(5);

    const result = await analyticsRepository.getBusinessOverview(range);

    expect(result.revenueToday).toBe(500);
    expect(result.revenueThisMonth).toBe(5000);
    expect(result.outstandingBalance).toBe(3000);
    expect(result.paidThisMonth).toBe(7000);
    expect(result.projectsActive).toBe(10);
    expect(result.projectsCompleted).toBe(5);
  });
});

describe("analyticsRepository.getTaskAnalytics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns task stats", async () => {
    vi.mocked(prisma.task.count)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(20)
      .mockResolvedValueOnce(2);

    const result = await analyticsRepository.getTaskAnalytics(range);

    expect(result.tasksToday).toBe(5);
    expect(result.overdue).toBe(3);
    expect(result.completed).toBe(20);
    expect(result.blocked).toBe(2);
  });
});

describe("analyticsRepository.getShootAnalytics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns shoot stats", async () => {
    vi.mocked(prisma.shoot.count)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(7);

    const result = await analyticsRepository.getShootAnalytics(range);

    expect(result.shootsThisWeek).toBe(4);
    expect(result.completedShoots).toBe(10);
    expect(result.cancelledShoots).toBe(2);
    expect(result.upcomingShoots).toBe(7);
  });
});

describe("analyticsRepository.getDeliveryAnalytics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns delivery stats", async () => {
    vi.mocked(prisma.delivery.count).mockResolvedValue(15);
    vi.mocked(prisma.download.count).mockResolvedValue(100);
    vi.mocked(prisma.reviewComment.count).mockResolvedValue(8);
    vi.mocked(prisma.activityLog.count).mockResolvedValue(25);

    const result = await analyticsRepository.getDeliveryAnalytics(range);

    expect(result.totalDeliveries).toBe(15);
    expect(result.totalDownloads).toBe(100);
    expect(result.pendingReviews).toBe(8);
    expect(result.approvedVideos).toBe(25);
  });
});
