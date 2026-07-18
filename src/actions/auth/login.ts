"use server";

import { headers } from "next/headers";

import { authService } from "@/services/auth.service";
import { loginSchema } from "@/lib/validations/auth";
import { getCurrentUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import {
  AuthError,
  InvalidCredentialsError,
  RateLimitExceededError,
} from "@/lib/auth/errors";
import type { AuthenticatedUser } from "@/types/auth";

/* ============================================
   Login Server Action
   ============================================ */

export type LoginState = {
  success: boolean;
  error?: string;
  user?: AuthenticatedUser;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  // Prevent authenticated users from logging in again
  const existing = await getCurrentUser();
  if (existing) {
    return { success: true, user: existing };
  }

  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة",
    };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? undefined;
  const userAgent = h.get("user-agent") ?? undefined;

  try {
    const user = await authService.login(parsed.data.email, parsed.data.password, {
      ip,
      userAgent,
    });

    return { success: true, user };
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return { success: false, error: err.message };
    }

    if (err instanceof InvalidCredentialsError) {
      return { success: false, error: err.message };
    }

    if (err instanceof AuthError) {
      return { success: false, error: err.message };
    }

    // Never reveal internal errors to the client
    return {
      success: false,
      error: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
    };
  }
}

/** Redirect path after successful login. */
export const LOGIN_REDIRECT = ROUTES.DASHBOARD;
