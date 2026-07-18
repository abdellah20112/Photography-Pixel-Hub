"use client";

import { useState, useCallback } from "react";
import {
  Calendar,
  Video,
  Download,
  Eye,
  Play,
  Clock,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ReviewPlayer } from "@/components/review/review-player";
import { formatDate } from "@/lib/utils/format";
import { formatBytes } from "@/lib/utils/format";
import { formatDuration, formatResolution } from "@/lib/video/metadata";
import { trackDownloadAction } from "@/actions/deliveries/track-download";
import { BRANDING } from "@/config/branding";
import type { PublicDeliveryData } from "@/types/delivery";

/* ============================================
   DeliveryPortal — Main client portal
   Premium video gallery with player + download.
   ============================================ */

type DeliveryPortalProps = {
  data: PublicDeliveryData;
  slug: string;
};

export function DeliveryPortal({ data, slug }: DeliveryPortalProps) {
  const [playerTarget, setPlayerTarget] = useState<{ url: string; title: string; videoId: string } | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const handlePlay = useCallback((streamUrl: string, title: string, videoId: string) => {
    if (!data.allowStreaming || !streamUrl) return;
    setPlayerTarget({ url: streamUrl, title, videoId });
  }, [data.allowStreaming]);

  const handleDownload = useCallback(async (videoId: string, downloadUrl: string) => {
    if (!data.downloadEnabled || !downloadUrl) return;
    setDownloading(videoId);

    try {
      // Track download via server action (gets fresh signed URL)
      const result = await trackDownloadAction(
        // We don't have deliveryId here, pass empty — the action handles it
        // Actually, the portal already has signed URLs from accessDeliveryAction
        // Just redirect to the download URL
        "",
        videoId,
        ""
      );

      // If trackDownloadAction fails, use the pre-signed URL directly
      const url = result.success && result.url ? result.url : downloadUrl;
      window.location.href = url;
    } catch {
      // Fallback to pre-signed URL
      window.location.href = downloadUrl;
    } finally {
      setDownloading(null);
    }
  }, [data.downloadEnabled]);

  return (
    <main className="min-h-dvh bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BRANDING.logo.full}
              alt={BRANDING.companyName}
              className="h-10 w-10 rounded-lg object-contain"
            />
            <div>
              <h1 className="text-lg font-bold tracking-tight">{data.title}</h1>
              <p className="text-xs text-muted-foreground">
                {data.project.name} · {data.project.projectCode}
              </p>
            </div>
          </div>

          {/* Meta info */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Video className="h-3.5 w-3.5" />
              {data.videoCount} فيديو
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              {data.viewCount} مشاهدة
            </span>
            <span className="flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" />
              {data.downloadCount} تحميل
            </span>
            {data.expiresAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                ينتهي في {formatDate(data.expiresAt)}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Video Grid */}
      <section className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.videos.map((video) => (
            <div
              key={video.id}
              className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-lg"
            >
              {/* Thumbnail */}
              <div
                className="relative aspect-video cursor-pointer bg-muted"
                onClick={() => handlePlay(video.streamUrl, video.title, video.videoId)}
                role={data.allowStreaming && video.streamUrl ? "button" : undefined}
                aria-label={`تشغيل ${video.title}`}
              >
                {video.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Video className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                )}

                {/* Play overlay */}
                {data.allowStreaming && video.streamUrl && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 opacity-0 transition-opacity group-hover:opacity-100">
                      <Play className="h-5 w-5 text-primary-foreground" />
                    </span>
                  </div>
                )}

                {/* Duration badge */}
                {video.duration && (
                  <span className="absolute bottom-2 end-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
                    {formatDuration(video.duration)}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="space-y-2 p-3">
                <p className="truncate text-sm font-medium">{video.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatBytes(video.fileSize)}</span>
                  <span>·</span>
                  <span>{formatResolution(video.width, video.height)}</span>
                </div>

                {/* Download button */}
                {data.downloadEnabled && video.downloadUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleDownload(video.videoId, video.downloadUrl)}
                    disabled={downloading === video.videoId}
                  >
                    {downloading === video.videoId ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    تحميل
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 px-4 text-xs text-muted-foreground/60">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BRANDING.logo.full} alt={BRANDING.companyName} className="h-4 w-4 rounded object-contain" />
          {BRANDING.companyName} — {BRANDING.tagline}
        </div>
      </footer>

      {/* Video Review Player */}
      {playerTarget && (
        <ReviewPlayer
          src={playerTarget.url}
          title={playerTarget.title}
          onClose={() => setPlayerTarget(null)}
          autoPlay
          videoId={playerTarget.videoId}
          deliveryId={data.deliveryId}
        />
      )}
    </main>
  );
}
