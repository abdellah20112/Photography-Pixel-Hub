import { z } from "zod";

import { nameSchema } from "./auth";

/* ============================================
   Project Validation Schemas
   Arabic validation messages.
   ============================================ */

/* ── Enum-like schemas ───────────────────── */

export const projectStatusSchema = z.enum([
  "DRAFT",
  "IN_PROGRESS",
  "READY",
  "DOWNLOAD_ENABLED",
  "COMPLETED",
  "ARCHIVED",
]);

export const retentionPeriodSchema = z.enum([
  "TWENTY_FOUR_HOURS",
  "FORTY_EIGHT_HOURS",
  "SEVENTY_TWO_HOURS",
  "SEVEN_DAYS",
  "CUSTOM",
]);

export const projectFilterSchema = z.enum([
  "all",
  "draft",
  "in_progress",
  "ready",
  "download_enabled",
  "completed",
  "archived",
]);

export const projectSortSchema = z.enum([
  "newest",
  "oldest",
  "deadline",
  "alphabetical",
]);

/* ── Create / Update ─────────────────────── */

export const createProjectSchema = z.object({
  clientId: z.string().min(1, "العميل مطلوب"),
  name: nameSchema,
  description: z
    .string()
    .max(500, "الوصف يجب أن يكون 500 حرفاً كحد أقصى")
    .optional()
    .or(z.literal("")),
  retentionPeriod: retentionPeriodSchema,
  deadline: z.coerce.date({
    message: "الموعد النهائي غير صالح",
  }),
  status: projectStatusSchema,
});

export const updateProjectSchema = z.object({
  clientId: z.string().min(1, "العميل مطلوب"),
  name: nameSchema,
  description: z
    .string()
    .max(500, "الوصف يجب أن يكون 500 حرفاً كحد أقصى")
    .optional()
    .or(z.literal("")),
  retentionPeriod: retentionPeriodSchema,
  deadline: z.coerce.date({
    message: "الموعد النهائي غير صالح",
  }),
  status: projectStatusSchema,
});

/* ── Query / List ────────────────────────── */

export const projectQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .refine(
      (val) => [10, 25, 50, 100].includes(val),
      "عدد العناصر في الصفحة غير صالح"
    )
    .default(10),
  search: z.string().optional(),
  filter: projectFilterSchema.optional(),
  sort: projectSortSchema.optional(),
});

/* ── Types ───────────────────────────────── */

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectQueryInput = z.infer<typeof projectQuerySchema>;
export type ProjectStatusValue = z.infer<typeof projectStatusSchema>;
export type RetentionPeriodValue = z.infer<typeof retentionPeriodSchema>;
export type ProjectFilterValue = z.infer<typeof projectFilterSchema>;
export type ProjectSortValue = z.infer<typeof projectSortSchema>;
