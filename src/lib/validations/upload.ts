import { z } from "zod";

import {
  UPLOAD_LIMITS,
  VIDEO_LIMITS,
  ALLOWED_FILE_TYPES,
} from "@/lib/constants";

/* ── File type checking ──────────────────── */

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function isAllowedFileType(filename: string): boolean {
  const ext = getFileExtension(filename);
  return (ALLOWED_FILE_TYPES.IMAGES as readonly string[]).includes(ext);
}

export function isAllowedVideoType(filename: string): boolean {
  const ext = getFileExtension(filename);
  return (VIDEO_LIMITS.ALLOWED_VIDEO_FORMATS as readonly string[]).includes(ext);
}

/* ── Zod schemas ─────────────────────────── */

export const fileValidationSchema = z.object({
  name: z.string().min(1),
  size: z
    .number()
    .positive()
    .max(
      UPLOAD_LIMITS.MAX_FILE_SIZE,
      `حجم الملف يتجاوز الحد المسموح (${UPLOAD_LIMITS.MAX_FILE_SIZE / (1024 * 1024)} ميجابايت)`
    ),
  type: z.string(),
});

export const videoValidationSchema = z.object({
  name: z.string().min(1),
  size: z
    .number()
    .positive()
    .max(
      VIDEO_LIMITS.MAX_VIDEO_SIZE,
      `حجم الفيديو يتجاوز الحد المسموح`
    ),
  type: z.string(),
});

export type FileValidationInput = z.infer<typeof fileValidationSchema>;
export type VideoValidationInput = z.infer<typeof videoValidationSchema>;
