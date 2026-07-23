"use client";

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { SectionTitle } from "@/components/shared/section-title";
import { getSettingsAction } from "@/actions/settings/get-settings";
import { saveSettingsAction } from "@/actions/settings/save-settings";
import type { SiteSettings } from "@/lib/config/site-settings";
import { cn } from "@/lib/utils/cn";

/* ============================================
   PortalSettingsForm — Default portal settings
   ============================================ */

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted",
        )}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "ltr:translate-x-5 rtl:-translate-x-5" : "ltr:translate-x-0.5 rtl:-translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}

export function PortalSettingsForm() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettingsAction().then(setSettings);
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const result = await saveSettingsAction({
      defaultPortalExpiryDays: settings.defaultPortalExpiryDays,
      defaultPasswordProtected: settings.defaultPasswordProtected,
    });
    if (result.success) toast.success("تم حفظ الإعدادات");
    else toast.error(result.error ?? "فشل في الحفظ");
    setSaving(false);
  };

  if (!settings) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <DashboardCard className="p-6">
      <SectionTitle title="إعدادات البوابة الافتراضية" />
      <div className="mt-4 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="expiryDays">مدة انتهاء البوابة (أيام)</Label>
          <Input
            id="expiryDays"
            type="number"
            min="1"
            max="365"
            value={settings.defaultPortalExpiryDays}
            onChange={(e) => setSettings({ ...settings, defaultPortalExpiryDays: Number(e.target.value) })}
          />
        </div>
        <ToggleRow
          label="حماية بكلمة مرور افتراضياً"
          checked={settings.defaultPasswordProtected}
          onChange={(v) => setSettings({ ...settings, defaultPasswordProtected: v })}
        />
      </div>
      <Button onClick={handleSave} disabled={saving} className="mt-6">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        حفظ
      </Button>
    </DashboardCard>
  );
}

/* ============================================
   DeliverySettingsForm — Default delivery settings
   ============================================ */

export function DeliverySettingsForm() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettingsAction().then(setSettings);
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const result = await saveSettingsAction({
      defaultDownloadEnabled: settings.defaultDownloadEnabled,
      defaultAllowStreaming: settings.defaultAllowStreaming,
      defaultAllowComments: settings.defaultAllowComments,
    });
    if (result.success) toast.success("تم حفظ الإعدادات");
    else toast.error(result.error ?? "فشل في الحفظ");
    setSaving(false);
  };

  if (!settings) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <DashboardCard className="p-6">
      <SectionTitle title="إعدادات التسليم الافتراضية" />
      <div className="mt-4 space-y-4">
        <ToggleRow
          label="السماح بالتحميل"
          checked={settings.defaultDownloadEnabled}
          onChange={(v) => setSettings({ ...settings, defaultDownloadEnabled: v })}
        />
        <ToggleRow
          label="السماح بالبث"
          checked={settings.defaultAllowStreaming}
          onChange={(v) => setSettings({ ...settings, defaultAllowStreaming: v })}
        />
        <ToggleRow
          label="السماح بالتعليقات"
          checked={settings.defaultAllowComments}
          onChange={(v) => setSettings({ ...settings, defaultAllowComments: v })}
        />
      </div>
      <Button onClick={handleSave} disabled={saving} className="mt-6">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        حفظ
      </Button>
    </DashboardCard>
  );
}

/* ============================================
   ReviewSettingsForm — Review settings
   ============================================ */

export function ReviewSettingsForm() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettingsAction().then(setSettings);
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const result = await saveSettingsAction({
      reviewCommentEditWindowMinutes: settings.reviewCommentEditWindowMinutes,
      autoNotifyOnComment: settings.autoNotifyOnComment,
      autoNotifyOnApproval: settings.autoNotifyOnApproval,
      autoNotifyOnRevision: settings.autoNotifyOnRevision,
    });
    if (result.success) toast.success("تم حفظ الإعدادات");
    else toast.error(result.error ?? "فشل في الحفظ");
    setSaving(false);
  };

  if (!settings) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <DashboardCard className="p-6">
      <SectionTitle title="إعدادات المراجعة" />
      <div className="mt-4 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="editWindow">مدة السماح بتعديل التعليقات (دقائق)</Label>
          <Input
            id="editWindow"
            type="number"
            min="1"
            max="120"
            value={settings.reviewCommentEditWindowMinutes}
            onChange={(e) => setSettings({ ...settings, reviewCommentEditWindowMinutes: Number(e.target.value) })}
          />
        </div>
        <ToggleRow
          label="إشعار عند التعليق"
          checked={settings.autoNotifyOnComment}
          onChange={(v) => setSettings({ ...settings, autoNotifyOnComment: v })}
        />
        <ToggleRow
          label="إشعار عند الاعتماد"
          checked={settings.autoNotifyOnApproval}
          onChange={(v) => setSettings({ ...settings, autoNotifyOnApproval: v })}
        />
        <ToggleRow
          label="إشعار عند طلب تعديل"
          checked={settings.autoNotifyOnRevision}
          onChange={(v) => setSettings({ ...settings, autoNotifyOnRevision: v })}
        />
      </div>
      <Button onClick={handleSave} disabled={saving} className="mt-6">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        حفظ
      </Button>
    </DashboardCard>
  );
}
