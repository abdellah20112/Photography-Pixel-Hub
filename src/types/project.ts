import type { Project, Video, Client, ActivityLog } from "@prisma/client";

/* ============================================
   Project Types — Application-level types
   (Repository-level types live in repositories/)
   ============================================ */

/** Project with related client and videos loaded. */
export type ProjectWithRelations = Project & {
  client: Client;
  videos: Video[];
};

/** Project row for table display. */
export type ProjectTableRow = {
  id: string;
  projectCode: string;
  clientId: string;
  name: string;
  description: string | null;
  status: Project["status"];
  retentionPeriod: Project["retentionPeriod"];
  deadline: Date | null;
  archivedAt: Date | null;
  videoCount: number;
  createdAt: Date;
  updatedAt: Date;
  client: {
    id: string;
    name: string;
    clientCode: string;
  };
};

/** Paginated project result. */
export type PaginatedProjects = {
  items: ProjectTableRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/** Project statistics for details page. */
export type ProjectStatistics = {
  videos: number;
  views: number;
  downloads: number;
  storageSize: number;
};

/** Project details with full relations. */
export type ProjectDetails = Project & {
  client: Client;
  videos: Video[];
  _count?: {
    videos: number;
    downloads: number;
    views: number;
  };
};
