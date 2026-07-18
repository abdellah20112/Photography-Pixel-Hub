import { z } from "zod";

/* ============================================
   Download Validation Schemas
   ============================================ */

export const createDownloadSchema = z.object({
  videoId: z.string().uuid("معرف الفيديو غير صالح"),
  clientId: z.string().uuid("معرف العميل غير صالح"),
  projectId: z.string().uuid("معرف المشروع غير صالح"),
  ip: z
    .string()
    .regex(
      /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
      "عنوان IP غير صالح"
    )
    .optional(),
  userAgent: z.string().max(500).optional(),
});

export const downloadQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
  videoId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
});

export type CreateDownloadInput = z.infer<typeof createDownloadSchema>;
export type DownloadQueryInput = z.infer<typeof downloadQuerySchema>;
