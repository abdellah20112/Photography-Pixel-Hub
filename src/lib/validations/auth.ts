import { z } from "zod";

/* ── Common field schemas (reusable) ─────────────── */

export const emailSchema = z
  .string()
  .min(1, "البريد الإلكتروني مطلوب")
  .email("البريد الإلكتروني غير صالح");

export const passwordSchema = z
  .string()
  .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
  .regex(/[A-Z]/, "يجب أن تحتوي على حرف كبير واحد على الأقل")
  .regex(/[a-z]/, "يجب أن تحتوي على حرف صغير واحد على الأقل")
  .regex(/[0-9]/, "يجب أن تحتوي على رقم واحد على الأقل");

export const nameSchema = z
  .string()
  .min(2, "الاسم يجب أن يكون حرفين على الأقل")
  .max(50, "الاسم يجب أن يكون 50 حرفاً كحد أقصى");

/** Moroccan mobile phone — must start with 06 or 07, 10 digits total. */
export const moroccanPhoneSchema = z
  .string()
  .min(1, "رقم الهاتف مطلوب")
  .regex(
    /^0[67]\d{8}$/,
    "رقم الهاتف يجب أن يبدأ بـ 06 أو 07 ويتكون من 10 أرقام"
  );

/** Optional phone (used by models, team members, etc.). */
export const phoneSchema = moroccanPhoneSchema
  .optional()
  .or(z.literal(""));

/* ── Composite schemas ────────────────────────────── */

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
