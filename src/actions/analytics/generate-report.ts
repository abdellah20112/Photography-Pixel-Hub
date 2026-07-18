"use server";

import { reportService, exportService, resolveDateRange } from "@/services/analytics.service";
import { getCurrentUser } from "@/lib/auth/session";
import type { ReportType, ExportFormat } from "@/types/analytics";

export async function generateReportAction(params: {
  reportType: ReportType;
  preset: string;
  customStart?: string;
  customEnd?: string;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const range = resolveDateRange(params.preset, { start: params.customStart, end: params.customEnd });
  return reportService.generate(params.reportType, range);
}

export async function exportReportAction(params: {
  reportType: ReportType;
  format: ExportFormat;
  preset: string;
  customStart?: string;
  customEnd?: string;
}): Promise<{ success: boolean; data?: string; mime?: string; ext?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "يجب تسجيل الدخول" };

  try {
    const range = resolveDateRange(params.preset, { start: params.customStart, end: params.customEnd });
    const report = await reportService.generate(params.reportType, range);
    const result = await exportService.export(report, params.format);
    return { success: true, data: result.data, mime: result.mime, ext: result.ext };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "فشل في التصدير" };
  }
}
