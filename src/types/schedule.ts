import type { Shoot, ShootAssignment, Project, TeamMember, Model } from "@prisma/client";

/* ============================================
   Schedule Types
   ============================================ */

export type ShootTableRow = {
  id: string;
  shootCode: string;
  projectId: string;
  title: string;
  description: string | null;
  location: string | null;
  date: Date;
  startTime: Date;
  endTime: Date;
  status: Shoot["status"];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  project: { id: string; name: string; projectCode: string };
  assignmentCount: number;
};

export type PaginatedShoots = {
  items: ShootTableRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ShootWithAssignments = Shoot & {
  project: Pick<Project, "id" | "name" | "projectCode">;
  assignments: (ShootAssignment & {
    teamMember: Pick<TeamMember, "id" | "fullName" | "employeeCode"> | null;
    model: Pick<Model, "id" | "fullName" | "modelCode"> | null;
  })[];
};

export type CalendarEvent = {
  id: string;
  shootCode: string;
  title: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  status: Shoot["status"];
  location: string | null;
  project: { id: string; name: string; projectCode: string };
};

export type ShootDashboardStats = {
  todayShoots: number;
  tomorrowShoots: number;
  upcomingWeek: number;
  busyTeam: number;
  availableTeam: number;
};

export type ConflictResult = {
  hasConflict: boolean;
  conflicts: Array<{
    type: "team_member" | "model";
    id: string;
    name: string;
    reason: string;
  }>;
};
