import type { UserRole as PrismaUserRole } from "@prisma/client";

/* ============================================
   Auth Types
   Aligned with the Prisma UserRole enum.
   ============================================ */

export type UserRole = PrismaUserRole;

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string | null;
};

export type SessionUser = AuthenticatedUser | null;

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";
