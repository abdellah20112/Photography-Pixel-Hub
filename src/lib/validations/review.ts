import { z } from "zod";

/* ============================================
   Review Comment Validation Schemas
   Arabic validation messages.
   ============================================ */

/* ── Enum-like schemas ───────────────────── */

export const commentStatusSchema = z.enum([
  "OPEN",
  "RESOLVED",
  "ARCHIVED",
]);

export const authorTypeSchema = z.enum([
  "CLIENT",
  "TEAM",
]);

export const commentFilterSchema = z.enum([
  "all",
  "open",
  "resolved",
  "archived",
]);

export const commentSortSchema = z.enum([
  "newest",
  "oldest",
  "timestamp",
]);

/* ── Create / Update ─────────────────────── */

export const createCommentSchema = z.object({
  videoId: z.string().min(1, "الفيديو مطلوب"),
  deliveryId: z.string().min(1, "التسليم مطلوب"),
  authorName: z
    .string()
    .min(2, "الاسم يجب أن يكون حرفين على الأقل")
    .max(50, "الاسم يجب أن يكون 50 حرفاً كحد أقصى"),
  authorEmail: z
    .string()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("البريد الإلكتروني غير صالح"),
  authorType: authorTypeSchema.default("CLIENT"),
  message: z
    .string()
    .min(1, "التعليق مطلوب")
    .max(1000, "التعليق يجب أن يكون 1000 حرف كحد أقصى"),
  timestampSeconds: z
    .coerce
    .number()
    .int("الطابع الزمني غير صالح")
    .min(0, "الطابع الزمني يجب أن يكون 0 أو أكثر")
    .max(86400, "الطابع الزمني غير صالح"),
  parentId: z.string().optional().or(z.literal("")),
});

export const updateCommentSchema = z.object({
  message: z
    .string()
    .min(1, "التعليق مطلوب")
    .max(1000, "التعليق يجب أن يكون 1000 حرف كحد أقصى"),
});

/* ── Query / List ────────────────────────── */

export const commentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .refine(
      (val) => [10, 25, 50, 100].includes(val),
      "عدد العناصر في الصفحة غير صالح"
    )
    .default(50),
  videoId: z.string().optional(),
  deliveryId: z.string().optional(),
  search: z.string().optional(),
  filter: commentFilterSchema.optional(),
  sort: commentSortSchema.optional(),
});

/* ── Types ───────────────────────────────── */

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type CommentQueryInput = z.infer<typeof commentQuerySchema>;
export type CommentStatusValue = z.infer<typeof commentStatusSchema>;
export type AuthorTypeValue = z.infer<typeof authorTypeSchema>;
export type CommentFilterValue = z.infer<typeof commentFilterSchema>;
export type CommentSortValue = z.infer<typeof commentSortSchema>;

/* ── Sanitization ─────────────────────────── */

/** Sanitize a comment message to prevent XSS. */
export function sanitizeMessage(message: string): string {
  return message
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim();
}
