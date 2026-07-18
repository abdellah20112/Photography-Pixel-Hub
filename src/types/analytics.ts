import type { ProjectWorkflowStatus, TaskStatus, InvoiceStatus } from "@prisma/client";

/* ============================================
   Analytics Types
   ============================================ */

export type DateRange = {
  startDate: Date;
  endDate: Date;
};

export type DateRangePreset = "today" | "week" | "month" | "quarter" | "year" | "custom";

export type BusinessOverview = {
  revenueToday: number;
  revenueThisMonth: number;
  outstandingBalance: number;
  paidThisMonth: number;
  projectsActive: number;
  projectsCompleted: number;
};

export type ProjectPerformance = {
  projectsPerMonth: Array<{ month: string; count: number }>;
  averageDurationDays: number;
  delayedProjects: number;
  workflowDistribution: Array<{ status: ProjectWorkflowStatus; count: number }>;
};

export type FinancialAnalytics = {
  monthlyRevenue: Array<{ month: string; amount: number }>;
  monthlyPayments: Array<{ month: string; amount: number }>;
  outstandingInvoices: number;
  paymentStatusDistribution: Array<{ status: InvoiceStatus; count: number; total: number }>;
  averageInvoiceValue: number;
};

export type TeamAnalytics = {
  productivity: number;
  tasksCompleted: number;
  occupancyPercent: number;
  projectsPerEmployee: number;
  averageCompletionTimeHours: number;
  topPerformers: Array<{ id: string; fullName: string; tasksCompleted: number }>;
};

export type ModelAnalytics = {
  topModels: Array<{ id: string; modelCode: string; fullName: string; totalEarnings: number; projectCount: number }>;
  totalVideos: number;
  totalProjects: number;
  totalEarnings: number;
  utilizationPercent: number;
};

export type ClientAnalytics = {
  topClients: Array<{ id: string; clientCode: string; name: string; lifetimeValue: number; projectCount: number }>;
  averageInvoiceValue: number;
  totalClients: number;
};

export type ShootAnalytics = {
  shootsThisWeek: number;
  completedShoots: number;
  cancelledShoots: number;
  upcomingShoots: number;
};

export type TaskAnalytics = {
  tasksToday: number;
  overdue: number;
  completed: number;
  blocked: number;
};

export type DeliveryAnalytics = {
  totalDeliveries: number;
  totalDownloads: number;
  pendingReviews: number;
  approvedVideos: number;
};

export type DashboardData = {
  business: BusinessOverview;
  projectPerformance: ProjectPerformance;
  financial: FinancialAnalytics;
  team: TeamAnalytics;
  models: ModelAnalytics;
  clients: ClientAnalytics;
  shoots: ShootAnalytics;
  tasks: TaskAnalytics;
  deliveries: DeliveryAnalytics;
};

export type ReportType = "monthly" | "financial" | "client" | "project" | "team" | "model";
export type ExportFormat = "csv" | "excel" | "pdf";
