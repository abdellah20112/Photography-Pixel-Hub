import { requireRole } from "@/lib/auth/session";
import type { UserRole } from "@/types/auth";

/* ============================================
   Role Permissions & Route Guards
   ============================================ */

/**
 * Role hierarchy for reference:
 *
 * OWNER       — Full access (everything)
 * ADMIN       — Everything except owner settings
 * EDITOR      — Projects + Uploads only
 * MEDIA_BUYER — Read-only dashboard + Clients
 * PHOTOGRAPHER— Uploads only
 */

export type { UserRole };

/* ── Route Guard Helpers ─────────────────── */

/** Require the OWNER role. */
export function requireOwner() {
  return requireRole("OWNER");
}

/** Require OWNER or ADMIN. */
export function requireAdmin() {
  return requireRole("OWNER", "ADMIN");
}

/** Require OWNER, ADMIN, or EDITOR. */
export function requireEditor() {
  return requireRole("OWNER", "ADMIN", "EDITOR");
}

/** Require OWNER, ADMIN, or MEDIA_BUYER. */
export function requireMediaBuyer() {
  return requireRole("OWNER", "ADMIN", "MEDIA_BUYER");
}

/** Require OWNER, ADMIN, EDITOR, or PHOTOGRAPHER. */
export function requirePhotographer() {
  return requireRole("OWNER", "ADMIN", "EDITOR", "PHOTOGRAPHER");
}

/* ── Role Hierarchy (for reference) ──────── */

export const ROLE_HIERARCHY: readonly UserRole[] = [
  "OWNER",
  "ADMIN",
  "EDITOR",
  "MEDIA_BUYER",
  "PHOTOGRAPHER",
  "CLIENT",
] as const;

/**
 * Check whether a role has sufficient privilege.
 * Lower index = higher privilege.
 */
export function hasMinimumRole(
  userRole: UserRole,
  minRole: UserRole
): boolean {
  const userIdx = ROLE_HIERARCHY.indexOf(userRole);
  const minIdx = ROLE_HIERARCHY.indexOf(minRole);
  return userIdx !== -1 && minIdx !== -1 && userIdx <= minIdx;
}
