import { userRepository } from "@/repositories/user.repository";
import type { UserRole } from "@prisma/client";

/* ============================================
   User Service
   Business logic layer — calls repositories only.
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
    return userRepository.create({
      email: data.email,
      name: data.name,
      password: data.password,
      role: data.role ?? "PHOTOGRAPHER",
      avatar: data.avatar,
    });
  },

  async update(id: string, data: {
    name?: string;
    email?: string;
    password?: string;
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
