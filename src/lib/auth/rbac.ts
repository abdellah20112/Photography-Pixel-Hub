import { getCurrentUser, requireUser, requireRole } from "@/lib/auth/session";
import type { UserRole } from "@prisma/client";

/* ============================================
   RBAC Utilities
   Role-Based Access Control helpers.
   Use these to protect Server Actions.
   ============================================ */

/** All roles in the system. */
export const ALL_ROLES: UserRole[] = [
  "OWNER",
  "ADMIN",
  "EDITOR",
  "MEDIA_BUYER",
  "PHOTOGRAPHER",
  "CLIENT",
];

/** Management roles — can access dashboard. */
export const MANAGEMENT_ROLES: UserRole[] = [
  "OWNER",
  "ADMIN",
  "EDITOR",
  "MEDIA_BUYER",
  "PHOTOGRAPHER",
];

/** Admin roles — full access. */
export const ADMIN_ROLES: UserRole[] = ["OWNER", "ADMIN"];

/** Check if a user has a specific role. */
export function hasRole(userRole: UserRole | undefined, ...roles: UserRole[]): boolean {
  if (!userRole) return false;
  return roles.includes(userRole);
}

/** Check if user is admin (OWNER or ADMIN). */
export function isAdmin(userRole: UserRole | undefined): boolean {
  return hasRole(userRole, "OWNER", "ADMIN");
}

/** Check if user is owner. */
export function isOwner(userRole: UserRole | undefined): boolean {
  return userRole === "OWNER";
}

/** Check if user can manage (admin or management). */
export function canManage(userRole: UserRole | undefined): boolean {
  return hasRole(userRole, ...MANAGEMENT_ROLES);
}

// ── Server-side guards ─────────────────────

/** Require any authenticated user. */
export async function requireAuth() {
  return requireUser();
}

/** Require admin (OWNER or ADMIN). */
export async function requireAdmin() {
  return requireRole("OWNER", "ADMIN");
}

/** Require management role (dashboard access). */
export async function requireManagement() {
  return requireRole(...MANAGEMENT_ROLES);
}

/** Get current user or null (for optional auth checks). */
export async function getOptionalUser() {
  return getCurrentUser();
}
