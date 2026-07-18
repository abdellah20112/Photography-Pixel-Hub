import { z } from "zod";
import { nameSchema } from "./auth";

/* ============================================
   Schedule Validation Schemas
   ============================================ */

export const shootStatusSchema = z.enum([
  "SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED",
]);

export const shootFilterSchema = z.enum([
  "all", "scheduled", "confirmed", "in_progress", "completed", "cancelled",
]);

export const shootSortSchema = z.enum(["newest", "oldest", "date_asc", "date_desc"]);

export const createShootSchema = z.object({
  projectId: z.string().min(1, "المشروع مطلوب"),
  title: nameSchema,
  description: z.string().max(1000).optional().or(z.literal("")),
  location: z.string().max(500).optional().or(z.literal("")),
  date: z.coerce.date({ message: "التاريخ مطلوب" }),
  startTime: z.coerce.date({ message: "وقت البداية مطلوب" }),
  endTime: z.coerce.date({ message: "وقت النهاية مطلوب" }),
  notes: z.string().max(1000).optional().or(z.literal("")),
}).refine((data) => data.endTime > data.startTime, {
  message: "وقت النهاية يجب أن يكون بعد وقت البداية",
  path: ["endTime"],
});

export const updateShootSchema = z.object({
  title: nameSchema,
  description: z.string().max(1000).optional().or(z.literal("")),
  location: z.string().max(500).optional().or(z.literal("")),
  date: z.coerce.date({ message: "التاريخ مطلوب" }),
  startTime: z.coerce.date({ message: "وقت البداية مطلوب" }),
  endTime: z.coerce.date({ message: "وقت النهاية مطلوب" }),
  status: shootStatusSchema.optional(),
  notes: z.string().max(1000).optional().or(z.literal("")),
}).refine((data) => data.endTime > data.startTime, {
  message: "وقت النهاية يجب أن يكون بعد وقت البداية",
  path: ["endTime"],
});

export const assignToShootSchema = z.object({
  shootId: z.string().min(1, "التصوير مطلوب"),
  teamMemberId: z.string().optional().or(z.literal("")),
  modelId: z.string().optional().or(z.literal("")),
  role: z.string().min(1, "الدور مطلوب"),
});

export const shootQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().refine(
    (val) => [10, 25, 50, 100].includes(val),
    "عدد العناصر في الصفحة غير صالح"
  ).default(25),
  search: z.string().optional(),
  projectId: z.string().optional(),
  filter: shootFilterSchema.optional(),
  sort: shootSortSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type CreateShootInput = z.infer<typeof createShootSchema>;
export type UpdateShootInput = z.infer<typeof updateShootSchema>;
export type AssignToShootInput = z.infer<typeof assignToShootSchema>;
export type ShootQueryInput = z.infer<typeof shootQuerySchema>;
export type ShootStatusValue = z.infer<typeof shootStatusSchema>;
export type ShootFilterValue = z.infer<typeof shootFilterSchema>;
export type ShootSortValue = z.infer<typeof shootSortSchema>;
