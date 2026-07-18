import { z } from "zod";

import { nameSchema, emailSchema } from "./auth";

/* ============================================
   Team Validation Schemas
   Arabic validation messages.
   ============================================ */

export const teamRoleSchema = z.enum([
  "OWNER", "ADMIN", "PROJECT_MANAGER", "PHOTOGRAPHER",
  "VIDEOGRAPHER", "EDITOR", "DESIGNER", "MEDIA_BUYER", "ACCOUNTANT",
]);

export const teamMemberStatusSchema = z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE"]);

export const teamFilterSchema = z.enum(["all", "active", "inactive", "on_leave"]);

export const roleFilterSchema = z.enum([
  "all", "OWNER", "ADMIN", "PROJECT_MANAGER", "PHOTOGRAPHER",
  "VIDEOGRAPHER", "EDITOR", "DESIGNER", "MEDIA_BUYER", "ACCOUNTANT",
]);

export const teamSortSchema = z.enum(["newest", "oldest", "alphabetical"]);

export const createTeamMemberSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  phone: z.string().min(1, "الهاتف مطلوب"),
  photo: z.string().optional().or(z.literal("")),
  role: teamRoleSchema,
  status: teamMemberStatusSchema,
  joinDate: z.coerce.date({ message: "تاريخ الانضمام غير صالح" }),
  notes: z.string().max(1000, "الملاحظات يجب أن تكون 1000 حرف كحد أقصى").optional().or(z.literal("")),
});

export const updateTeamMemberSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  phone: z.string().min(1, "الهاتف مطلوب"),
  photo: z.string().optional().or(z.literal("")),
  role: teamRoleSchema,
  status: teamMemberStatusSchema,
  joinDate: z.coerce.date({ message: "تاريخ الانضمام غير صالح" }),
  notes: z.string().max(1000, "الملاحظات يجب أن تكون 1000 حرف كحد أقصى").optional().or(z.literal("")),
});

export const assignMemberSchema = z.object({
  projectId: z.string().min(1, "المشروع مطلوب"),
  teamMemberId: z.string().min(1, "الموظف مطلوب"),
  role: teamRoleSchema,
  notes: z.string().optional().or(z.literal("")),
});

export const updateAssignmentSchema = z.object({
  role: teamRoleSchema,
  notes: z.string().optional().or(z.literal("")),
  completed: z.boolean().optional(),
});

export const teamQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().refine(
    (val) => [10, 25, 50, 100].includes(val),
    "عدد العناصر في الصفحة غير صالح"
  ).default(10),
  search: z.string().optional(),
  filter: teamFilterSchema.optional(),
  roleFilter: roleFilterSchema.optional(),
  sort: teamSortSchema.optional(),
});

export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;
export type AssignMemberInput = z.infer<typeof assignMemberSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type TeamQueryInput = z.infer<typeof teamQuerySchema>;
export type TeamRoleValue = z.infer<typeof teamRoleSchema>;
export type TeamMemberStatusValue = z.infer<typeof teamMemberStatusSchema>;
export type TeamFilterValue = z.infer<typeof teamFilterSchema>;
export type RoleFilterValue = z.infer<typeof roleFilterSchema>;
export type TeamSortValue = z.infer<typeof teamSortSchema>;
