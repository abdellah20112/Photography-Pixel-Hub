import type { ReactNode } from "react";
import { BRANDING } from "@/config/branding";

/* ============================================
   Auth Route Group Layout
   Centered full-screen layout for login/register.
   ============================================ */

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex flex-col items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRANDING.logo.full}
          alt={BRANDING.companyName}
          className="h-20 w-auto object-contain rounded-lg"
        />
        <h1 className="text-2xl font-bold tracking-tight">{BRANDING.companyName}</h1>
      </div>
      {children}
    </div>
  );
}
