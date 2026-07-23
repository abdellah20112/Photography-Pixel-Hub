import Link from "next/link";
import { BRANDING } from "@/config/branding";

/* ============================================
   404 Not Found — Branded
   ============================================ */

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-gradient-to-b from-background to-muted/30 p-8 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRANDING.logo.full}
        alt={BRANDING.companyName}
        className="h-12 w-12 rounded-xl object-contain"
      />

      <div className="space-y-3">
        <div className="relative">
          <h1 className="text-7xl font-bold tracking-tighter text-primary/20">404</h1>
          <p className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
            الصفحة غير موجودة
          </p>
        </div>
        <p className="text-muted-foreground">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          العودة للرئيسية
        </Link>
        <Link
          href="/login"
          className="rounded-lg border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          رجوع
        </Link>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRANDING.logo.full}
          alt={BRANDING.companyName}
          className="h-3.5 w-3.5 rounded object-contain"
        />
        {BRANDING.companyName} — {BRANDING.tagline}
      </div>
    </main>
  );
}
