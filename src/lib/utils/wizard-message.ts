import { formatDate, formatNumber } from "@/lib/utils/format";

/* ============================================
   Wizard WhatsApp Message Builder
   Generates ready-to-send messages with
   project details for client communication.
   ============================================ */

export type WizardMessageData = {
  clientName: string;
  projectName: string;
  shootingDate: Date | string;
  videosCount: number;
  price: number;
  script?: string;
  modelName?: string;
};

/**
 * Build a formatted WhatsApp message with project details.
 * Used in the wizard's Review & Save step.
 */
export function buildWhatsAppMessage(data: WizardMessageData): string {
  const lines: string[] = [];

  lines.push("🎬 *مشروع تصوير جديد*");
  lines.push("");
  lines.push(`👤 *العميل:* ${data.clientName}`);

  if (data.modelName) {
    lines.push(`💃 *الموديل:* ${data.modelName}`);
  }

  lines.push(`📦 *المشروع:* ${data.projectName}`);
  lines.push(`📅 *تاريخ التصوير:* ${formatDate(data.shootingDate)}`);
  lines.push(`🎥 *عدد الفيديوهات:* ${data.videosCount}`);
  lines.push(`💰 *السعر:* ${formatNumber(data.price)} درهم`);

  if (data.script && data.script.trim()) {
    lines.push("");
    lines.push("📝 *السكريبت:*");
    lines.push(data.script.trim());
  }

  lines.push("");
  lines.push("— Photography Pixel Hub");

  return lines.join("\n");
}
