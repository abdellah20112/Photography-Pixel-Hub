"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { userRepository } from "@/repositories/user.repository";
import { registerSchema } from "@/lib/validations/auth";
import type { AuthenticatedUser } from "@/types/auth";

/* ============================================
   Register Server Action
   Creates a new user in Supabase Auth, then
   creates the corresponding Prisma profile.
   ============================================ */

export type RegisterState = {
  success: boolean;
  error?: string;
  user?: AuthenticatedUser;
};

export async function registerAction(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = registerSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة",
    };
  }

  const { name, email, password } = parsed.data;

  // Check if email is already registered in Prisma
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    return { success: false, error: "البريد الإلكتروني مستخدم بالفعل" };
  }

  // Create user in Supabase Auth
  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (error || !data.user) {
    return {
      success: false,
      error: "فشل في إنشاء الحساب. يرجى المحاولة مرة أخرى.",
    };
  }

  // Create Prisma profile linked to Supabase Auth user
  const user = await userRepository.create({
    email,
    name,
    supabaseUid: data.user.id,
    role: "PHOTOGRAPHER",
  });

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    },
  };
}
