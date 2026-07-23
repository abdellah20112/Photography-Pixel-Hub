import { Skeleton } from "@/components/ui/skeleton";
import { BRANDING } from "@/config/branding";

/* ============================================
   PortalSkeleton — Loading state for home page
   Mobile-first skeleton matching the home layout.
   ============================================ */

export function PortalSkeleton() {
  return (
    <main className="flex min-h-dvh flex-col bg-gradient-to-b from-[#0a0a0c] to-[#121214]">
      {/* Logo */}
      <div className="flex flex-col items-center gap-4 px-6 pt-12 pb-6">
        <Skeleton className="h-14 w-14 rounded-xl bg-white/5" />
        <div className="space-y-2 text-center">
          <Skeleton className="mx-auto h-6 w-48 bg-white/5" />
          <Skeleton className="mx-auto h-4 w-32 bg-white/5" />
        </div>
      </div>

      {/* Status + Progress */}
      <div className="space-y-4 px-6 py-4">
        <Skeleton className="h-7 w-32 rounded-full bg-white/5" />
        <Skeleton className="h-2 w-full rounded-full bg-white/5" />
        <Skeleton className="h-3 w-24 bg-white/5" />
      </div>

      {/* Timeline preview */}
      <div className="space-y-3 px-6 py-4">
        <Skeleton className="h-4 w-20 bg-white/5" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-2 w-2 rounded-full bg-white/5" />
              <Skeleton className="h-3 flex-1 bg-white/5" />
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-auto px-6 pb-8">
        <Skeleton className="h-14 w-full rounded-2xl bg-white/5" />
        <div className="mt-4 flex items-center justify-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BRANDING.logo.white}
            alt={BRANDING.companyName}
            className="h-3.5 w-3.5 rounded object-contain opacity-30"
          />
          <Skeleton className="h-3 w-24 bg-white/5" />
        </div>
      </div>
    </main>
  );
}
