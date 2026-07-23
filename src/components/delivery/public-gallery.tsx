"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  Edit3,
  MessageSquare,
  Download,
  Loader2,
  Play,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { WatermarkedPlayer } from "@/components/player/watermarked-player";
import { BRANDING } from "@/config/branding";
import { formatDate } from "@/lib/utils/format";
import {
  getPublicProjectAction,
  type PublicProjectData,
} from "@/actions/public/get-project";
import { approveProjectAction } from "@/actions/public/approve-project";
import { requestChangesAction } from "@/actions/public/request-changes";
import { trackPublicDownloadAction } from "@/actions/public/track-download";

/* ============================================
   PublicGallery — Client review portal
   Shows watermarked preview, approve/request
   changes buttons, and download (if enabled).
   ============================================ */

type PublicGalleryProps = {
  token: string;
  projectName: string;
};

const WORKFLOW_LABELS: Record<string, string> = {
  NEW: "جديد",
  PLANNING: "تخطيط",
  SHOOTING: "تصوير",
  EDITING: "تحرير",
  REVIEW: "مراجعة داخلية",
  REVISION: "تعديلات مطلوبة",
  APPROVED: "معتمد",
  DELIVERED: "تم التسليم",
  COMPLETED: "مكتمل",
  ARCHIVED: "مؤرشف",
  PAID: "مدفوع",
};

export function PublicGallery({ token, projectName }: PublicGalleryProps) {
  const [data, setData] = useState<PublicProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVideoIdx, setSelectedVideoIdx] = useState(0);
  const [approving, setApproving] = useState(false);
  const [requestingChanges, setRequestingChanges] = useState(false);
  const [changeMessage, setChangeMessage] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [showChangeBox, setShowChangeBox] = useState(false);

  const fetchData = useCallback(async () => {
    const result = await getPublicProjectAction(token);
    setData(result);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    let active = true;
    getPublicProjectAction(token).then((result) => {
      if (!active) return;
      setData(result);
      setLoading(false);
    });
    return () => { active = false };
  }, [token]);

  const handleApprove = async () => {
    setApproving(true);
    const result = await approveProjectAction(token);
    if (result.success) {
      toast.success("تم اعتماد المشروع بنجاح");
      fetchData();
    } else {
      toast.error(result.error ?? "فشل في الاعتماد");
    }
    setApproving(false);
  };

  const handleRequestChanges = async () => {
    if (!changeMessage.trim()) {
      toast.error("يرجى كتابة ملاحظات التعديل");
      return;
    }
    setRequestingChanges(true);
    const result = await requestChangesAction(token, changeMessage);
    if (result.success) {
      toast.success("تم إرسال طلب التعديلات");
      setChangeMessage("");
      setShowChangeBox(false);
      fetchData();
    } else {
      toast.error(result.error ?? "فشل في إرسال الطلب");
    }
    setRequestingChanges(false);
  };

  const handleDownload = async (videoId: string) => {
    setDownloading(true);
    const result = await trackPublicDownloadAction(token, videoId);
    if (result.success && result.url) {
      window.open(result.url, "_blank");
      fetchData();
    } else {
      toast.error(result.error ?? "فشل في التحميل");
    }
    setDownloading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-[300px] w-full rounded-lg mb-4" />
          <Skeleton className="h-8 w-48" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold">المشروع غير موجود</p>
          <p className="text-sm text-muted-foreground mt-2">رابط المعاينة غير صالح أو منتهي الصلاحية</p>
        </div>
      </div>
    );
  }

  const selectedVideo = data.videos[selectedVideoIdx];
  const canApprove = data.workflowStatus === "REVIEW" || data.workflowStatus === "DELIVERED";
  const isApproved = data.workflowStatus === "APPROVED" || data.workflowStatus === "DELIVERED" || data.workflowStatus === "COMPLETED";
  const isRevision = data.workflowStatus === "REVISION";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{data.name}</h1>
              <p className="text-sm text-muted-foreground">
                {data.clientName} · {data.projectCode}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {data.shootingDate && (
                <Badge variant="outline">
                  {formatDate(data.shootingDate)}
                </Badge>
              )}
              <Badge variant={isApproved ? "default" : isRevision ? "destructive" : "secondary"}>
                {WORKFLOW_LABELS[data.workflowStatus] ?? data.workflowStatus}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Video Player */}
        {selectedVideo && selectedVideo.streamUrl ? (
          <WatermarkedPlayer
            src={selectedVideo.streamUrl}
            poster={selectedVideo.thumbnailUrl ?? undefined}
          />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-lg bg-muted">
            <div className="text-center">
              <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">لا تتوفر معاينة لهذا الفيديو</p>
            </div>
          </div>
        )}

        {/* Video selector */}
        {data.videos.length > 1 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {data.videos.map((video, idx) => (
              <button
                key={video.id}
                onClick={() => setSelectedVideoIdx(idx)}
                className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors ${
                  idx === selectedVideoIdx ? "border-primary bg-primary/5" : "hover:bg-accent"
                }`}
              >
                <Play className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs font-medium truncate w-full text-center">{video.title}</span>
              </button>
            ))}
          </div>
        )}

        {/* Client Actions */}
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <h2 className="text-sm font-semibold">إجراءات العميل</h2>

          {isApproved && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle2 className="h-5 w-5" />
              <span>تم اعتماد هذا المشروع</span>
            </div>
          )}

          {isRevision && (
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <Edit3 className="h-5 w-5" />
              <span>تم طلب تعديلات على هذا المشروع — جاري العمل على التعديلات</span>
            </div>
          )}

          {/* Approve / Request Changes */}
          {canApprove && (
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleApprove}
                disabled={approving || isApproved}
                className="bg-green-600 hover:bg-green-700"
              >
                {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                اعتماد المشروع
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowChangeBox(!showChangeBox)}
                disabled={requestingChanges}
              >
                <Edit3 className="h-4 w-4" />
                طلب تعديلات
              </Button>
            </div>
          )}

          {/* Change request box */}
          {showChangeBox && (
            <div className="space-y-3 rounded-md border p-3">
              <Label htmlFor="changes">ملاحظات التعديل</Label>
              <textarea
                id="changes"
                value={changeMessage}
                onChange={(e) => setChangeMessage(e.target.value)}
                rows={4}
                placeholder="اكتب ملاحظات التعديل المطلوبة..."
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowChangeBox(false)}>
                  إلغاء
                </Button>
                <Button size="sm" onClick={handleRequestChanges} disabled={requestingChanges}>
                  {requestingChanges ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                  إرسال الطلب
                </Button>
              </div>
            </div>
          )}

          {/* Download (only if enabled by admin) */}
          {data.downloadEnabled && selectedVideo && (
            <div className="border-t pt-3">
              <Button
                variant="default"
                onClick={() => handleDownload(selectedVideo.id)}
                disabled={downloading}
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                تحميل النسخة النهائية
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">
                سيتم تسجيل معلومات التحميل (IP، الجهاز) لأغراض الأمان
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {BRANDING.companyName}</p>
          <p className="mt-1">هذه المعاينة محمية — يمنع التحميل أو التوزيع</p>
        </footer>
      </main>
    </div>
  );
}
