"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Palette, Building2, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { SectionTitle } from "@/components/shared/section-title";
import { getSettingsAction } from "@/actions/settings/get-settings";
import { saveSettingsAction } from "@/actions/settings/save-settings";
import type { SiteSettings } from "@/lib/config/site-settings";

/* ============================================
   BrandSettingsForm — Agency branding settings
   ============================================ */

export function BrandSettingsForm() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettingsAction().then(setSettings);
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const result = await saveSettingsAction(settings);
    if (result.success) {
      toast.success("تم حفظ إعدادات العلامة التجارية");
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
      {/* Agency Info */}
      <DashboardCard className="p-6">
        <SectionTitle title="معلومات الوكالة" />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="agencyName">اسم الوكالة</Label>
            <Input
              id="agencyName"
              value={settings.agencyName}
              onChange={(e) => setSettings({ ...settings, agencyName: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="agencyShortName">الاسم المختصر</Label>
            <Input
              id="agencyShortName"
              value={settings.agencyShortName}
              onChange={(e) => setSettings({ ...settings, agencyShortName: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="logoUrl">رابط الشعار</Label>
            <Input
              id="logoUrl"
              value={settings.logoUrl}
              onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
              dir="ltr"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="website">الموقع الإلكتروني</Label>
            <Input
              id="website"
              value={settings.website}
              onChange={(e) => setSettings({ ...settings, website: e.target.value })}
              dir="ltr"
            />
          </div>
        </div>
      </DashboardCard>

      {/* Brand Colors */}
      <DashboardCard className="p-6">
        <SectionTitle title="ألوان العلامة التجارية" />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="primaryColor">اللون الأساسي</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                className="h-9 w-12 cursor-pointer rounded-md border"
              />
              <Input
                value={settings.primaryColor}
                onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                dir="ltr"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="secondaryColor">اللون الثانوي</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.secondaryColor}
                onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                className="h-9 w-12 cursor-pointer rounded-md border"
              />
              <Input
                value={settings.secondaryColor}
                onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                dir="ltr"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="accentColor">لون التمييز</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                className="h-9 w-12 cursor-pointer rounded-md border"
              />
              <Input
                value={settings.accentColor}
                onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                dir="ltr"
              />
            </div>
          </div>
        </div>
      </DashboardCard>

      {/* Social & Contact */}
      <DashboardCard className="p-6">
        <SectionTitle title="التواصل والشبكات الاجتماعية" />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="supportEmail">البريد الإلكتروني للدعم</Label>
            <Input
              id="supportEmail"
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              dir="ltr"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="whatsappNumber">رقم واتساب</Label>
            <Input
              id="whatsappNumber"
              value={settings.whatsappNumber}
              onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
              dir="ltr"
              placeholder="9665XXXXXXXX+"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="instagram">إنستغرام</Label>
            <Input
              id="instagram"
              value={settings.instagram}
              onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
              dir="ltr"
              placeholder="@username"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="facebook">فيسبوك</Label>
            <Input
              id="facebook"
              value={settings.facebook}
              onChange={(e) => setSettings({ ...settings, facebook: e.target.value })}
              dir="ltr"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tiktok">تيك توك</Label>
            <Input
              id="tiktok"
              value={settings.tiktok}
              onChange={(e) => setSettings({ ...settings, tiktok: e.target.value })}
              dir="ltr"
              placeholder="@username"
            />
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
