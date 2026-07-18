import { BRANDING } from "@/config/branding";

/* ============================================
   Public Gallery Page (token-based)
   Stabilization stub — to be implemented in a
   future sprint with actual gallery logic.
   ============================================ */

export default async function PublicGalleryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRANDING.logo.full}
        alt={BRANDING.companyName}
        className="h-12 w-12 rounded-lg object-contain"
      />
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{BRANDING.companyName}</h1>
        <p className="text-muted-foreground">
          المعرض غير متاح حالياً
        </p>
      </div>
      <p className="text-xs text-muted-foreground/60" dir="ltr">
        token: {token}
      </p>
    </main>
  );
}
