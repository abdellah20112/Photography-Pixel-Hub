"use server";

import bcrypt from "bcryptjs";
import { userRepository } from "@/repositories/user.repository";
import { getCurrentUser } from "@/lib/auth/session";
import type { UserRole } from "@prisma/client";

/* ============================================
   Bootstrap Service
   Secure first OWNER account creation.
   - Only works if NO owner exists yet.
   - Automatically disabled once an OWNER exists.
   - Never allows multiple bootstrap owners.
   ============================================ */

export const bootstrapService = {
  /** Check if bootstrap is available (no OWNER exists). */
  async isBootstrapAvailable(): Promise<boolean> {
    const ownerCount = await userRepository.count({
      role: "OWNER" as UserRole,
    });
    return ownerCount === 0;
  },

  /**
   * Create the first OWNER account.
   * Throws if an OWNER already exists.
   */
  async createOwner(params: {
    email: string;
    name: string;
    password: string;
  }): Promise<{ success: boolean; error?: string }> {
    // Double-check: never allow if owner exists
    const isAvailable = await this.isBootstrapAvailable();
    if (!isAvailable) {
      return {
        success: false,
        error: "تم إنشاء حساب المالك بالفعل — Bootstrap معطّل",
      };
    }

    // Check if email already used
    const existing = await userRepository.findByEmail(params.email);
    if (existing) {
      return { success: false, error: "البريد الإلكتروني مستخدم بالفعل" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(params.password, 12);

    // Create OWNER
    await userRepository.create({
      email: params.email.trim().toLowerCase(),
      name: params.name.trim(),
      password: hashedPassword,
      role: "OWNER" as UserRole,
    });

    return { success: true };
  },
};

/** Server Action: Check bootstrap status (public). */
export async function checkBootstrapAction(): Promise<{
  available: boolean;
}> {
  const available = await bootstrapService.isBootstrapAvailable();
  return { available };
}

/** Server Action: Create first OWNER (public, only if no owner exists). */
export async function createOwnerAction(params: {
  email: string;
  name: string;
  password: string;
}): Promise<{ success: boolean; error?: string }> {
  // If already authenticated, they don't need bootstrap
  const currentUser = await getCurrentUser();
  if (currentUser) {
    return { success: false, error: "أنت مسجّل الدخول بالفعل" };
  }

  return bootstrapService.createOwner(params);
}
