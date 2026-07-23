import { FileQuestion } from "lucide-react";

import { BRANDING } from "@/config/branding";

/* ============================================
   PortalNotFound — Invalid token screen
   Shows when project token is not found.
   ============================================ */

export function PortalNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-gradient-to-b from-[#0a0a0c] to-[#121214] p-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/5">
        <FileQuestion className="h-7 w-7 text-white/40" />
      </span>
      <div className="space-y-2">
        <h1 className="text-xl font-bold tracking-tight text-white">
          الرابط غير صالح
        </h1>
        <p className="text-sm text-white/50">
          رابط المعاينة غير صالح أو تم إلغاؤه. يرجى التواصل مع المصور للحصول على رابط جديد.
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-white/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRANDING.logo.white}
          alt={BRANDING.companyName}
          className="h-3.5 w-3.5 rounded object-contain"
        />
        {BRANDING.companyName}
      </div>
    </main>
  );
}
