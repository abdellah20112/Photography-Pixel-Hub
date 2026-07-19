import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { userRepository } from "@/repositories/user.repository";
import type { UserRole } from "@prisma/client";

/* ============================================
   User Service
   Business logic layer — calls repositories only.
   User creation goes through Supabase Auth first,
   then creates the Prisma profile.
   ============================================ */

export const userService = {
  async getById(id: string) {
    return userRepository.findById(id);
  },

  async getByEmail(email: string) {
    return userRepository.findByEmail(email);
  },

  async create(data: {
    email: string;
    name: string;
    password: string;
    role?: UserRole;
    avatar?: string;
  }) {
    // Create user in Supabase Auth
    const supabaseAdmin = createSupabaseAdminClient();
    const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { name: data.name, role: data.role ?? "PHOTOGRAPHER" },
    });

    if (error || !authData.user) {
      throw new Error(`Failed to create Supabase Auth user: ${error?.message}`);
    }

    // Create Prisma profile
    return userRepository.create({
      email: data.email,
      name: data.name,
      supabaseUid: authData.user.id,
      role: data.role ?? "PHOTOGRAPHER",
      avatar: data.avatar,
    });
  },

  async update(id: string, data: {
    name?: string;
    email?: string;
    avatar?: string;
  }) {
    return userRepository.update(id, data);
  },

  async delete(id: string) {
    return userRepository.delete(id);
  },

  async list(params: {
    skip?: number;
    take?: number;
    role?: UserRole;
  }) {
    return userRepository.findMany({
      skip: params.skip,
      take: params.take,
      where: params.role ? { role: params.role } : undefined,
      orderBy: { createdAt: "desc" },
    });
  },

  async count(role?: UserRole) {
    return userRepository.count(role ? { role } : undefined);
  },
};
