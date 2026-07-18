import { z } from "zod";

import { VIDEO_LIMITS } from "@/lib/constants";

/* ============================================
   Video Validation Schemas
   Arabic validation messages.
   ============================================ */

/* ── Enum-like schemas ───────────────────── */

export const videoStatusSchema = z.enum([
  "UPLOADING",
  "PROCESSING",
  "READY",
  "FAILED",
  "DELETED",
]);

export const videoFilterSchema = z.enum([
  "ready",
  "processing",
  "uploading",
  "failed",
  "deleted",
]);

export const videoSortSchema = z.enum([
  "newest",
  "oldest",
  "duration",
  "size",
]);

/* ── Create / Update ─────────────────────── */

export const createVideoSchema = z.object({
  projectId: z.string().min(1, "المشروع مطلوب"),
  title: z
    .string()
    .min(1, "العنوان مطلوب")
    .max(200, "العنوان يجب أن يكون 200 حرفاً كحد أقصى"),
  originalFileName: z.string().min(1, "اسم الملف مطلوب"),
  storageKey: z.string().min(1, "مفتاح التخزين مطلوب"),
  storageBucket: z.string().min(1, "اسم الحاوية مطلوب"),
  mimeType: z.string().min(1, "نوع الملف مطلوب"),
  extension: z.string().min(1, "امتداد الملف مطلوب"),
  fileSize: z.coerce.bigint().positive("الحجم يجب أن يكون موجباً"),
  duration: z.coerce.number().int().positive().optional(),
  width: z.coerce.number().int().positive().optional(),
  height: z.coerce.number().int().positive().optional(),
});

export const updateVideoSchema = z.object({
  title: z
    .string()
    .min(1, "العنوان مطلوب")
    .max(200, "العنوان يجب أن يكون 200 حرفاً كحد أقصى")
    .optional(),
  status: videoStatusSchema.optional(),
  duration: z.coerce.number().int().positive().optional(),
  width: z.coerce.number().int().positive().optional(),
  height: z.coerce.number().int().positive().optional(),
  thumbnailUrl: z.string().url("رابط المصغرة غير صالح").optional().or(z.literal("")),
  streamUrl: z.string().url("رابط البث غير صالح").optional().or(z.literal("")),
  downloadUrl: z.string().url("رابط التحميل غير صالح").optional().or(z.literal("")),
});

/* ── Query / List ────────────────────────── */

export const videoQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .refine(
      (val) => [12, 24, 48, 96].includes(val),
      "عدد العناصر في الصفحة غير صالح"
    )
    .default(12),
  projectId: z.string().optional(),
  search: z.string().optional(),
  filter: videoFilterSchema.optional(),
  sort: videoSortSchema.optional(),
});

/* ── Types ───────────────────────────────── */

export type CreateVideoInput = z.infer<typeof createVideoSchema>;
export type UpdateVideoInput = z.infer<typeof updateVideoSchema>;
export type VideoQueryInput = z.infer<typeof videoQuerySchema>;
export type VideoStatusValue = z.infer<typeof videoStatusSchema>;
export type VideoFilterValue = z.infer<typeof videoFilterSchema>;
export type VideoSortValue = z.infer<typeof videoSortSchema>;

/* ── Upload size validation helper ─────────── */

export function validateFileSize(size: number): boolean {
  return size > 0 && size <= VIDEO_LIMITS.MAX_VIDEO_SIZE;
}

export function validateFileType(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return (VIDEO_LIMITS.ALLOWED_VIDEO_FORMATS as readonly string[]).includes(ext);
}

export function validateMimeType(mimeType: string): boolean {
  const allowed = [
    "video/mp4",
    "video/quicktime",
    "video/webm",
  ];
  return allowed.includes(mimeType);
}
