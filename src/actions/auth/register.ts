"use server";

import { userRepository } from "@/repositories/user.repository";
import { createSession } from "@/lib/auth/session";
import { registerSchema } from "@/lib/validations/auth";
import type { AuthenticatedUser } from "@/types/auth";

/* ============================================
   Register Server Action — Stabilization stub
   To be fully implemented in a future sprint.
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

  const existing = await userRepository.findByEmail(email);
  if (existing) {
    return { success: false, error: "البريد الإلكتروني مستخدم بالفعل" };
  }

  const user = await userRepository.create({
    email,
    name,
    password,
    role: "PHOTOGRAPHER",
  });

  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
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
