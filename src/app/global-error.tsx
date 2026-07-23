"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { BRANDING } from "@/config/branding";

/* ============================================
   Global Error — Branded global error boundary
   Wraps in full <html> since it replaces
   the root layout on error.
   ============================================ */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="font-sans antialiased">
        <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-gradient-to-b from-[#0a0a0c] to-[#121214] p-8 text-center text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BRANDING.logo.white}
            alt={BRANDING.companyName}
            className="h-12 w-12 rounded-xl object-contain"
          />

          <div className="space-y-3">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </span>
            <h1 className="text-2xl font-bold">حدث خطأ في النظام</h1>
            <p className="text-white/50">
              {error.message || "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={reset}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4" />
              إعادة المحاولة
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg border border-white/10 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/5"
            >
              <Home className="h-4 w-4" />
              الرئيسية
            </Link>
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
      </body>
    </html>
  );
}
