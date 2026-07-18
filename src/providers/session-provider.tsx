"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

import type { SessionUser, SessionStatus } from "@/types/auth";

type SessionContextValue = {
  user: SessionUser;
  status: SessionStatus;
  setUser: (user: SessionUser) => void;
  setStatus: (status: SessionStatus) => void;
};

const SessionContext = createContext<SessionContextValue | undefined>(
  undefined
);

export function SessionProvider({
  children,
  initialUser = null,
}: {
  children: ReactNode;
  initialUser?: SessionUser;
}) {
  const [user, setUser] = useState<SessionUser>(initialUser);
  const [status, setStatus] = useState<SessionStatus>(
    initialUser ? "authenticated" : "unauthenticated"
  );

  const handleSetUser = useCallback((value: SessionUser) => {
    setUser(value);
    setStatus(value ? "authenticated" : "unauthenticated");
  }, []);

  return (
    <SessionContext.Provider
      value={{ user, status, setUser: handleSetUser, setStatus }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
