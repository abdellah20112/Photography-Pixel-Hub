"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Share2,
  Copy,
  Check,
  RefreshCw,
  Lock,
  Unlock,
  Calendar,
  Download,
  MessageSquare,
  Play,
  QrCode,
  Mail,
  MessageCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { QRCodeCard } from "@/components/projects/qr-code-card";
import { EmailShareDialog } from "@/components/projects/email-share-dialog";
import { getPortalShareAction, type PortalShareData } from "@/actions/projects/get-portal-share";
import { regenerateTokenAction } from "@/actions/projects/regenerate-token";
import { createDeliveryAction } from "@/actions/deliveries/create-delivery";
import { updateDeliveryAction } from "@/actions/deliveries/update-delivery";
import { BRANDING } from "@/config/branding";
import { cn } from "@/lib/utils/cn";

/* ============================================
   SharePortalDialog — Share client portal
   Contains: portal URL, copy, token regen,
   password, expiry, toggles, QR, WhatsApp, Email
   ============================================ */

type SharePortalDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
};

type Tab = "share" | "qr" | "email";

export function SharePortalDialog({ open, onOpenChange, projectId }: SharePortalDialogProps) {
  const [data, setData] = useState<PortalShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("share");
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  // Portal settings form state
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [downloadEnabled, setDownloadEnabled] = useState(true);
  const [allowStreaming, setAllowStreaming] = useState(true);
  const [allowComments, setAllowComments] = useState(true);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      setLoading(true);
      const result = await getPortalShareAction(projectId);
      if (!active) return;
      if (result) {
        setData(result);
        if (result.delivery) {
          setPasswordEnabled(result.delivery.passwordProtected);
          setDownloadEnabled(result.delivery.downloadEnabled);
          setAllowStreaming(result.delivery.allowStreaming);
          setAllowComments(result.delivery.allowComments);
          setExpiryDate(
            result.delivery.expiresAt
              ? new Date(result.delivery.expiresAt).toISOString().slice(0, 10)
              : "",
          );
        }
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [open, projectId, refreshKey]);

  const handleCopy = useCallback(() => {
    if (!data) return;
    navigator.clipboard.writeText(data.portalUrl);
    setCopied(true);
    toast.success("تم نسخ الرابط");
    setTimeout(() => setCopied(false), 2000);
  }, [data]);

  const handleRegenerate = useCallback(async () => {
    setRegenerating(true);
    const result = await regenerateTokenAction(projectId);
    if (result.success && result.token) {
      toast.success("تم تجديد الرابط — الرابط القديم لم يعد صالحاً");
      await setRefreshKey((k) => k + 1);
    } else {
      toast.error(result.error ?? "فشل في التجديد");
    }
    setRegenerating(false);
    setShowRegenConfirm(false);
  }, [projectId]);

  const handleSaveSettings = useCallback(async () => {
    if (!data) return;
    setSaving(true);

    try {
      const formData = new FormData();
      formData.set("title", data.projectName);
      formData.set("expiresAt", expiryDate || new Date(Date.now() + 7 * 86400000).toISOString());
      formData.set("downloadEnabled", String(downloadEnabled));
      formData.set("allowStreaming", String(allowStreaming));
      formData.set("allowComments", String(allowComments));
      formData.set("passwordProtected", String(passwordEnabled));
      if (passwordEnabled && password) {
        formData.set("password", password);
      }

      if (data.delivery) {
        // Need videoIds — fetch them separately is not possible here
        // Use the delivery's existing videos
        formData.set("videoIds", "");
        const result = await updateDeliveryAction(data.delivery.id, { success: true }, formData);
        if (!result.success) {
          toast.error(result.error ?? "فشل في الحفظ");
        } else {
          toast.success("تم حفظ الإعدادات");
        }
      } else {
        formData.set("projectId", projectId);
        const result = await createDeliveryAction({ success: true }, formData);
        if (!result.success) {
          toast.error(result.error ?? "فشل في الحفظ");
        } else {
          toast.success("تم حفظ الإعدادات");
        }
      }
      await setRefreshKey((k) => k + 1);
    } catch {
      toast.error("فشل في حفظ الإعدادات");
    }
    setSaving(false);
  }, [data, projectId, expiryDate, downloadEnabled, allowStreaming, allowComments, passwordEnabled, password]);

  const handleWhatsApp = useCallback(() => {
    if (!data) return;
    const lines = [
      `📸 ${BRANDING.companyName}`,
      ``,
      `مرحباً!`,
      ``,
      `تمت مشاركة مشروع "${data.projectName}" معك.`,
      ``,
      `🔗 الرابط: ${data.portalUrl}`,
    ];
    if (passwordEnabled && password) {
      lines.push(`🔑 كلمة المرور: ${password}`);
    }
    if (expiryDate) {
      lines.push(`⏰ ينتهي في: ${new Date(expiryDate).toLocaleDateString("ar-SA")}`);
    }
    lines.push(``, `للاستفسار: ${BRANDING.contact.email}`);

    const text = encodeURIComponent(lines.join("\n"));
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }, [data, passwordEnabled, password, expiryDate]);

  if (loading || !data) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              مشاركة بوابة العميل
            </DialogTitle>
            <DialogDescription>
              {data.projectName} — {data.clientName}
            </DialogDescription>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-1 rounded-lg border bg-muted/30 p-1">
            {[
              { id: "share" as Tab, label: "الرابط", icon: Share2 },
              { id: "qr" as Tab, label: "QR", icon: QrCode },
              { id: "email" as Tab, label: "بريد", icon: Mail },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => t.id === "email" ? setShowEmailDialog(true) : setTab(t.id)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    tab === t.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* ── Share Tab ────────────────────── */}
          {tab === "share" && (
            <div className="space-y-5">
              {/* Portal URL */}
              <div className="space-y-2">
                <Label>رابط البوابة</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={data.portalUrl}
                    className="font-mono text-xs"
                    dir="ltr"
                  />
                  <Button size="icon" variant="outline" onClick={handleCopy}>
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Share buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" onClick={handleWhatsApp}>
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  واتساب
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowEmailDialog(true)}>
                  <Mail className="h-4 w-4 text-blue-600" />
                  بريد
                </Button>
                <Button variant="outline" size="sm" onClick={() => setTab("qr")}>
                  <QrCode className="h-4 w-4 text-primary" />
                  QR
                </Button>
              </div>

              {/* Regenerate token */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">تجديد الرابط</p>
                  <p className="text-xs text-muted-foreground">
                    إنشاء رابط جديد — الرابط الحالي لن يعمل
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRegenConfirm(true)}
                  disabled={regenerating}
                >
                  <RefreshCw className="h-4 w-4" />
                  تجديد
                </Button>
              </div>

              {/* Divider */}
              <div className="border-t pt-4">
                <h4 className="mb-3 text-sm font-semibold">إعدادات الحماية</h4>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    {passwordEnabled ? (
                      <Lock className="h-4 w-4 text-amber-600" />
                    ) : (
                      <Unlock className="h-4 w-4 text-muted-foreground" />
                    )}
                    حماية بكلمة مرور
                  </Label>
                  <button
                    onClick={() => setPasswordEnabled(!passwordEnabled)}
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-colors",
                      passwordEnabled ? "bg-primary" : "bg-muted",
                    )}
                    role="switch"
                    aria-checked={passwordEnabled}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                        passwordEnabled ? "ltr:translate-x-5 rtl:-translate-x-5" : "ltr:translate-x-0.5 rtl:-translate-x-0.5",
                      )}
                    />
                  </button>
                </div>
                {passwordEnabled && (
                  <Input
                    type="text"
                    placeholder="كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    dir="ltr"
                  />
                )}
              </div>

              {/* Expiry */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  تاريخ الانتهاء
                </Label>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  dir="ltr"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <ToggleRow
                  icon={Download}
                  label="السماح بالتحميل"
                  checked={downloadEnabled}
                  onChange={setDownloadEnabled}
                />
                <ToggleRow
                  icon={Play}
                  label="السماح بالبث"
                  checked={allowStreaming}
                  onChange={setAllowStreaming}
                />
                <ToggleRow
                  icon={MessageSquare}
                  label="السماح بالتعليقات"
                  checked={allowComments}
                  onChange={setAllowComments}
                />
              </div>

              {/* Save */}
              <Button className="w-full" onClick={handleSaveSettings} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                حفظ الإعدادات
              </Button>
            </div>
          )}

          {/* ── QR Tab ───────────────────────── */}
          {tab === "qr" && (
            <div className="py-4">
              <QRCodeCard url={data.portalUrl} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Regenerate confirmation */}
      <ConfirmDialog
        open={showRegenConfirm}
        onOpenChange={setShowRegenConfirm}
        title="تجديد رابط البوابة"
        description="سيتم إنشاء رابط جديد. الرابط الحالي لن يعمل بعد الآن. هل أنت متأكد؟"
        confirmLabel="نعم، تجديد"
        cancelLabel="إلغاء"
        variant="destructive"
        onConfirm={handleRegenerate}
      />

      {/* Email share dialog */}
      <EmailShareDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        projectName={data.projectName}
        clientName={data.clientName}
        portalUrl={data.portalUrl}
        password={passwordEnabled ? password : undefined}
        expiry={expiryDate ? new Date(expiryDate) : data.delivery?.expiresAt}
      />
    </>
  );
}

/* ── Toggle row ───────────────────────────── */

function ToggleRow({
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  icon: typeof Lock;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <Label className="flex items-center gap-2 text-sm">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {label}
      </Label>
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
