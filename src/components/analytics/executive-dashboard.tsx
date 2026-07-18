"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  DollarSign, TrendingUp, FolderKanban, CheckCircle2,
  Users, UserCircle, Camera, ListChecks,
  Package, Eye, Clock, AlertCircle,
  Download, FileText, Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { SectionTitle } from "@/components/shared/section-title";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardAction } from "@/actions/analytics/get-dashboard";
import { exportReportAction } from "@/actions/analytics/generate-report";
import type { DashboardData, DateRangePreset, ReportType, ExportFormat } from "@/types/analytics";
import { formatNumber } from "@/lib/utils/format";

/* ============================================
   ExecutiveDashboard — Full executive analytics
   ============================================ */

const PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "today", label: "اليوم" },
  { value: "week", label: "هذا الأسبوع" },
  { value: "month", label: "هذا الشهر" },
  { value: "quarter", label: "هذا الربع" },
  { value: "year", label: "هذا العام" },
];

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: "monthly", label: "تقرير شهري" },
  { value: "financial", label: "تقرير مالي" },
  { value: "client", label: "تقرير العملاء" },
  { value: "project", label: "تقرير المشاريع" },
  { value: "team", label: "تقرير الفريق" },
  { value: "model", label: "تقرير الموديلات" },
];

function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof DollarSign; label: string; value: string | number; color: string;
}) {
  return (
    <DashboardCard className="p-4">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </DashboardCard>
  );
}

export function ExecutiveDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<DateRangePreset>("month");
  const [exporting, setExporting] = useState(false);
  const [reportType, setReportType] = useState<ReportType>("monthly");
  const hasFetched = useRef(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    const result = await getDashboardAction({ preset });
    setData(result);
    setLoading(false);
  }, [preset]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleExport = async (format: ExportFormat) => {
    setExporting(true);
    try {
      const result = await exportReportAction({ reportType, format, preset });
      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: result.mime });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${reportType}-report.${result.ext}`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("تم تصدير التقرير");
      } else {
        toast.error(result.error ?? "فشل في التصدير");
      }
    } finally {
      setExporting(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          {PRESETS.map((p) => (
            <Skeleton key={p.value} className="h-8 w-20 rounded-md" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const b = data.business;
  const p = data.projectPerformance;
  const f = data.financial;
  const t = data.team;
  const m = data.models;
  const c = data.clients;
  const s = data.shoots;
  const tk = data.tasks;
  const d = data.deliveries;

  return (
    <div className="space-y-8">
      {/* Date Range + Export */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-muted/50 p-1">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPreset(p.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                preset === p.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Export */}
        <div className="flex items-center gap-2">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
          >
            {REPORT_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <Button size="sm" variant="outline" onClick={() => handleExport("csv")} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleExport("excel")} disabled={exporting}>
            Excel
          </Button>
        </div>
      </div>

      {/* 1. Business Overview */}
      <div className="space-y-4">
        <SectionTitle title="نظرة عامة على الأعمال" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatCard icon={DollarSign} label="إيراد اليوم" value={formatNumber(b.revenueToday)} color="bg-green-500/10 text-green-500" />
          <StatCard icon={TrendingUp} label="إيراد الشهر" value={formatNumber(b.revenueThisMonth)} color="bg-blue-500/10 text-blue-500" />
          <StatCard icon={AlertCircle} label="رصيد مستحق" value={formatNumber(b.outstandingBalance)} color="bg-amber-500/10 text-amber-500" />
          <StatCard icon={CheckCircle2} label="مدفوع الشهر" value={formatNumber(b.paidThisMonth)} color="bg-teal-500/10 text-teal-500" />
          <StatCard icon={FolderKanban} label="مشاريع نشطة" value={b.projectsActive} color="bg-purple-500/10 text-purple-500" />
          <StatCard icon={CheckCircle2} label="مشاريع مكتملة" value={b.projectsCompleted} color="bg-indigo-500/10 text-indigo-500" />
        </div>
      </div>

      {/* 2. Project Performance */}
      <div className="space-y-4">
        <SectionTitle title="أداء المشاريع" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={FolderKanban} label="متوسط المدة (أيام)" value={p.averageDurationDays} color="bg-blue-500/10 text-blue-500" />
          <StatCard icon={AlertCircle} label="مشاريع متأخرة" value={p.delayedProjects} color="bg-red-500/10 text-red-500" />
        </div>
        {p.projectsPerMonth.length > 0 && (
          <DashboardCard className="p-4">
            <p className="mb-3 text-sm font-medium">المشاريع شهرياً</p>
            <div className="flex items-end gap-2" style={{ height: 120 }}>
              {p.projectsPerMonth.slice(-6).map((item) => (
                <div key={item.month} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full rounded-t bg-primary/80" style={{ height: `${item.count * 20}px`, minHeight: 4 }} />
                  <span className="text-xs text-muted-foreground">{item.month.split("-")[1]}</span>
                </div>
              ))}
            </div>
          </DashboardCard>
        )}
      </div>

      {/* 3. Financial Analytics */}
      <div className="space-y-4">
        <SectionTitle title="التحليلات المالية" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatCard icon={AlertCircle} label="فواتير مستحقة" value={f.outstandingInvoices} color="bg-amber-500/10 text-amber-500" />
          <StatCard icon={DollarSign} label="متوسط قيمة الفاتورة" value={formatNumber(f.averageInvoiceValue)} color="bg-blue-500/10 text-blue-500" />
        </div>
        {f.monthlyRevenue.length > 0 && (
          <DashboardCard className="p-4">
            <p className="mb-3 text-sm font-medium">الإيرادات الشهرية</p>
            <div className="flex items-end gap-2" style={{ height: 120 }}>
              {f.monthlyRevenue.slice(-6).map((item) => (
                <div key={item.month} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full rounded-t bg-green-500/80" style={{ height: `${Math.min(item.amount / 1000, 100)}px`, minHeight: 4 }} />
                  <span className="text-xs text-muted-foreground">{item.month.split("-")[1]}</span>
                </div>
              ))}
            </div>
          </DashboardCard>
        )}
      </div>

      {/* 4. Team Analytics */}
      <div className="space-y-4">
        <SectionTitle title="تحليلات الفريق" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={TrendingUp} label="الإنتاجية" value={`${t.productivity}%`} color="bg-green-500/10 text-green-500" />
          <StatCard icon={CheckCircle2} label="مهام مكتملة" value={t.tasksCompleted} color="bg-blue-500/10 text-blue-500" />
          <StatCard icon={Users} label="نسبة الإشغال" value={`${t.occupancyPercent}%`} color="bg-purple-500/10 text-purple-500" />
          <StatCard icon={FolderKanban} label="مشروع/موظف" value={t.projectsPerEmployee} color="bg-amber-500/10 text-amber-500" />
        </div>
      </div>

      {/* 5. Model Analytics */}
      <div className="space-y-4">
        <SectionTitle title="تحليلات الموديلات" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={UserCircle} label="إجمالي الأرباح" value={formatNumber(m.totalEarnings)} color="bg-green-500/10 text-green-500" />
          <StatCard icon={FolderKanban} label="إجمالي المشاريع" value={m.totalProjects} color="bg-blue-500/10 text-blue-500" />
          <StatCard icon={TrendingUp} label="نسبة الاستخدام" value={`${m.utilizationPercent}%`} color="bg-purple-500/10 text-purple-500" />
          <StatCard icon={Users} label="موديلات نشطة" value={m.topModels.length} color="bg-amber-500/10 text-amber-500" />
        </div>
      </div>

      {/* 6. Client Analytics */}
      <div className="space-y-4">
        <SectionTitle title="تحليلات العملاء" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatCard icon={Users} label="إجمالي العملاء" value={c.totalClients} color="bg-blue-500/10 text-blue-500" />
          <StatCard icon={DollarSign} label="متوسط قيمة الفاتورة" value={formatNumber(c.averageInvoiceValue)} color="bg-green-500/10 text-green-500" />
        </div>
      </div>

      {/* 7. Shoot Analytics */}
      <div className="space-y-4">
        <SectionTitle title="تحليلات التصوير" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Camera} label="تصوير هذا الأسبوع" value={s.shootsThisWeek} color="bg-blue-500/10 text-blue-500" />
          <StatCard icon={CheckCircle2} label="مكتملة" value={s.completedShoots} color="bg-green-500/10 text-green-500" />
          <StatCard icon={AlertCircle} label="ملغاة" value={s.cancelledShoots} color="bg-red-500/10 text-red-500" />
          <StatCard icon={Clock} label="قادمة" value={s.upcomingShoots} color="bg-amber-500/10 text-amber-500" />
        </div>
      </div>

      {/* 8. Task Analytics */}
      <div className="space-y-4">
        <SectionTitle title="تحليلات المهام" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={ListChecks} label="مهام اليوم" value={tk.tasksToday} color="bg-blue-500/10 text-blue-500" />
          <StatCard icon={AlertCircle} label="متأخرة" value={tk.overdue} color="bg-red-500/10 text-red-500" />
          <StatCard icon={CheckCircle2} label="مكتملة" value={tk.completed} color="bg-green-500/10 text-green-500" />
          <StatCard icon={AlertCircle} label="محظورة" value={tk.blocked} color="bg-amber-500/10 text-amber-500" />
        </div>
      </div>

      {/* 9. Delivery Analytics */}
      <div className="space-y-4">
        <SectionTitle title="تحليلات التسليم" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Package} label="تسليمات" value={d.totalDeliveries} color="bg-blue-500/10 text-blue-500" />
          <StatCard icon={Download} label="تحميلات" value={d.totalDownloads} color="bg-green-500/10 text-green-500" />
          <StatCard icon={Clock} label="مراجعات معلقة" value={d.pendingReviews} color="bg-amber-500/10 text-amber-500" />
          <StatCard icon={CheckCircle2} label="فيديوهات معتمدة" value={d.approvedVideos} color="bg-teal-500/10 text-teal-500" />
        </div>
      </div>
    </div>
  );
}
