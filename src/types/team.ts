import type { TeamMember, ProjectAssignment, Project, TeamRole, TeamMemberStatus } from "@prisma/client";

/* ============================================
   Team Types
   ============================================ */

export type TeamMemberTableRow = {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  photo: string | null;
  role: TeamRole;
  status: TeamMemberStatus;
  joinDate: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  activeProjectCount: number;
};

export type PaginatedTeamMembers = {
  items: TeamMemberTableRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type TeamMemberWithAssignments = TeamMember & {
  projectAssignments: (ProjectAssignment & {
    project: Pick<Project, "id" | "name" | "projectCode">;
  })[];
};

export type TeamMemberStatistics = {
  activeProjects: number;
  completedProjects: number;
  projectsThisMonth: number;
};

export type AssignmentRow = {
  id: string;
  projectId: string;
  teamMemberId: string;
  role: TeamRole;
  assignedAt: Date;
  completedAt: Date | null;
  notes: string | null;
  member: {
    id: string;
    fullName: string;
    employeeCode: string;
    phone: string;
    photo: string | null;
  };
};

export type TeamDashboardStats = {
  activeEmployees: number;
  busyEmployees: number;
  editorsWorking: number;
  photographersWorking: number;
};
