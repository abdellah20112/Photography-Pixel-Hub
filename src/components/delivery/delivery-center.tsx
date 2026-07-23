"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Film,
  Image as ImageIcon,
  FileText,
  Music,
  File as FileIcon,
  Download,
  CheckCircle2,
  Circle,
  Clock,
  HardDrive,
  Package,
  Loader2,
  Activity,
  Monitor,
  Smartphone,
  Globe,
  Calendar,
  Building2,
  Hash,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { SectionTitle } from "@/components/shared/section-title";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ReviewStatusBadge } from "@/components/review/review-status-badge";
import {
  downloadDeliveryFileAction,
  completeDeliveryAction,
  getDeliveryCenterDataAction,
} from "@/actions/delivery/delivery-center";
import { formatBytes, formatDate, formatDateTime, formatNumber } from "@/lib/utils/format";
import type { ProjectFileType } from "@prisma/client";

/* ============================================
   DeliveryCenter — Delivery management UI
   Summary, file packages, downloads, checklist,
   activity timeline, complete action.
   ============================================ */

type DeliveryData = NonNullable<Awaited<ReturnType<typeof getDeliveryCenterDataAction>>>;

type DeliveryCenterProps = {
  data: DeliveryData;
};

const FILE_TYPE_CONFIG: Record<
  ProjectFileType,
  { icon: typeof Film; label: string; color: string }
> = {
  PREVIEW_VIDEO: { icon: Film, label: "معاينة", color: "bg-blue-500/10 text-blue-500" },
  FINAL_VIDEO: { icon: Film, label: "فيديو نهائي", color: "bg-green-500/10 text-green-500" },
  THUMBNAIL: { icon: ImageIcon, label: "صورة مصغرة", color: "bg-purple-500/10 text-purple-500" },
  ASSET: { icon: FileIcon, label: "أصل", color: "bg-amber-500/10 text-amber-500" },
  MUSIC: { icon: Music, label: "موسيقى", color: "bg-pink-500/10 text-pink-500" },
  LOGO: { icon: ImageIcon, label: "شعار", color: "bg-indigo-500/10 text-indigo-500" },
  DOCUMENT: { icon: FileText, label: "مستند", color: "bg-gray-500/10 text-gray-500" },
  INVOICE: { icon: FileText, label: "فاتورة", color: "bg-red-500/10 text-red-500" },
  CONTRACT: { icon: FileText, label: "عقد", color: "bg-teal-500/10 text-teal-500" },
};

const CHECKLIST_ITEMS = [
  { key: "finalVideo", label: "رفع الفيديو النهائي", required: true },
  { key: "thumbnail", label: "رفع الصورة المصغرة", required: true },
  { key: "reviewCompleted", label: "إكمال المراجعة", required: true },
  { key: "clientApproved", label: "اعتماد العميل", required: false },
  { key: "invoice", label: "رفع الفاتورة", required: false },
  { key: "contract", label: "رفع العقد", required: false },
] as const;

export function DeliveryCenter({ data }: DeliveryCenterProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [completing, setCompleting] = useState(false);

  const handleDownload = useCallback(async (fileId: string) => {
    setDownloadingId(fileId);
    const result = await downloadDeliveryFileAction(fileId);
    if (result.success && result.url) {
      window.open(result.url, "_blank");
    } else {
      toast.error(result.error ?? "فشل في التحميل");
    }
    setDownloadingId(null);
  }, []);

  const handleComplete = useCallback(async () => {
    setCompleting(true);
    const result = await completeDeliveryAction(data.project.id);
    if (result.success) {
      toast.success("تم إكمال التسليم بنجاح");
      setShowComplete(false);
    } else {
      toast.error(result.error ?? "فشل في الإكمال");
    }
    setCompleting(false);
  }, [data.project.id]);

  const isCompleted = data.project.workflowStatus === "COMPLETED";
  const checklistMet = data.allRequiredMet;

  // Memoized grouped files
  const groupedFiles = useMemo(() => data.groupedFiles, [data.groupedFiles]);

  return (
    <div className="space-y-6">
      {/* ── Delivery Summary ─────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard className="p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{data.project.clientName}</p>
              <p className="text-xs text-muted-foreground">{data.project.clientCode}</p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard className="p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-500" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">تاريخ الإنشاء</p>
              <p className="text-sm font-medium">{formatDate(data.project.createdAt)}</p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard className="p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <HardDrive className="h-5 w-5 text-blue-500" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">حجم الملفات</p>
              <p className="text-sm font-medium">{formatBytes(data.totalSize)}</p>
              <p className="text-xs text-muted-foreground">{data.fileCount} ملف</p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard className="p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <Download className="h-5 w-5 text-green-500" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">إجمالي التحميلات</p>
              <p className="text-sm font-medium">{formatNumber(data.downloadStats.totalDownloads)}</p>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* ── Status bar ──────────────────────── */}
      <DashboardCard className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <ReviewStatusBadge status={data.project.workflowStatus} />
          {isCompleted && (
            <Badge className="bg-green-600/20 text-green-600 border-green-600/30">
              <CheckCircle2 className="h-3.5 w-3.5" />
              مكتمل
            </Badge>
          )}
        </div>
        {!isCompleted && checklistMet && (
          <Button size="sm" onClick={() => setShowComplete(true)} className="bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="h-4 w-4" />
            إكمال التسليم
          </Button>
        )}
        {!isCompleted && !checklistMet && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5" />
            أكمل العناصر المطلوبة للإكمال
          </div>
        )}
      </DashboardCard>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Left: Files + Checklist ──────── */}
        <div className="space-y-6 lg:col-span-2">
          {/* Delivery Package */}
          <DashboardCard className="p-6">
            <SectionTitle
              title="حزمة التسليم"
              action={
                <Badge variant="outline" className="gap-1">
                  <Package className="h-3.5 w-3.5" />
                  {data.fileCount} ملف
                </Badge>
              }
            />

            <div className="mt-4 space-y-4">
              {groupedFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <Package className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">لا توجد ملفات قابلة للتسليم</p>
                  <p className="text-xs text-muted-foreground/60">ارفع ملفات المشروع أولاً</p>
                </div>
              ) : (
                groupedFiles.map((group) => {
                  const config = FILE_TYPE_CONFIG[group.type as ProjectFileType] ?? FILE_TYPE_CONFIG.ASSET;
                  const Icon = config.icon;

                  return (
                    <div key={group.type}>
                      {/* Category header */}
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${config.color}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <h4 className="text-sm font-medium">{config.label}</h4>
                        <Badge variant="outline" className="text-[10px]">
                          {group.files.length}
                        </Badge>
                      </div>

                      {/* Files */}
                      <div className="space-y-1.5">
                        {group.files.map((file) => (
                          <div
                            key={file.id}
                            className="group flex items-center gap-3 rounded-lg border p-2.5 transition-colors hover:bg-accent/50"
                          >
                            <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{file.fileName}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{formatBytes(file.fileSize)}</span>
                                <span>·</span>
                                <span>{file.mimeType || "—"}</span>
                                <span>·</span>
                                <span>{formatDate(file.createdAt)}</span>
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => handleDownload(file.id)}
                              disabled={downloadingId === file.id}
                              aria-label="تحميل"
                            >
                              {downloadingId === file.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </DashboardCard>

          {/* Delivery Checklist */}
          <DashboardCard className="p-6">
            <SectionTitle title="قائمة التحقق" />
            <div className="mt-4 space-y-2">
              {CHECKLIST_ITEMS.map((item) => {
                const done = data.checklist[item.key as keyof typeof data.checklist];
                return (
                  <div
                    key={item.key}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 shrink-0 text-muted-foreground/40" />
                    )}
                    <span className={`text-sm ${done ? "font-medium" : "text-muted-foreground"}`}>
                      {item.label}
                    </span>
                    {item.required && !done && (
                      <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">
                        مطلوب
                      </Badge>
                    )}
                    {item.required && done && (
                      <Badge variant="outline" className="text-[10px] text-green-600 border-green-600/30">
                        ✓
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </DashboardCard>
        </div>

        {/* ── Right: Downloads + Timeline ──── */}
        <div className="space-y-6">
          {/* Download Tracking */}
          <DashboardCard className="p-6">
            <SectionTitle title="تتبع التحميلات" />
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">إجمالي التحميلات</p>
                  <p className="mt-1 text-lg font-bold">{formatNumber(data.downloadStats.totalDownloads)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">IP فريدة</p>
                  <p className="mt-1 text-lg font-bold">{formatNumber(data.downloadStats.uniqueIps)}</p>
                </div>
              </div>

              {/* Devices */}
              {Object.keys(data.downloadStats.devices).length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">الأجهزة</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(data.downloadStats.devices).map(([device, count]) => (
                      <Badge key={device} variant="outline" className="gap-1">
                        {device === "Mobile" ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
                        {device}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent downloads */}
              {data.recentDownloads.length > 0 && (
                <div>
                  <p className="mb-2 text-xs text-muted-foreground">آخر التحميلات</p>
                  <div className="space-y-1.5">
                    {data.recentDownloads.slice(0, 5).map((dl) => (
                      <div key={dl.id} className="flex items-center gap-2 text-xs">
                        <Globe className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground" dir="ltr">{dl.ip}</span>
                        <span className="text-muted-foreground/50">·</span>
                        <span>{dl.browser}</span>
                        <span className="text-muted-foreground/50">·</span>
                        <span className="text-muted-foreground">{formatDateTime(dl.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DashboardCard>

          {/* Activity Timeline */}
          <DashboardCard className="p-6">
            <SectionTitle title="السجل الزمني" />
            <div className="mt-4 space-y-3">
              {data.timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">لا توجد أحداث</p>
              ) : (
                data.timeline.slice(0, 10).map((event) => (
                  <div key={event.id} className="flex gap-3 border-s-2 border-muted ps-3">
                    <div className="flex-1 space-y-0.5">
                      <p className="text-sm font-medium">{event.title}</p>
                      {event.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{event.description as string}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        {event.actorName} · {formatDateTime(event.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DashboardCard>
        </div>
      </div>

      {/* Complete dialog */}
      <ConfirmDialog
        open={showComplete}
        onOpenChange={setShowComplete}
        title="إكمال التسليم"
        description="سيتم تحويل حالة المشروع إلى &quot;مكتمل&quot;. هل أنت متأكد؟"
        confirmLabel="إكمال"
        variant="default"
        onConfirm={handleComplete}
      />
    </div>
  );
}
