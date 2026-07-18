import { prisma } from "@/lib/prisma";

/* ============================================
   Analytics Repository
   Optimized aggregate queries.
   Uses parallel requests to avoid N+1.
   ============================================ */

export const analyticsRepository = {
  // ── Business Overview ──────────────────────

  async getBusinessOverview(range: { startDate: Date; endDate: Date }) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [revToday, revMonth, outstanding, paidMonth, projActive, projCompleted] = await Promise.all([
      prisma.payment.aggregate({
        where: { paidAt: { gte: startOfToday } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.invoice.aggregate({
        where: { status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] } },
        _sum: { remainingAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { status: "PAID", updatedAt: { gte: startOfMonth } },
        _sum: { total: true },
      }),
      prisma.project.count({ where: { status: { not: "ARCHIVED" }, archivedAt: null } }),
      prisma.project.count({ where: { status: "COMPLETED" } }),
    ]);

    return {
      revenueToday: revToday._sum.amount ?? 0,
      revenueThisMonth: revMonth._sum.amount ?? 0,
      outstandingBalance: outstanding._sum.remainingAmount ?? 0,
      paidThisMonth: paidMonth._sum.total ?? 0,
      projectsActive: projActive,
      projectsCompleted: projCompleted,
    };
  },

  // ── Project Performance ──────────────────────

  async getProjectPerformance(range: { startDate: Date; endDate: Date }) {
    const [projectsThisYear, delayedProjects, workflowGroups] = await Promise.all([
      prisma.project.findMany({
        where: { createdAt: { gte: range.startDate, lte: range.endDate } },
        select: { createdAt: true, deadline: true },
      }),
      prisma.project.count({
        where: {
          deadline: { lt: new Date() },
          status: { notIn: ["COMPLETED", "ARCHIVED"] },
        },
      }),
      prisma.project.groupBy({
        by: ["workflowStatus"],
        _count: true,
      }),
    ]);

    // Group by month
    const monthMap = new Map<string, number>();
    for (const p of projectsThisYear) {
      const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
    }
    const projectsPerMonth = Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }));

    // Average duration (from creation to deadline)
    const durations = projectsThisYear
      .filter((p) => p.deadline)
      .map((p) => (p.deadline!.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const averageDurationDays = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    const workflowDistribution = workflowGroups.map((g) => ({
      status: g.workflowStatus,
      count: g._count,
    }));

    return { projectsPerMonth, averageDurationDays, delayedProjects, workflowDistribution };
  },

  // ── Financial Analytics ─────────────────────

  async getFinancialAnalytics(range: { startDate: Date; endDate: Date }) {
    const [payments, outstandingInvoices, paymentStatusGroups, invoiceAgg] = await Promise.all([
      prisma.payment.findMany({
        where: { paidAt: { gte: range.startDate, lte: range.endDate } },
        select: { amount: true, paidAt: true },
      }),
      prisma.invoice.count({ where: { status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] } } }),
      prisma.invoice.groupBy({
        by: ["status"],
        _count: true,
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        _avg: { total: true },
        _count: true,
      }),
    ]);

    // Group payments by month
    const monthMap = new Map<string, number>();
    for (const p of payments) {
      const key = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(key, (monthMap.get(key) ?? 0) + p.amount);
    }
    const monthlyPayments = Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, amount]) => ({ month, amount }));

    // Revenue from invoices (total = revenue)
    const invoiceMonthMap = new Map<string, number>();
    const invoices = await prisma.invoice.findMany({
      where: { createdAt: { gte: range.startDate, lte: range.endDate } },
      select: { total: true, createdAt: true },
    });
    for (const inv of invoices) {
      const key = `${inv.createdAt.getFullYear()}-${String(inv.createdAt.getMonth() + 1).padStart(2, "0")}`;
      invoiceMonthMap.set(key, (invoiceMonthMap.get(key) ?? 0) + inv.total);
    }
    const monthlyRevenue = Array.from(invoiceMonthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, amount]) => ({ month, amount }));

    const paymentStatusDistribution = paymentStatusGroups.map((g) => ({
      status: g.status,
      count: g._count,
      total: g._sum.total ?? 0,
    }));

    return {
      monthlyRevenue,
      monthlyPayments,
      outstandingInvoices,
      paymentStatusDistribution,
      averageInvoiceValue: invoiceAgg._avg.total ?? 0,
    };
  },

  // ── Team Analytics ───────────────────────────

  async getTeamAnalytics(range: { startDate: Date; endDate: Date }) {
    const [activeMembers, completedTasks, totalTasks, assignments, topPerformers] = await Promise.all([
      prisma.teamMember.count({ where: { status: "ACTIVE" } }),
      prisma.task.count({ where: { status: "DONE", completedAt: { gte: range.startDate, lte: range.endDate } } }),
      prisma.task.count({ where: { createdAt: { gte: range.startDate, lte: range.endDate } } }),
      prisma.projectAssignment.count({ where: { completedAt: null } }),
      prisma.task.groupBy({
        by: ["assignedTo"],
        where: { status: "DONE", completedAt: { gte: range.startDate, lte: range.endDate } },
        _count: true,
        orderBy: { _count: { assignedTo: "desc" } },
        take: 5,
      }),
    ]);

    const performerIds = topPerformers.map((p) => p.assignedTo).filter(Boolean) as string[];
    const performers = await prisma.teamMember.findMany({
      where: { id: { in: performerIds } },
      select: { id: true, fullName: true },
    });

    const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const occupancyPercent = activeMembers > 0 ? Math.round((assignments / activeMembers) * 100) : 0;

    return {
      productivity,
      tasksCompleted: completedTasks,
      occupancyPercent,
      projectsPerEmployee: activeMembers > 0 ? Math.round(assignments / activeMembers) : 0,
      averageCompletionTimeHours: 0,
      topPerformers: topPerformers.map((p) => {
        const member = performers.find((m) => m.id === p.assignedTo);
        return {
          id: p.assignedTo ?? "",
          fullName: member?.fullName ?? "غير معروف",
          tasksCompleted: p._count,
        };
      }),
    };
  },

  // ── Model Analytics ──────────────────────────

  async getModelAnalytics(range: { startDate: Date; endDate: Date }) {
    const [totalModels, modelAssignments, topModelAgg] = await Promise.all([
      prisma.model.count({ where: { status: "ACTIVE" } }),
      prisma.projectModel.count(),
      prisma.projectModel.groupBy({
        by: ["modelId"],
        _sum: { totalAmount: true },
        _count: true,
        orderBy: { _sum: { totalAmount: "desc" } },
        take: 5,
      }),
    ]);

    const topModelIds = topModelAgg.map((t) => t.modelId);
    const topModelsData = await prisma.model.findMany({
      where: { id: { in: topModelIds } },
      select: { id: true, modelCode: true, fullName: true },
    });

    const totalEarnings = topModelAgg.reduce((sum, m) => sum + (m._sum.totalAmount ?? 0), 0);
    const totalProjects = modelAssignments;

    return {
      topModels: topModelAgg.map((agg) => {
        const model = topModelsData.find((m) => m.id === agg.modelId);
        return {
          id: agg.modelId,
          modelCode: model?.modelCode ?? "",
          fullName: model?.fullName ?? "",
          totalEarnings: agg._sum.totalAmount ?? 0,
          projectCount: agg._count,
        };
      }),
      totalVideos: 0,
      totalProjects,
      totalEarnings,
      utilizationPercent: totalModels > 0 ? Math.round((topModelIds.length / totalModels) * 100) : 0,
    };
  },

  // ── Client Analytics ─────────────────────────

  async getClientAnalytics(range: { startDate: Date; endDate: Date }) {
    const [totalClients, clientInvoiceAgg, topClientsAgg] = await Promise.all([
      prisma.client.count({ where: { status: "ACTIVE" } }),
      prisma.invoice.aggregate({ _avg: { total: true } }),
      prisma.invoice.groupBy({
        by: ["clientId"],
        _sum: { total: true },
        _count: true,
        orderBy: { _sum: { total: "desc" } },
        take: 5,
      }),
    ]);

    const topClientIds = topClientsAgg.map((c) => c.clientId);
    const topClientsData = await prisma.client.findMany({
      where: { id: { in: topClientIds } },
      select: { id: true, clientCode: true, name: true },
    });

    return {
      topClients: topClientsAgg.map((agg) => {
        const client = topClientsData.find((c) => c.id === agg.clientId);
        return {
          id: agg.clientId,
          clientCode: client?.clientCode ?? "",
          name: client?.name ?? "",
          lifetimeValue: agg._sum.total ?? 0,
          projectCount: agg._count,
        };
      }),
      averageInvoiceValue: clientInvoiceAgg._avg.total ?? 0,
      totalClients,
    };
  },

  // ── Shoot Analytics ──────────────────────────

  async getShootAnalytics(range: { startDate: Date; endDate: Date }) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [thisWeek, completed, cancelled, upcoming] = await Promise.all([
      prisma.shoot.count({
        where: { date: { gte: startOfWeek, lt: endOfWeek }, status: { not: "CANCELLED" } },
      }),
      prisma.shoot.count({ where: { status: "COMPLETED", date: { gte: range.startDate, lte: range.endDate } } }),
      prisma.shoot.count({ where: { status: "CANCELLED", date: { gte: range.startDate, lte: range.endDate } } }),
      prisma.shoot.count({ where: { date: { gte: now }, status: { in: ["SCHEDULED", "CONFIRMED"] } } }),
    ]);

    return { shootsThisWeek: thisWeek, completedShoots: completed, cancelledShoots: cancelled, upcomingShoots: upcoming };
  },

  // ── Task Analytics ───────────────────────────

  async getTaskAnalytics(range: { startDate: Date; endDate: Date }) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [today, overdue, completed, blocked] = await Promise.all([
      prisma.task.count({ where: { dueDate: { gte: startOfToday, lt: new Date(startOfToday.getTime() + 86400000) }, status: { not: "DONE" } } }),
      prisma.task.count({ where: { dueDate: { lt: now }, status: { notIn: ["DONE", "BLOCKED"] } } }),
      prisma.task.count({ where: { status: "DONE", completedAt: { gte: range.startDate, lte: range.endDate } } }),
      prisma.task.count({ where: { status: "BLOCKED" } }),
    ]);

    return { tasksToday: today, overdue, completed, blocked };
  },

  // ── Delivery Analytics ───────────────────────

  async getDeliveryAnalytics(range: { startDate: Date; endDate: Date }) {
    const [deliveries, downloads, pendingReviews, approvedVideos] = await Promise.all([
      prisma.delivery.count(),
      prisma.download.count({ where: { createdAt: { gte: range.startDate, lte: range.endDate } } }),
      prisma.reviewComment.count({ where: { status: "OPEN" } }),
      prisma.activityLog.count({ where: { type: "VIDEO_APPROVED", createdAt: { gte: range.startDate, lte: range.endDate } } }),
    ]);

    return { totalDeliveries: deliveries, totalDownloads: downloads, pendingReviews, approvedVideos };
  },
};
