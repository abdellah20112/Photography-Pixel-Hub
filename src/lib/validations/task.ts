import { z } from "zod";
import { nameSchema } from "./auth";

/* ============================================
   Task Validation Schemas
   ============================================ */

export const taskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE"]);
export const taskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export const taskFilterSchema = z.enum(["all", "todo", "in_progress", "in_review", "blocked", "done"]);
export const taskSortSchema = z.enum(["newest", "oldest", "due_date", "priority", "alphabetical"]);

export const createTaskSchema = z.object({
  projectId: z.string().min(1, "المشروع مطلوب"),
  shootId: z.string().optional().or(z.literal("")),
  parentTaskId: z.string().optional().or(z.literal("")),
  title: nameSchema,
  description: z.string().max(2000).optional().or(z.literal("")),
  priority: taskPrioritySchema.default("MEDIUM"),
  assignedTo: z.string().optional().or(z.literal("")),
  estimatedHours: z.coerce.number().min(0, "الساعات المقدرة يجب أن تكون موجبة").default(0),
  startDate: z.coerce.date().optional(),
  dueDate: z.coerce.date({ message: "تاريخ الاستحقاق مطلوب" }),
});

export const updateTaskSchema = z.object({
  title: nameSchema,
  description: z.string().max(2000).optional().or(z.literal("")),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assignedTo: z.string().optional().or(z.literal("")),
  estimatedHours: z.coerce.number().min(0).optional(),
  actualHours: z.coerce.number().min(0).optional(),
  startDate: z.coerce.date().optional(),
  dueDate: z.coerce.date({ message: "تاريخ الاستحقاق مطلوب" }),
  progress: z.coerce.number().int().min(0, "التقدم يجب أن يكون 0-100").max(100, "التقدم يجب أن يكون 0-100").optional(),
  order: z.coerce.number().int().optional(),
});

export const moveTaskSchema = z.object({
  taskId: z.string().min(1, "المهمة مطلوبة"),
  status: taskStatusSchema,
  order: z.coerce.number().int().default(0),
});

export const taskCommentSchema = z.object({
  taskId: z.string().min(1, "المهمة مطلوبة"),
  content: z.string().min(1, "التعليق مطلوب").max(2000, "التعليق يجب أن يكون 2000 حرف كحد أقصى"),
});

export const checklistItemSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب").max(200),
  completed: z.boolean().default(false),
  order: z.coerce.number().int().default(0),
});

export const taskQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().refine((v) => [10, 25, 50, 100].includes(v), "غير صالح").default(25),
  search: z.string().optional(),
  projectId: z.string().optional(),
  shootId: z.string().optional(),
  assignedTo: z.string().optional(),
  status: taskFilterSchema.optional(),
  priority: taskPrioritySchema.optional(),
  sort: taskSortSchema.optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type TaskCommentInput = z.infer<typeof taskCommentSchema>;
export type ChecklistItemInput = z.infer<typeof checklistItemSchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;
export type TaskStatusValue = z.infer<typeof taskStatusSchema>;
export type TaskPriorityValue = z.infer<typeof taskPrioritySchema>;
export type TaskFilterValue = z.infer<typeof taskFilterSchema>;
export type TaskSortValue = z.infer<typeof taskSortSchema>;
