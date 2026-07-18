import { Ban } from "lucide-react";

import { BRANDING } from "@/config/branding";

/* ============================================
   DisabledScreen — Delivery disabled page
   ============================================ */

export function DisabledScreen() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
        <Ban className="h-6 w-6 text-destructive" />
      </span>
      <div className="space-y-2">
        <h1 className="text-xl font-bold tracking-tight">التسليم غير متاح</h1>
        <p className="text-sm text-muted-foreground">
          هذا التسليم غير متاح حالياً. قد يكون تم تعطيله من قبل المصور.
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BRANDING.logo.full} alt={BRANDING.companyName} className="h-4 w-4 rounded object-contain" />
        {BRANDING.companyName}
      </div>
    </main>
  );
}
