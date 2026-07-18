import type { Model, ProjectModel, Project } from "@prisma/client";

/* ============================================
   Model Types — Application-level types
   ============================================ */

/** Model row for table display. */
export type ModelTableRow = {
  id: string;
  modelCode: string;
  fullName: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  photo: string | null;
  status: Model["status"];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  projectCount: number;
};

/** Paginated model result. */
export type PaginatedModels = {
  items: ModelTableRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/** Model with assignments for profile page. */
export type ModelWithAssignments = Model & {
  projectModels: (ProjectModel & {
    project: Pick<Project, "id" | "name" | "projectCode">;
  })[];
};

/** Model statistics for profile/dashboard. */
export type ModelStatistics = {
  totalProjects: number;
  totalVideos: number;
  totalEarnings: number;
  pendingAmount: number;
  paidAmount: number;
};

/** Project model assignment row. */
export type AssignmentRow = {
  id: string;
  projectId: string;
  modelId: string;
  videosCount: number;
  pricePerVideo: number;
  totalAmount: number;
  paymentStatus: ProjectModel["paymentStatus"];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  model: {
    id: string;
    fullName: string;
    modelCode: string;
    phone: string;
    whatsapp: string | null;
    photo: string | null;
  };
};

/** Dashboard widget stats. */
export type ModelDashboardStats = {
  activeModels: number;
  busyToday: number;
  pendingPayments: number;
  topModels: Array<{
    id: string;
    modelCode: string;
    fullName: string;
    totalEarnings: number;
    projectCount: number;
  }>;
};
