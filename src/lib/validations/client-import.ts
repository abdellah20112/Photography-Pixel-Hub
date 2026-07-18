import { z } from "zod";

/* ============================================
   Client Import Validation Schema
   Validates CSV row data for client import.
   Infrastructure only — import not yet implemented.
   ============================================ */

export const clientImportRowSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  company: z.string().optional(),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export const clientImportSchema = z.array(clientImportRowSchema);

export type ClientImportRow = z.infer<typeof clientImportRowSchema>;
