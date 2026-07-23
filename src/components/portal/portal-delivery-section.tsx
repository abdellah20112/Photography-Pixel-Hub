"use client";

import { useState } from "react";
import {
  Download,
  Loader2,
  FileVideo,
  Image as ImageIcon,
  FileArchive,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils/format";
import { trackPublicDownloadAction } from "@/actions/public/track-download";
import { getPublicFileUrlAction } from "@/actions/public/get-public-file-url";
import type { PortalVideo, PortalFile } from "@/actions/public/get-portal-data";

/* ============================================
   PortalDeliverySection — Delivery downloads
   Shows when project reaches DELIVERED status.
   Final video, thumbnail, and package files.
   All downloads use signed URLs.
   ============================================ */

type PortalDeliverySectionProps = {
  token: string;
  videos: PortalVideo[];
  files: PortalFile[];
};

export function PortalDeliverySection({
  token,
  videos,
  files,
}: PortalDeliverySectionProps) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const finalVideos = videos;
  const thumbnailFiles = files.filter((f) => f.fileType === "THUMBNAIL");
  const packageFiles = files.filter(
    (f) =>
      f.fileType !== "THUMBNAIL" &&
      f.fileType !== "PREVIEW_VIDEO" &&
      f.fileType !== "FINAL_VIDEO",
  );

  const handleVideoDownload = async (videoId: string) => {
    setDownloading(`video-${videoId}`);
    const result = await trackPublicDownloadAction(token, videoId);
    if (result.success && result.url) {
      window.open(result.url, "_blank");
    } else {
      toast.error(result.error ?? "فشل في التحميل");
    }
    setDownloading(null);
  };

  const handleFileDownload = async (fileId: string) => {
    setDownloading(`file-${fileId}`);
    const result = await getPublicFileUrlAction(token, fileId);
    if (result.success && result.url) {
      window.open(result.url, "_blank");
    } else {
      toast.error(result.error ?? "فشل في التحميل");
    }
    setDownloading(null);
  };

  if (finalVideos.length === 0 && files.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Download className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-white">التحميلات</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Final Videos */}
        {finalVideos.map((video) => (
          <div
            key={video.id}
            className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <FileVideo className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {video.title}
              </p>
              <p className="text-xs text-white/40">
                فيديو نهائي · {formatBytes(video.fileSize)}
              </p>
            </div>
            <Button
              size="sm"
              variant="default"
              className="shrink-0"
              onClick={() => handleVideoDownload(video.id)}
              disabled={downloading === `video-${video.id}`}
            >
              {downloading === `video-${video.id}` ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          </div>
        ))}

        {/* Thumbnail Files */}
        {thumbnailFiles.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <ImageIcon className="h-5 w-5 text-amber-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {file.fileName}
              </p>
              <p className="text-xs text-white/40">
                صورة مصغرة · {formatBytes(file.fileSize)}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-white/10 hover:bg-white/5"
              onClick={() => handleFileDownload(file.id)}
              disabled={downloading === `file-${file.id}`}
            >
              {downloading === `file-${file.id}` ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          </div>
        ))}

        {/* Package Files */}
        {packageFiles.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-500/10">
              <FileText className="h-5 w-5 text-teal-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {file.fileName}
              </p>
              <p className="text-xs text-white/40">
                {file.fileType} · {formatBytes(file.fileSize)}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-white/10 hover:bg-white/5"
              onClick={() => handleFileDownload(file.id)}
              disabled={downloading === `file-${file.id}`}
            >
              {downloading === `file-${file.id}` ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          </div>
        ))}
      </div>

      {/* Security notice */}
      <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.01] px-3 py-2">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-white/30" />
        <p className="text-xs text-white/30">
          جميع التحميلات مؤمنة بروابط موقعة وغير قابلة للتتبع. يتم تسجيل معلومات التحميل لأغراض الأمان.
        </p>
      </div>
    </section>
  );
}
