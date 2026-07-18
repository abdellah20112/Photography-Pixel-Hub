import { analyticsRepository } from "@/repositories/analytics.repository";
import type { DashboardData, DateRange, ReportType, ExportFormat } from "@/types/analytics";

/* ============================================
   Statistics Engine
   Computes derived statistics from raw data.
   ============================================ */

export const statisticsEngine = {
  /** Calculate percentage from two numbers. */
  percentage(part: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((part / total) * 100);
  },

  /** Calculate average. */
  average(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  },

  /** Calculate growth rate. */
  growthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  },
};

/* ============================================
   Analytics Service
   Aggregates data from all modules.
   Uses parallel requests for performance.
   ============================================ */

export const analyticsService = {
  async getDashboard(range: DateRange): Promise<DashboardData> {
    const [business, projectPerformance, financial, team, models, clients, shoots, tasks, deliveries] = await Promise.all([
      analyticsRepository.getBusinessOverview(range),
      analyticsRepository.getProjectPerformance(range),
      analyticsRepository.getFinancialAnalytics(range),
      analyticsRepository.getTeamAnalytics(range),
      analyticsRepository.getModelAnalytics(range),
      analyticsRepository.getClientAnalytics(range),
      analyticsRepository.getShootAnalytics(range),
      analyticsRepository.getTaskAnalytics(range),
      analyticsRepository.getDeliveryAnalytics(range),
    ]);

    return {
      business,
      projectPerformance,
      financial,
      team,
      models,
      clients,
      shoots,
      tasks,
      deliveries,
    };
  },

  /** Get chart data for a specific section. */
  async getCharts(section: string, range: DateRange) {
    switch (section) {
      case "business":
        return analyticsRepository.getBusinessOverview(range);
      case "projects":
        return analyticsRepository.getProjectPerformance(range);
      case "financial":
        return analyticsRepository.getFinancialAnalytics(range);
      case "team":
        return analyticsRepository.getTeamAnalytics(range);
      case "models":
        return analyticsRepository.getModelAnalytics(range);
      case "clients":
        return analyticsRepository.getClientAnalytics(range);
      case "shoots":
        return analyticsRepository.getShootAnalytics(range);
      case "tasks":
        return analyticsRepository.getTaskAnalytics(range);
      case "deliveries":
        return analyticsRepository.getDeliveryAnalytics(range);
      default:
        return null;
    }
  },
};

/* ============================================
   Report Service
   Generates structured reports.
   ============================================ */

export const reportService = {
  async generate(reportType: ReportType, range: DateRange) {
    switch (reportType) {
      case "monthly":
        return this.generateMonthlyReport(range);
      case "financial":
        return this.generateFinancialReport(range);
      case "client":
        return this.generateClientReport(range);
      case "project":
        return this.generateProjectReport(range);
      case "team":
        return this.generateTeamReport(range);
      case "model":
        return this.generateModelReport(range);
      default:
        throw new Error("نوع التقرير غير معروف");
    }
  },

  async generateMonthlyReport(range: DateRange) {
    const data = await analyticsService.getDashboard(range);
    return {
      title: "تقرير شهري",
      period: range,
      summary: {
        revenue: data.business.revenueThisMonth,
        projects: data.business.projectsActive,
        tasksCompleted: data.team.tasksCompleted,
        shoots: data.shoots.completedShoots,
      },
      details: data,
    };
  },

  async generateFinancialReport(range: DateRange) {
    const financial = await analyticsRepository.getFinancialAnalytics(range);
    const business = await analyticsRepository.getBusinessOverview(range);
    return {
      title: "تقرير مالي",
      period: range,
      summary: {
        revenueToday: business.revenueToday,
        revenueMonth: business.revenueThisMonth,
        outstanding: business.outstandingBalance,
        paidMonth: business.paidThisMonth,
      },
      details: financial,
    };
  },

  async generateClientReport(range: DateRange) {
    const clients = await analyticsRepository.getClientAnalytics(range);
    return { title: "تقرير العملاء", period: range, details: clients };
  },

  async generateProjectReport(range: DateRange) {
    const projects = await analyticsRepository.getProjectPerformance(range);
    return { title: "تقرير المشاريع", period: range, details: projects };
  },

  async generateTeamReport(range: DateRange) {
    const team = await analyticsRepository.getTeamAnalytics(range);
    return { title: "تقرير الفريق", period: range, details: team };
  },

  async generateModelReport(range: DateRange) {
    const models = await analyticsRepository.getModelAnalytics(range);
    return { title: "تقرير الموديلات", period: range, details: models };
  },
};

/* ============================================
   Export Service
   CSV and Excel export. PDF is architecture only.
   ============================================ */

export const exportService = {
  /** Export report data as CSV string. */
  toCSV(data: Record<string, unknown>[], headers: string[]): string {
    const escapeCsv = (value: unknown): string => {
      if (value == null) return "";
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headerRow = headers.map(escapeCsv).join(",");
    const rows = data.map((row) =>
      Object.values(row).map(escapeCsv).join(",")
    );

    return "\uFEFF" + [headerRow, ...rows].join("\n");
  },

  /** Export report data as Excel-compatible CSV (same as CSV but with .xls extension hint). */
  toExcel(data: Record<string, unknown>[], headers: string[]): string {
    return this.toCSV(data, headers);
  },

  /** PDF export — architecture only. */
  async toPDF(data: Record<string, unknown>): Promise<Buffer> {
    throw new Error("تصدير PDF لم يتم التنفيذ بعد — سيتم في إصدار قادم");
  },

  /** Export report in the specified format. */
  async export(report: { title: string; details: unknown }, format: ExportFormat): Promise<{ data: string; mime: string; ext: string }> {
    const details = report.details as Record<string, unknown>;
    const flatten = (obj: Record<string, unknown>, prefix = ""): Record<string, unknown> => {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (value !== null && typeof value === "object" && !Array.isArray(value)) {
          Object.assign(result, flatten(value as Record<string, unknown>, fullKey));
        } else if (!Array.isArray(value)) {
          result[fullKey] = value;
        }
      }
      return result;
    };

    const flatData = flatten(details);
    const headers = Object.keys(flatData);

    switch (format) {
      case "csv":
        return { data: this.toCSV([flatData], headers), mime: "text/csv;charset=utf-8", ext: "csv" };
      case "excel":
        return { data: this.toExcel([flatData], headers), mime: "application/vnd.ms-excel;charset=utf-8", ext: "xls" };
      case "pdf":
        const buf = await this.toPDF(details);
        return { data: buf.toString("base64"), mime: "application/pdf", ext: "pdf" };
      default:
        throw new Error("صيغة غير مدعومة");
    }
  },
};

/** Resolve a date range preset. */
export function resolveDateRange(preset: string, custom?: { start?: string; end?: string }): DateRange {
  const now = new Date();

  switch (preset) {
    case "today":
      return { startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()), endDate: now };
    case "week": {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      return { startDate: start, endDate: now };
    }
    case "month":
      return { startDate: new Date(now.getFullYear(), now.getMonth(), 1), endDate: now };
    case "quarter": {
      const q = Math.floor(now.getMonth() / 3);
      return { startDate: new Date(now.getFullYear(), q * 3, 1), endDate: now };
    }
    case "year":
      return { startDate: new Date(now.getFullYear(), 0, 1), endDate: now };
    case "custom":
      return {
        startDate: custom?.start ? new Date(custom.start) : new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: custom?.end ? new Date(custom.end) : now,
      };
    default:
      return { startDate: new Date(now.getFullYear(), now.getMonth(), 1), endDate: now };
  }
}
