import { z } from "zod";

import { nameSchema, phoneSchema, emailSchema } from "./auth";

/* ============================================
   Model Validation Schemas
   Arabic validation messages.
   ============================================ */

/* ── Enum-like schemas ───────────────────── */

export const modelStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const modelFilterSchema = z.enum(["all", "active", "inactive"]);

export const modelSortSchema = z.enum(["newest", "oldest", "alphabetical"]);

export const paymentStatusSchema = z.enum(["PENDING", "PARTIALLY_PAID", "PAID"]);

export const paymentFilterSchema = z.enum(["all", "pending", "partially_paid", "paid"]);

/* ── Create / Update ─────────────────────── */

export const createModelSchema = z.object({
  fullName: nameSchema,
  phone: z.string().min(1, "الهاتف مطلوب"),
  whatsapp: z.string().optional().or(z.literal("")),
  email: emailSchema.optional().or(z.literal("")),
  photo: z.string().optional().or(z.literal("")),
  notes: z.string().max(1000, "الملاحظات يجب أن تكون 1000 حرف كحد أقصى").optional().or(z.literal("")),
  status: modelStatusSchema,
});

export const updateModelSchema = z.object({
  fullName: nameSchema,
  phone: z.string().min(1, "الهاتف مطلوب"),
  whatsapp: z.string().optional().or(z.literal("")),
  email: emailSchema.optional().or(z.literal("")),
  photo: z.string().optional().or(z.literal("")),
  notes: z.string().max(1000, "الملاحظات يجب أن تكون 1000 حرف كحد أقصى").optional().or(z.literal("")),
  status: modelStatusSchema,
});

/* ── Assignment ──────────────────────────── */

export const assignModelSchema = z.object({
  projectId: z.string().min(1, "المشروع مطلوب"),
  modelId: z.string().min(1, "الموديل مطلوب"),
  videosCount: z.coerce.number().int().min(1, "عدد الفيديوهات يجب أن يكون 1 على الأقل"),
  notes: z.string().optional().or(z.literal("")),
});

export const updateAssignmentSchema = z.object({
  videosCount: z.coerce.number().int().min(1, "عدد الفيديوهات يجب أن يكون 1 على الأقل"),
  paymentStatus: paymentStatusSchema,
  notes: z.string().optional().or(z.literal("")),
});

/* ── Query / List ────────────────────────── */

export const modelQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().refine(
    (val) => [10, 25, 50, 100].includes(val),
    "عدد العناصر في الصفحة غير صالح"
  ).default(10),
  search: z.string().optional(),
  filter: modelFilterSchema.optional(),
  sort: modelSortSchema.optional(),
});

/* ── Types ───────────────────────────────── */

export type CreateModelInput = z.infer<typeof createModelSchema>;
export type UpdateModelInput = z.infer<typeof updateModelSchema>;
export type AssignModelInput = z.infer<typeof assignModelSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type ModelQueryInput = z.infer<typeof modelQuerySchema>;
export type ModelStatusValue = z.infer<typeof modelStatusSchema>;
export type ModelFilterValue = z.infer<typeof modelFilterSchema>;
export type ModelSortValue = z.infer<typeof modelSortSchema>;
export type PaymentStatusValue = z.infer<typeof paymentStatusSchema>;
