"use server";

import { projectFileService } from "@/services/project-file.service";
import { projectService } from "@/services/project.service";
import { getCurrentUser } from "@/lib/auth/session";

/* ============================================
   Get Project Files Server Action
   ============================================ */

export async function getProjectFilesAction(projectId: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const project = await projectService.getById(projectId);
  if (!project) return [];

  const files = await projectFileService.listByProject(projectId);

  return files.map((f) => ({
    id: f.id,
    fileType: f.fileType,
    storageKey: f.storageKey,
    fileName: f.fileName,
    fileSize: f.fileSize,
    mimeType: f.mimeType,
    createdAt: f.createdAt,
    projectId: f.projectId,
  }));
}
