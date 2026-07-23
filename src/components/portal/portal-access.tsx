"use client";

import { useState, useEffect, useCallback, useRef } from "react";

import { getPortalDataAction, type PortalData } from "@/actions/public/get-portal-data";
import { PortalPasswordGate } from "@/components/portal/portal-password-gate";
import { PortalExpired } from "@/components/portal/portal-expired";
import { PortalNotFound } from "@/components/portal/portal-not-found";
import { PortalSkeleton } from "@/components/portal/portal-skeleton";

/* ============================================
   PortalAccess — Access wrapper
   Handles token validation, password protection,
   and expiry checks before rendering children.
   Pattern mirrors DeliveryPortalAccess.
   ============================================ */

type PortalAccessProps = {
  token: string;
  children: (data: PortalData) => React.ReactNode;
};

export function PortalAccess({ token, children }: PortalAccessProps) {
  const [data, setData] = useState<PortalData | null>(null);
  const [status, setStatus] = useState<
    "loading" | "active" | "expired" | "not-found" | "password-required"
  >("loading");
  const [error, setError] = useState("");
  const [projectName, setProjectName] = useState<string | undefined>();
  const [passwordLoading, setPasswordLoading] = useState(false);
  const hasFetched = useRef(false);

  const fetchData = useCallback(
    async (password?: string) => {
      const result = await getPortalDataAction(token, password);

      if (result.success) {
        setData(result.data);
        setStatus("active");
        return;
      }

      if (result.status === "not-found") {
        setStatus("not-found");
        return;
      }

      if (result.status === "expired") {
        setStatus("expired");
        setProjectName(result.projectName);
        return;
      }

      if (result.status === "password-required") {
        setStatus("password-required");
        setError(result.error ?? "كلمة المرور مطلوبة");
        setProjectName(result.projectName);
        return;
      }

      setStatus("not-found");
    },
    [token],
  );

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    let active = true;
    (async () => {
      await fetchData();
      if (!active) return;
    })();
    return () => {
      active = false;
    };
  }, [fetchData]);

  const handleUnlock = useCallback(
    async (password: string) => {
      setPasswordLoading(true);
      setError("");
      await fetchData(password);
      setPasswordLoading(false);
    },
    [fetchData],
  );

  if (status === "loading") {
    return <PortalSkeleton />;
  }

  if (status === "not-found") {
    return <PortalNotFound />;
  }

  if (status === "expired") {
    return <PortalExpired />;
  }

  if (status === "password-required") {
    return (
      <PortalPasswordGate
        projectName={projectName}
        error={error}
        onUnlock={handleUnlock}
        loading={passwordLoading}
      />
    );
  }

  if (data) {
    return <>{children(data)}</>;
  }

  return <PortalNotFound />;
}
