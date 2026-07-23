"use client";

import { useState } from "react";
import { Palette, Droplets, Globe, Package, MessageSquare } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils/cn";
import { BrandSettingsForm } from "@/components/settings/brand-settings-form";
import { WatermarkSettingsForm } from "@/components/settings/watermark-settings-form";
import {
  PortalSettingsForm,
  DeliverySettingsForm,
  ReviewSettingsForm,
} from "@/components/settings/portal-delivery-review-settings-forms";

/* ============================================
   SettingsPage — Unified settings with tabs
   Brand · Portal · Delivery · Review · Watermark
   ============================================ */

type Tab = "brand" | "portal" | "delivery" | "review" | "watermark";

const TABS: { id: Tab; label: string; icon: typeof Palette }[] = [
  { id: "brand", label: "العلامة التجارية", icon: Palette },
  { id: "portal", label: "البوابة", icon: Globe },
  { id: "delivery", label: "التسليم", icon: Package },
  { id: "review", label: "المراجعة", icon: MessageSquare },
  { id: "watermark", label: "العلامة المائية", icon: Droplets },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("brand");

  return (
    <div className="space-y-6">
      <PageHeader
        title="الإعدادات"
        description="إدارة إعدادات المنصة والعلامة التجارية"
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/30 p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                tab === t.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === "brand" && <BrandSettingsForm />}
      {tab === "portal" && <PortalSettingsForm />}
      {tab === "delivery" && <DeliverySettingsForm />}
      {tab === "review" && <ReviewSettingsForm />}
      {tab === "watermark" && <WatermarkSettingsForm />}
    </div>
  );
}
