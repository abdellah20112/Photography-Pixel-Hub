/* ============================================
   Storage Key Builder
   Generates structured object keys for R2.
   Folder structure:
     projects/
       PR-000001/
         preview.mp4
         final.mp4
         thumbnail.jpg
         assets/
         music/
         invoices/
         contracts/
   ============================================ */

import { randomUUID } from "crypto";

/** Get file extension from filename (lowercase, no dot). */
function ext(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

/**
 * Build a storage key for a project file.
 * Structure: projects/{projectCode}/{subfolder?}/{uuid}.{ext}
 */
export function buildStorageKey(params: {
  projectCode: string;
  fileName: string;
  subfolder?: "assets" | "music" | "invoices" | "contracts" | null;
}): string {
  const { projectCode, fileName, subfolder } = params;
  const extension = ext(fileName);
  const uuid = randomUUID();

  const parts = ["projects", projectCode];
  if (subfolder) parts.push(subfolder);
  parts.push(`${uuid}${extension ? `.${extension}` : ""}`);

  return parts.join("/");
}

/**
 * Build a storage key for a preview video.
 * Structure: projects/{projectCode}/preview.mp4
 */
export function buildPreviewKey(projectCode: string, extension = "mp4"): string {
  return `projects/${projectCode}/preview.${extension}`;
}

/**
 * Build a storage key for a final video.
 * Structure: projects/{projectCode}/final.mp4
 */
export function buildFinalKey(projectCode: string, extension = "mp4"): string {
  return `projects/${projectCode}/final.${extension}`;
}

/**
 * Build a storage key for a thumbnail.
 * Structure: projects/{projectCode}/thumbnail.jpg
 */
export function buildThumbnailKey(projectCode: string): string {
  return `projects/${projectCode}/thumbnail.jpg`;
}

/**
 * Build a storage key for a video upload (legacy format for compatibility).
 * Structure: videos/{projectId}/{uuid}.{ext}
 */
export function buildVideoKey(projectId: string, fileName: string): string {
  const extension = ext(fileName);
  const uuid = randomUUID();
  return `videos/${projectId}/${uuid}${extension ? `.${extension}` : ""}`;
}

/**
 * Build the prefix for listing all files in a project.
 * Structure: projects/{projectCode}/
 */
export function buildProjectPrefix(projectCode: string): string {
  return `projects/${projectCode}/`;
}

/** Extract the project code from a storage key. */
export function extractProjectCode(key: string): string | null {
  const match = key.match(/^projects\/([A-Z]+-\d+)\//);
  return match?.[1] ?? null;
}

/** Check if a key is a preview video. */
export function isPreviewKey(key: string): boolean {
  return key.includes("/preview.");
}

/** Check if a key is a final video. */
export function isFinalKey(key: string): boolean {
  return key.includes("/final.");
}
