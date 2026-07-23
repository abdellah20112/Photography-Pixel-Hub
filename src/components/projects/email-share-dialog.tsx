"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { BRANDING } from "@/config/branding";

/* ============================================
   EmailShareDialog — Beautiful HTML email
   Generates email-safe HTML with logo,
   project name, CTA button, portal link,
   password, expiry, and support info.
   ============================================ */

type EmailShareDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  clientName: string;
  portalUrl: string;
  password?: string;
  expiry?: Date | null;
};

function generateEmailHtml(params: {
  projectName: string;
  clientName: string;
  portalUrl: string;
  password?: string;
  expiry?: Date | null;
}): string {
  const { projectName, clientName, portalUrl, password, expiry } = params;
  const expiryStr = expiry
    ? new Date(expiry).toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>معاينة المشروع — ${projectName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Tahoma,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7C3AED 0%,#06B6D4 100%);padding:32px 24px;text-align:center;">
              <h1 style="color:#ffffff;font-size:24px;margin:0;font-weight:700;">${BRANDING.companyName}</h1>
              <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:4px 0 0;">${BRANDING.tagline}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 24px;">
              <h2 style="color:#18181b;font-size:20px;margin:0 0 8px;">مرحباً${clientName ? ` ${clientName}` : ""}!</h2>
              <p style="color:#52525b;font-size:15px;line-height:1.6;margin:0 0 24px;">
                تمت مشاركة مشروع <strong style="color:#7C3AED;">${projectName}</strong> معك.
                يمكنك معاينة الفيديوهات ومشاركة ملاحظاتك من خلال بوابة العميل الآمنة.
              </p>

              ${password ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;"><tr><td style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;"><p style="margin:0;font-size:13px;color:#92400e;">🔑 كلمة المرور: <strong>${password}</strong></p></td></tr></table>` : ""}

              ${expiryStr ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;"><tr><td style="background:#dbeafe;border:1px solid #93c5fd;border-radius:8px;padding:12px 16px;"><p style="margin:0;font-size:13px;color:#1e40af;">⏰ ينتهي الرابط في: <strong>${expiryStr}</strong></p></td></tr></table>` : ""}

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${portalUrl}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED 0%,#06B6D4 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:12px;font-size:16px;font-weight:600;">
                      ▶ عرض المشروع
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#a1a1aa;font-size:12px;text-align:center;margin:0;word-break:break-all;">
                أو انسخ الرابط: <a href="${portalUrl}" style="color:#7C3AED;">${portalUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#fafafa;border-top:1px solid #e4e4e7;padding:20px 24px;text-align:center;">
              <p style="color:#a1a1aa;font-size:12px;margin:0 0 4px;">${BRANDING.companyName} — ${BRANDING.tagline}</p>
              <p style="color:#d4d4d8;font-size:11px;margin:0;">
                ${BRANDING.contact.email} · هذا البريد آمن — يرجى عدم إعادة توجيه الرابط
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function generatePlainText(params: {
  projectName: string;
  clientName: string;
  portalUrl: string;
  password?: string;
  expiry?: Date | null;
}): string {
  const { projectName, clientName, portalUrl, password, expiry } = params;
  const expiryStr = expiry
    ? new Date(expiry).toLocaleDateString("ar-SA")
    : null;

  return [
    `${BRANDING.companyName}`,
    ``,
    `مرحباً${clientName ? ` ${clientName}` : ""}!`,
    ``,
    `تمت مشاركة مشروع "${projectName}" معك.`,
    `يمكنك معاينة الفيديوهات من خلال الرابط التالي:`,
    ``,
    `${portalUrl}`,
    ``,
    password ? `كلمة المرور: ${password}` : "",
    expiryStr ? `ينتهي الرابط في: ${expiryStr}` : "",
    ``,
    `للاستفسار: ${BRANDING.contact.email}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function EmailShareDialog({
  open,
  onOpenChange,
  projectName,
  clientName,
  portalUrl,
  password,
  expiry,
}: EmailShareDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyHtml = useCallback(() => {
    const html = generateEmailHtml({ projectName, clientName, portalUrl, password, expiry });
    navigator.clipboard.writeText(html);
    setCopied(true);
    toast.success("تم نسخ كود HTML");
    setTimeout(() => setCopied(false), 2000);
  }, [projectName, clientName, portalUrl, password, expiry]);

  const handleOpenMail = useCallback(() => {
    const subject = `معاينة المشروع — ${projectName}`;
    const body = generatePlainText({ projectName, clientName, portalUrl, password, expiry });
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [projectName, clientName, portalUrl, password, expiry]);

  const htmlPreview = generateEmailHtml({ projectName, clientName, portalUrl, password, expiry });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85dvh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            مشاركة عبر البريد الإلكتروني
          </DialogTitle>
          <DialogDescription>
            معاينة البريد الإلكتروني الذي سيتم إرساله للعميل
          </DialogDescription>
        </DialogHeader>

        {/* Email Preview */}
        <div className="flex-1 overflow-y-auto rounded-lg border bg-muted/30">
          <iframe
            srcDoc={htmlPreview}
            className="h-[400px] w-full border-0"
            title="معاينة البريد الإلكتروني"
            sandbox="allow-same-origin"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCopyHtml}>
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "تم النسخ" : "نسخ HTML"}
          </Button>
          <Button onClick={handleOpenMail}>
            <ExternalLink className="h-4 w-4" />
            فتح البريد
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
