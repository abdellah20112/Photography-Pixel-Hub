"use server";

import { projectService } from "@/services/project.service";
import { getCurrentUser } from "@/lib/auth/session";
import type { ProjectStatistics } from "@/types/project";

/* ============================================
   Get Project Details Server Action
   Returns project with statistics and timeline.
   ============================================ */

export async function getProjectDetailsAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const project = await projectService.getById(id);
  if (!project) return null;

  const statistics: ProjectStatistics = await projectService.getStatistics(id);

  const timeline = await projectService.getTimeline(id, 20);

  return {
    project,
    statistics,
    timeline,
  };
}
