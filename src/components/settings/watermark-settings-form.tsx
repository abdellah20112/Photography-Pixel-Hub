"use client";

import { useState, useEffect, useRef } from "react";
import { Save, Loader2, Droplets } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { SectionTitle } from "@/components/shared/section-title";
import { getSettingsAction } from "@/actions/settings/get-settings";
import { saveSettingsAction } from "@/actions/settings/save-settings";
import type { SiteSettings, WatermarkPosition } from "@/lib/config/site-settings";
import { cn } from "@/lib/utils/cn";

/* ============================================
   WatermarkSettingsForm — Watermark config
   Text, opacity, position, scale, animation
   with live preview.
   ============================================ */

const POSITIONS: { value: WatermarkPosition; label: string }[] = [
  { value: "top-left", label: "↖" },
  { value: "top-center", label: "↑" },
  { value: "top-right", label: "↗" },
  { value: "middle-left", label: "←" },
  { value: "middle-center", label: "●" },
  { value: "middle-right", label: "→" },
  { value: "bottom-left", label: "↙" },
  { value: "bottom-center", label: "↓" },
  { value: "bottom-right", label: "↘" },
];

const POS_STYLES: Record<WatermarkPosition, string> = {
  "top-left": "top-2 left-2",
  "top-center": "top-2 left-1/2 -translate-x-1/2",
  "top-right": "top-2 right-2",
  "middle-left": "top-1/2 left-2 -translate-y-1/2",
  "middle-center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  "middle-right": "top-1/2 right-2 -translate-y-1/2",
  "bottom-left": "bottom-2 left-2",
  "bottom-center": "bottom-2 left-1/2 -translate-x-1/2",
  "bottom-right": "bottom-2 right-2",
};

export function WatermarkSettingsForm() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettingsAction().then(setSettings);
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const result = await saveSettingsAction({
      watermarkEnabled: settings.watermarkEnabled,
      watermarkText: settings.watermarkText,
      watermarkOpacity: settings.watermarkOpacity,
      watermarkPosition: settings.watermarkPosition,
      watermarkScale: settings.watermarkScale,
      watermarkAnimation: settings.watermarkAnimation,
    });
    if (result.success) {
      toast.success("تم حفظ إعدادات العلامة المائية");
    } else {
      toast.error(result.error ?? "فشل في الحفظ");
    }
    setSaving(false);
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Watermark Settings */}
      <DashboardCard className="p-6">
        <SectionTitle title="إعدادات العلامة المائية" />
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          {/* Controls */}
          <div className="space-y-4">
            {/* Enable */}
            <div className="flex items-center justify-between">
              <Label>تفعيل العلامة المائية</Label>
              <button
                onClick={() => setSettings({ ...settings, watermarkEnabled: !settings.watermarkEnabled })}
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  settings.watermarkEnabled ? "bg-primary" : "bg-muted",
                )}
                role="switch"
                aria-checked={settings.watermarkEnabled}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    settings.watermarkEnabled ? "ltr:translate-x-5 rtl:-translate-x-5" : "ltr:translate-x-0.5 rtl:-translate-x-0.5",
                  )}
                />
              </button>
            </div>

            {/* Text */}
            <div className="space-y-1.5">
              <Label htmlFor="watermarkText">نص العلامة المائية</Label>
              <Input
                id="watermarkText"
                value={settings.watermarkText}
                onChange={(e) => setSettings({ ...settings, watermarkText: e.target.value })}
                disabled={!settings.watermarkEnabled}
              />
            </div>

            {/* Opacity */}
            <div className="space-y-1.5">
              <Label>الشفافية: {settings.watermarkOpacity}%</Label>
              <input
                type="range"
                min="5"
                max="50"
                value={settings.watermarkOpacity}
                onChange={(e) => setSettings({ ...settings, watermarkOpacity: Number(e.target.value) })}
                className="w-full"
                disabled={!settings.watermarkEnabled}
              />
            </div>

            {/* Scale */}
            <div className="space-y-1.5">
              <Label>الحجم: {settings.watermarkScale}%</Label>
              <input
                type="range"
                min="50"
                max="200"
                step="10"
                value={settings.watermarkScale}
                onChange={(e) => setSettings({ ...settings, watermarkScale: Number(e.target.value) })}
                className="w-full"
                disabled={!settings.watermarkEnabled}
              />
            </div>

            {/* Position */}
            <div className="space-y-1.5">
              <Label>الموضع</Label>
              <div className="grid grid-cols-3 gap-1 w-32">
                {POSITIONS.map((pos) => (
                  <button
                    key={pos.value}
                    onClick={() => setSettings({ ...settings, watermarkPosition: pos.value })}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-md border text-sm transition-colors",
                      settings.watermarkPosition === pos.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-muted",
                    )}
                    disabled={!settings.watermarkEnabled}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Animation */}
            <div className="flex items-center justify-between">
              <Label>تحريك تلقائي</Label>
              <button
                onClick={() => setSettings({ ...settings, watermarkAnimation: !settings.watermarkAnimation })}
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  settings.watermarkAnimation ? "bg-primary" : "bg-muted",
                )}
                role="switch"
                aria-checked={settings.watermarkAnimation}
                disabled={!settings.watermarkEnabled}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    settings.watermarkAnimation ? "ltr:translate-x-5 rtl:-translate-x-5" : "ltr:translate-x-0.5 rtl:-translate-x-0.5",
                  )}
                />
              </button>
            </div>
          </div>

          {/* Live Preview */}
          <div>
            <Label className="mb-2 block">معاينة</Label>
            <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
              {/* Placeholder video frame */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-white/5" />
              </div>

              {/* Watermark */}
              {settings.watermarkEnabled && (
                <div
                  className={cn("absolute z-10 select-none", POS_STYLES[settings.watermarkPosition])}
                  style={{
                    opacity: settings.watermarkOpacity / 100,
                    transform: `scale(${settings.watermarkScale / 100})`,
                  }}
                >
                  <div className="rotate-[-20deg] text-center">
                    <p className="text-lg font-bold whitespace-nowrap text-white" style={{ textShadow: "0 0 4px rgba(0,0,0,0.5)" }}>
                      {settings.watermarkText}
                    </p>
                    <p className="text-[10px] text-white/80" style={{ textShadow: "0 0 4px rgba(0,0,0,0.5)" }}>
                      PREVIEW — DO NOT DISTRIBUTE
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardCard>

      {/* Save */}
      <Button onClick={handleSave} disabled={saving} size="lg">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        حفظ الإعدادات
      </Button>
    </div>
  );
}
