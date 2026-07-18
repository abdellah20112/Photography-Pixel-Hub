import { z } from "zod";

import { nameSchema } from "./auth";

/* ============================================
   Delivery Validation Schemas
   Arabic validation messages.
   ============================================ */

/* ── Enum-like schemas ───────────────────── */

export const deliveryStatusSchema = z.enum([
  "ACTIVE",
  "EXPIRED",
  "DISABLED",
]);

export const deliveryFilterSchema = z.enum([
  "all",
  "active",
  "expired",
  "disabled",
]);

export const deliverySortSchema = z.enum([
  "newest",
  "oldest",
  "alphabetical",
]);

/* ── Create / Update ─────────────────────── */

export const createDeliverySchema = z.object({
  projectId: z.string().min(1, "المشروع مطلوب"),
  title: nameSchema,
  expiresAt: z.coerce.date({
    message: "الموعد النهائي غير صالح",
  }),
  downloadEnabled: z.boolean().default(true),
  allowStreaming: z.boolean().default(true),
  allowComments: z.boolean().default(false),
  passwordProtected: z.boolean().default(false),
  password: z
    .string()
    .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
    .optional()
    .or(z.literal("")),
  videoIds: z.array(z.string()).min(1, "اختر فيديو واحد على الأقل"),
});

export const updateDeliverySchema = z.object({
  title: nameSchema,
  expiresAt: z.coerce.date({
    message: "الموعد النهائي غير صالح",
  }),
  downloadEnabled: z.boolean(),
  allowStreaming: z.boolean(),
  allowComments: z.boolean(),
  passwordProtected: z.boolean(),
  password: z
    .string()
    .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
    .optional()
    .or(z.literal("")),
  videoIds: z.array(z.string()).min(1, "اختر فيديو واحد على الأقل"),
  status: deliveryStatusSchema.optional(),
});

/* ── Query / List ────────────────────────── */

export const deliveryQuerySchema = z.object({
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
  filter: deliveryFilterSchema.optional(),
  sort: deliverySortSchema.optional(),
});

/* ── Password Access ─────────────────────── */

export const deliveryPasswordSchema = z.object({
  slug: z.string().min(1, "الرابط مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

/* ── Types ───────────────────────────────── */

export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;
export type UpdateDeliveryInput = z.infer<typeof updateDeliverySchema>;
export type DeliveryQueryInput = z.infer<typeof deliveryQuerySchema>;
export type DeliveryStatusValue = z.infer<typeof deliveryStatusSchema>;
export type DeliveryFilterValue = z.infer<typeof deliveryFilterSchema>;
export type DeliverySortValue = z.infer<typeof deliverySortSchema>;
