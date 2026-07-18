import { Sparkles } from "lucide-react";

import { Card } from "@/components/ui/card";
import { BRANDING } from "@/config/branding";
import { ROUTES } from "@/lib/constants";

/* ============================================
   WelcomeCard — Hero greeting card
   ============================================ */

export function WelcomeCard() {
  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-6 sm:p-8">
      {/* Decorative gradient */}
      <div className="pointer-events-none absolute -end-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -start-8 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </span>
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {BRANDING.companyName}
          </span>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            مرحباً بك في لوحة التحكم
          </h2>
          <p className="max-w-lg text-sm text-muted-foreground">
            إدارة أعمالك التصويرية في مكان واحد — العملاء والمشاريع والرفع والتحليلات
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <a
            href={ROUTES.DASHBOARD_UPLOADS}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            رفع وسائط جديدة
          </a>
          <a
            href={ROUTES.DASHBOARD_CLIENTS}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            إدارة العملاء
          </a>
        </div>
      </div>
    </Card>
  );
}
