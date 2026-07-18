import type { Client, Project, ActivityLog } from "@prisma/client";

/* ============================================
   Client Types — Application-level types
   (Repository-level types live in repositories/)
   ============================================ */

/** Client with related projects loaded. */
export type ClientWithProjects = Client & { projects: Project[] };

/** Client with project count for table display. */
export type ClientTableRow = {
  id: string;
  clientCode: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string;
  notes: string | null;
  status: Client["status"];
  archivedAt: Date | null;
  projectCount: number;
  createdAt: Date;
  updatedAt: Date;
};

/** Paginated client result. */
export type PaginatedClients = {
  items: ClientTableRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/** Client statistics for details page. */
export type ClientStatistics = {
  projects: number;
  videos: number;
  downloads: number;
  views: number;
};

/** Timeline entry derived from ActivityLog. */
export type ClientTimelineEntry = {
  id: string;
  type: ActivityLog["type"];
  entity: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
  } | null;
};

/** Client details with full relations. */
export type ClientDetails = Client & {
  projects: Project[];
  _count?: {
    projects: number;
    downloads: number;
    views: number;
  };
};
