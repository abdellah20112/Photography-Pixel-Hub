import { z } from "zod";

import { emailSchema, nameSchema, phoneSchema } from "./auth";

/* ============================================
   Client Validation Schemas
   Arabic validation messages.
   ============================================ */

/* ── Enum-like schemas ───────────────────── */

export const clientStatusSchema = z.enum(["ACTIVE", "ARCHIVED", "BLOCKED"]);

export const clientFilterSchema = z.enum(["all", "active", "archived", "blocked"]);

export const clientSortSchema = z.enum(["newest", "oldest", "alphabetical"]);

/* ── Create / Update ─────────────────────── */

export const createClientSchema = z.object({
  name: nameSchema,
  company: z
    .string()
    .max(100, "اسم الشركة يجب أن يكون 100 حرف كحد أقصى")
    .optional()
    .or(z.literal("")),
  email: emailSchema,
  phone: phoneSchema,
  notes: z
    .string()
    .max(1000, "الملاحظات يجب أن تكون 1000 حرف كحد أقصى")
    .optional()
    .or(z.literal("")),
  status: clientStatusSchema,
});

export const updateClientSchema = z.object({
  name: nameSchema,
  company: z
    .string()
    .max(100, "اسم الشركة يجب أن يكون 100 حرف كحد أقصى")
    .optional()
    .or(z.literal("")),
  email: emailSchema,
  phone: phoneSchema,
  notes: z
    .string()
    .max(1000, "الملاحظات يجب أن تكون 1000 حرف كحد أقصى")
    .optional()
    .or(z.literal("")),
  status: clientStatusSchema,
});

/* ── Query / List ────────────────────────── */

export const clientQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().refine(
    (val) => [10, 25, 50, 100].includes(val),
    "عدد العناصر في الصفحة غير صالح"
  ).default(10),
  search: z.string().optional(),
  filter: clientFilterSchema.optional(),
  sort: clientSortSchema.optional(),
});

/* ── Types ───────────────────────────────── */

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ClientQueryInput = z.infer<typeof clientQuerySchema>;
export type ClientStatusValue = z.infer<typeof clientStatusSchema>;
export type ClientFilterValue = z.infer<typeof clientFilterSchema>;
export type ClientSortValue = z.infer<typeof clientSortSchema>;
