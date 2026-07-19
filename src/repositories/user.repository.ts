import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/* ============================================
   User Repository
   The ONLY layer that interacts with Prisma
   for User operations.
   ============================================ */

export type UserWithRelations = Prisma.UserGetPayload<{}>;
export type UserCreateInput = Prisma.UserCreateInput;
export type UserUpdateInput = Prisma.UserUpdateInput;
export type UserWhereInput = Prisma.UserWhereInput;
export type UserWhereUniqueInput = Prisma.UserWhereUniqueInput;

export const userRepository = {
  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findBySupabaseUid(supabaseUid: string) {
    return prisma.user.findUnique({ where: { supabaseUid } });
  },

  create(data: UserCreateInput) {
    return prisma.user.create({ data });
  },

  update(id: string, data: UserUpdateInput) {
    return prisma.user.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.user.delete({ where: { id } });
  },

  findMany(params: {
    where?: UserWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }) {
    return prisma.user.findMany(params);
  },

  count(where?: UserWhereInput) {
    return prisma.user.count({ where });
  },
};
