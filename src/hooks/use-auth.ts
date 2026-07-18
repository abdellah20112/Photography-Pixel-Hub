"use client";

import { useSession } from "@/providers/session-provider";

/**
 * Convenience hook for accessing session state.
 * Wraps `useSession` with derived booleans.
 */
export function useAuth() {
  const { user, status, setUser, setStatus } = useSession();

  return {
    user,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    isUnauthenticated: status === "unauthenticated",
    setUser,
    setStatus,
  };
}
