import { CheckCircle2 } from "lucide-react";

import { BRANDING } from "@/config/branding";

/* ============================================
   Thank You Page
   /delivery/[slug]/thank-you
   Shown after successful download.
   ============================================ */

export default async function ThankYouPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
      </span>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">شكراً لك!</h1>
        <p className="text-sm text-muted-foreground">
          تم بدء التحميل بنجاح. نأمل أن تكون الفيديوهات نالت إعجابك.
        </p>
      </div>

      <a
        href={`/delivery/${slug}`}
        className="text-sm text-primary hover:underline"
      >
        العودة إلى التسليم
      </a>

      <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground/60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BRANDING.logo.full} alt={BRANDING.companyName} className="h-4 w-4 rounded object-contain" />
        {BRANDING.companyName}
      </div>
    </main>
  );
}
