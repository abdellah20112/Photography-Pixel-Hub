"use client";

import { useState, useEffect, useRef } from "react";

import { accessDeliveryAction } from "@/actions/deliveries/access-delivery";
import { DeliveryPortal } from "@/components/delivery/delivery-portal";
import { PasswordScreen } from "@/components/delivery/password-screen";
import { ExpiredScreen } from "@/components/delivery/expired-screen";
import { DisabledScreen } from "@/components/delivery/disabled-screen";
import type { PublicDeliveryData } from "@/types/delivery";

/* ============================================
   DeliveryPortalAccess — Handles access flow
   1. Calls accessDeliveryAction on mount
   2. Shows password screen if needed
   3. Renders DeliveryPortal with signed URLs
   ============================================ */

type DeliveryPortalAccessProps = {
  slug: string;
};

export function DeliveryPortalAccess({ slug }: DeliveryPortalAccessProps) {
  const [data, setData] = useState<PublicDeliveryData | null>(null);
  const [status, setStatus] = useState<"loading" | "active" | "expired" | "disabled" | "password-required">("loading");
  const [error, setError] = useState("");
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    let active = true;
    (async () => {
      const result = await accessDeliveryAction(slug);
      if (!active) return;
      if (result.success && result.data) {
        setData(result.data);
        setStatus("active");
      } else {
        if (result.status === "expired") {
          setStatus("expired");
        } else if (result.status === "disabled") {
          setStatus("disabled");
        } else if (result.status === "password-required") {
          setStatus("password-required");
          setError(result.error ?? "كلمة المرور مطلوبة");
        } else {
          setStatus("disabled");
          setError(result.error ?? "غير متاح");
        }
      }
    })();
    return () => { active = false };
  }, [slug]);

  if (status === "loading") {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </main>
    );
  }

  if (status === "expired") {
    return <ExpiredScreen />;
  }

  if (status === "disabled") {
    return <DisabledScreen />;
  }

  if (status === "password-required") {
    return (
      <PasswordScreen
        slug={slug}
        onSuccess={(d) => {
          setData(d);
          setStatus("active");
        }}
      />
    );
  }

  if (data) {
    return <DeliveryPortal data={data} slug={slug} />;
  }

  return <DisabledScreen />;
}
