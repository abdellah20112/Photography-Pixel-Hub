import { Clock } from "lucide-react";

import { BRANDING } from "@/config/branding";

/* ============================================
   ExpiredScreen — Delivery expired page
   ============================================ */

export function ExpiredScreen() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
        <Clock className="h-6 w-6 text-amber-500" />
      </span>
      <div className="space-y-2">
        <h1 className="text-xl font-bold tracking-tight">انتهت صلاحية التسليم</h1>
        <p className="text-sm text-muted-foreground">
          انتهت فترة الوصول إلى هذا التسليم. يرجى التواصل مع المصور لتمديد الفترة.
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
