"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  MessageSquare,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Download,
  Lock,
  Film,
  Camera,
  PlayCircle,
  Smartphone,
  ShieldCheck,
  Music2,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { RevisionDialog } from "@/components/review/revision-dialog";
import { ReviewStatusBadge } from "@/components/review/review-status-badge";
import { PhoneFrame, StatusBar } from "@/components/review/phone-frame";
import {
  InstagramOverlay,
  TikTokOverlay,
  YouTubeOverlay,
  FacebookOverlay,
} from "@/components/review/social-overlays";
import { SafeZoneOverlay, type SocialMode } from "@/components/review/safe-zones-overlay";
import {
  DoubleTapHeart,
  PhoneSkeleton,
  EmptyStateIllustration,
} from "@/components/review/review-animations";
import { PortalCommentsSheet } from "@/components/portal/portal-comments-sheet";
import { approveProjectAction } from "@/actions/public/approve-project";
import { trackPublicDownloadAction } from "@/actions/public/track-download";
import { getCommentsAction } from "@/actions/reviews/get-comments";
import { formatDuration } from "@/lib/video/metadata";
import { cn } from "@/lib/utils/cn";
import type { PortalData, PortalVideo } from "@/actions/public/get-portal-data";
import type { TimelineMarker } from "@/types/review";

/* ============================================
   PortalProjectViewer — Premium phone-frame
   video viewer for the public client portal.
   Mobile-first, desktop adapts naturally.
   Reuses: PhoneFrame, SocialOverlays,
   SafeZoneOverlay, CommentsSheet, RevisionDialog.
   ============================================ */

type PortalProjectViewerProps = {
  data: PortalData;
  token: string;
};

const SOCIAL_MODES: {
  value: SocialMode;
  label: string;
  icon: typeof Camera;
  short: string;
}[] = [
  { value: "instagram", label: "Instagram", icon: Camera, short: "IG" },
  { value: "tiktok", label: "TikTok", icon: Music2, short: "TT" },
  { value: "youtube", label: "Shorts", icon: PlayCircle, short: "YT" },
  { value: "facebook", label: "Facebook", icon: Smartphone, short: "FB" },
];

export function PortalProjectViewer({ data, token }: PortalProjectViewerProps) {
  const { project, videos, delivery } = data;
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef(0);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);

  // Navigation
  const [selectedVideoIdx, setSelectedVideoIdx] = useState(0);

  // Social mode
  const [socialMode, setSocialMode] = useState<SocialMode>("instagram");
  const [showSafeZones, setShowSafeZones] = useState(false);

  // UI visibility
  const [uiVisible, setUiVisible] = useState(true);
  const uiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Comments
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  // Approval / Revision
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(
    project.workflowStatus === "APPROVED" ||
      project.workflowStatus === "DELIVERED" ||
      project.workflowStatus === "COMPLETED",
  );
  const [showRevision, setShowRevision] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState(project.workflowStatus);
  const [downloading, setDownloading] = useState(false);

  // Double tap heart
  const [heart, setHeart] = useState<{ x: number; y: number; key: number } | null>(null);

  const selectedVideo = videos[selectedVideoIdx];
  const deliveryId = delivery?.id ?? null;
  const canApprove = workflowStatus === "REVIEW";
  const isApproved =
    workflowStatus === "APPROVED" ||
    workflowStatus === "DELIVERED" ||
    workflowStatus === "COMPLETED";
  const isRevision = workflowStatus === "REVISION";
  const canDownload =
    (workflowStatus === "DELIVERED" || workflowStatus === "COMPLETED") &&
    !!selectedVideo?.downloadUrl;

  // ── Auto-hide UI ──────────────────────────
  const showUI = useCallback(() => {
    setUiVisible(true);
    if (uiTimerRef.current) clearTimeout(uiTimerRef.current);
    uiTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setUiVisible(false);
      }
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (uiTimerRef.current) clearTimeout(uiTimerRef.current);
    };
  }, []);

  // ── Video event listeners ──────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setContentLoaded(false);
    setVideoError(false);

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onLoadedMetadata = () => {
      setDuration(video.duration);
      setBuffering(false);
      setContentLoaded(true);
    };
    const onPlay = () => {
      setIsPlaying(true);
      showUI();
    };
    const onPause = () => {
      setIsPlaying(false);
      setUiVisible(true);
    };
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => setBuffering(false);
    const onError = () => {
      setVideoError(true);
      setBuffering(false);
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("error", onError);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("error", onError);
    };
  }, [selectedVideoIdx, showUI]);

  // ── Fullscreen tracking ────────────────────
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(document.fullscreenElement === stageRef.current);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // ── Fetch comment count ────────────────────
  useEffect(() => {
    if (!selectedVideo) return;
    let active = true;
    getCommentsAction({ videoId: selectedVideo.id }).then((result) => {
      if (!active) return;
      setCommentCount(result.items.length);
    });
    return () => {
      active = false;
    };
  }, [selectedVideo, showComments]);

  // ── Player controls ────────────────────────
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      showUI();
    } else {
      video.pause();
    }
  }, [showUI]);

  const seekTo = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = seconds;
    video.pause();
    setUiVisible(true);
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const handleSeekBar = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const video = videoRef.current;
      if (!video || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      video.currentTime = percent * duration;
    },
    [duration],
  );

  const toggleFullscreen = useCallback(() => {
    const container = stageRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  }, []);

  // ── Video tap handler ──────────────────────
  // Per user feedback: single tap shows UI only (no play/pause toggle).
  // Double tap shows heart. Play/pause via visible button only.
  const handleVideoTap = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;

      if (timeSinceLastTap < 300) {
        // Double tap → show heart
        lastTapRef.current = 0;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setHeart({ x, y, key: now });
        setTimeout(() => setHeart(null), 800);
        return;
      }

      lastTapRef.current = now;

      // Single tap: show UI only (no play/pause toggle)
      showUI();
    },
    [showUI],
  );

  // ── Approve action ─────────────────────────
  const handleApprove = useCallback(async () => {
    setApproving(true);
    try {
      const result = await approveProjectAction(token);
      if (result.success) {
        setApproved(true);
        setWorkflowStatus("APPROVED");
        toast.success("تم اعتماد المشروع بنجاح");
      } else {
        toast.error(result.error ?? "فشل في الاعتماد");
      }
    } catch {
      toast.error("فشل في الاعتماد");
    } finally {
      setApproving(false);
    }
  }, [token]);

  // ── Download action ────────────────────────
  const handleDownload = useCallback(async () => {
    if (!selectedVideo) return;
    setDownloading(true);
    toast.info("جاري توليد رابط التحميل الآمن...");
    const result = await trackPublicDownloadAction(token, selectedVideo.id);
    if (result.success && result.url) {
      window.open(result.url, "_blank");
    } else {
      toast.error(result.error ?? "فشل في التحميل");
    }
    setDownloading(false);
  }, [token, selectedVideo]);

  // ── Comment markers ────────────────────────
  const [markers, setMarkers] = useState<TimelineMarker[]>([]);

  useEffect(() => {
    if (!selectedVideo) return;
    let active = true;
    getCommentsAction({ videoId: selectedVideo.id }).then((result) => {
      if (!active) return;
      setMarkers(
        result.items.map((c) => ({
          id: c.id,
          commentCode: c.commentCode,
          timestampSeconds: c.timestampSeconds,
          authorName: c.authorName,
          message: c.message,
          status: c.status,
        })),
      );
      setCommentCount(result.items.length);
    });
    return () => {
      active = false;
    };
  }, [selectedVideo, showComments]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const username = project.name
    .toLowerCase()
    .replace(/\s/g, "_")
    .replace(/[^\w]/g, "");

  return (
    <div
      className="flex h-[100dvh] flex-col bg-[#08080a] text-white"
      ref={stageRef}
    >
      {/* ── Header ──────────────────────────────── */}
      <header
        className={cn(
          "flex shrink-0 items-center justify-between border-b border-white/8 px-3 py-2.5 sm:px-4 sm:py-3 transition-all duration-300",
          uiVisible ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            className="flex items-center gap-1 rounded-lg px-1.5 py-1 text-white/60 transition-all hover:bg-white/8 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95"
            onClick={() => window.history.back()}
            aria-label="رجوع"
          >
            <ChevronLeft className="h-4 w-4 rtl-flip" />
            <span className="hidden text-sm sm:inline">رجوع</span>
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-xs font-semibold sm:text-sm">
              {project.name}
            </h1>
            <p className="text-[10px] text-white/40 sm:text-xs">
              {project.projectCode}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <ReviewStatusBadge status={workflowStatus} size="sm" />
        </div>
      </header>

      {/* ── Toolbar: social mode + safe zones ── */}
      <div
        className={cn(
          "flex shrink-0 items-center gap-2 border-b border-white/8 px-3 py-2 sm:px-4 transition-all duration-300",
          uiVisible ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <div
          className="flex items-center gap-0.5 rounded-xl border border-white/10 bg-white/5 p-0.5"
          role="radiogroup"
          aria-label="وضع المنصة"
        >
          {SOCIAL_MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = socialMode === mode.value;
            return (
              <button
                key={mode.value}
                role="radio"
                aria-checked={isActive}
                onClick={() => setSocialMode(mode.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-3 active:scale-95",
                  isActive
                    ? "bg-white text-black shadow-sm"
                    : "text-white/40 hover:text-white/70",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{mode.label}</span>
                <span className="sm:hidden">{mode.short}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowSafeZones((s) => !s)}
          className={cn(
            "flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95",
            showSafeZones
              ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
              : "border-white/10 text-white/40 hover:text-white/70",
          )}
          aria-pressed={showSafeZones}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Safe Zones</span>
        </button>
      </div>

      {/* ── Main stage: Phone mockup ──────────── */}
      <div className="flex flex-1 items-center justify-center overflow-hidden p-3 sm:p-6">
        {videos.length === 0 ? (
          <EmptyStateIllustration
            type="no-videos"
            title="لا توجد فيديوهات"
            subtitle="لم يتم رفع أي فيديوهات بعد"
          />
        ) : selectedVideo?.streamUrl && !videoError ? (
          <div
            key={selectedVideoIdx}
            className="relative h-full animate-fade-in"
            style={{ aspectRatio: "9 / 16", maxWidth: "100%" }}
          >
            <PhoneFrame className={cn(contentLoaded && "animate-fade-in")}>
              {/* Status bar */}
              <StatusBar />

              {/* Video element */}
              <video
                ref={videoRef}
                src={selectedVideo.streamUrl}
                poster={selectedVideo.thumbnailUrl ?? undefined}
                className="h-full w-full object-contain"
                style={{ aspectRatio: "9 / 16" }}
                playsInline
                muted={isMuted}
                autoPlay
              />

              {/* Buffering spinner */}
              {buffering && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-white/50" />
                </div>
              )}

              {/* Safe zone overlay */}
              {showSafeZones && <SafeZoneOverlay mode={socialMode} />}

              {/* Social platform overlays */}
              {socialMode === "instagram" && (
                <InstagramOverlay
                  projectName={project.name}
                  username={username}
                  commentCount={commentCount}
                />
              )}
              {socialMode === "tiktok" && (
                <TikTokOverlay
                  projectName={project.name}
                  username={username}
                  commentCount={commentCount}
                />
              )}
              {socialMode === "youtube" && (
                <YouTubeOverlay
                  projectName={project.name}
                  username={username}
                />
              )}
              {socialMode === "facebook" && (
                <FacebookOverlay
                  projectName={project.name}
                  username={username}
                />
              )}

              {/* Double tap heart */}
              {heart && (
                <DoubleTapHeart
                  x={heart.x}
                  y={heart.y}
                  animationKey={heart.key}
                />
              )}

              {/* Tap overlay — show UI on single tap */}
              <button
                onClick={handleVideoTap}
                className="absolute inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="إظهار عناصر التحكم"
              />

              {/* Play overlay when paused */}
              {!isPlaying && !buffering && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={togglePlay}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-black/40 backdrop-blur-md transition-transform active:scale-95"
                    aria-label="تشغيل"
                  >
                    <Play className="h-8 w-8 text-white" fill="white" />
                  </button>
                </div>
              )}

              {/* Timeline + controls (bottom) */}
              <div
                className={cn(
                  "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-2 pb-2 pt-10 transition-all duration-300",
                  uiVisible ? "opacity-100" : "opacity-0 pointer-events-none",
                )}
              >
                {/* Seek bar with markers */}
                <div
                  className="group relative mb-2 h-1 cursor-pointer rounded-full bg-white/20"
                  onClick={handleSeekBar}
                  role="slider"
                  aria-label="الانتقال في الفيديو"
                  aria-valuemin={0}
                  aria-valuemax={duration}
                  aria-valuenow={currentTime}
                >
                  <div
                    className="absolute h-full rounded-full bg-white"
                    style={{ width: `${progress}%` }}
                  />
                  {duration > 0 &&
                    markers.map((marker) => {
                      const left = (marker.timestampSeconds / duration) * 100;
                      return (
                        <div
                          key={marker.id}
                          className="absolute top-1/2 h-3 w-0.5 origin-bottom -translate-y-1/2 cursor-pointer rounded-full bg-amber-400"
                          style={{ left: `${left}%` }}
                          onClick={(e) => {
                            e.stopPropagation();
                            seekTo(marker.timestampSeconds);
                          }}
                        />
                      );
                    })}
                  <div
                    className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg"
                    style={{ left: `${progress}%` }}
                  />
                </div>

                {/* Bottom controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={togglePlay}
                      className="text-white/90 transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                      aria-label={isPlaying ? "إيقاف" : "تشغيل"}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={toggleMute}
                      className="text-white/90 transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                      aria-label="كتم الصوت"
                    >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </button>
                    <span
                      className="text-[10px] font-mono text-white/60"
                      dir="ltr"
                    >
                      {formatDuration(currentTime)} / {formatDuration(duration)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleFullscreen}
                      className="text-white/90 transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                      aria-label="ملء الشاشة"
                    >
                      {isFullscreen ? (
                        <Minimize className="h-4 w-4" />
                      ) : (
                        <Maximize className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Floating comment button */}
              <button
                onClick={() => setShowComments(true)}
                className={cn(
                  "absolute end-2 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-0.5 rounded-full bg-black/40 p-2.5 backdrop-blur-md transition-all hover:bg-black/60 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95",
                  uiVisible
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none",
                )}
                aria-label={`التعليقات (${commentCount})`}
              >
                <MessageSquare className="h-5 w-5 text-white" />
                {commentCount > 0 && (
                  <span className="text-[9px] font-bold text-white">
                    {commentCount}
                  </span>
                )}
              </button>

              {/* Floating action buttons */}
              <div
                className={cn(
                  "absolute bottom-20 start-2 z-20 flex flex-col gap-1.5 transition-all duration-300",
                  uiVisible
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none",
                )}
              >
                {canApprove && (
                  <>
                    <button
                      onClick={() => setShowApproveConfirm(true)}
                      disabled={approving || approved}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium shadow-lg backdrop-blur-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 active:scale-95 hover:scale-105",
                        approved
                          ? "bg-green-600 text-white"
                          : "bg-green-600/80 text-white hover:bg-green-600",
                      )}
                      aria-label={approved ? "معتمد" : "اعتماد"}
                    >
                      {approving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      <span className="hidden sm:inline">
                        {approved ? "معتمد" : "اعتماد"}
                      </span>
                    </button>
                    <button
                      onClick={() => setShowRevision(true)}
                      className="flex items-center gap-1.5 rounded-full bg-orange-500/80 px-3 py-2 text-xs font-medium text-white shadow-lg backdrop-blur-md transition-all hover:bg-orange-500 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 active:scale-95"
                      aria-label="طلب تعديل"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">تعديل</span>
                    </button>
                  </>
                )}

                {isApproved && !canApprove && (
                  <div className="flex items-center gap-1.5 rounded-full bg-green-600/20 px-3 py-2 text-xs font-medium text-green-400 backdrop-blur-md">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">معتمد</span>
                  </div>
                )}

                {isRevision && (
                  <div className="flex items-center gap-1.5 rounded-full bg-orange-500/20 px-3 py-2 text-xs font-medium text-orange-400 backdrop-blur-md">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">قيد التعديل</span>
                  </div>
                )}

                {canDownload && (
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-xs font-medium text-white shadow-lg backdrop-blur-md transition-all hover:bg-white/20 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 active:scale-95"
                    aria-label="تحميل"
                  >
                    {downloading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    <span className="hidden sm:inline">تحميل</span>
                  </button>
                )}

                {selectedVideo?.status === "READY" &&
                  !canDownload &&
                  !selectedVideo.downloadUrl && (
                    <div className="flex items-center gap-1 rounded-full bg-black/30 px-2.5 py-1.5 text-[10px] text-white/40 backdrop-blur-sm">
                      <Lock className="h-3 w-3" />
                      <span className="hidden sm:inline">معاينة</span>
                    </div>
                  )}
              </div>
            </PhoneFrame>
          </div>
        ) : videoError ? (
          <EmptyStateIllustration
            type="video-error"
            title="تعذر تحميل الفيديو"
            subtitle="تحقق من الاتصال وحاول مرة أخرى"
          />
        ) : (
          <PhoneSkeleton />
        )}
      </div>

      {/* ── Video selector ──────────────────────── */}
      {videos.length > 1 && (
        <div
          className={cn(
            "shrink-0 border-t border-white/8 bg-[#0c0c0e] px-3 py-2 transition-all duration-300",
            uiVisible ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          <div className="flex gap-2 overflow-x-auto">
            {videos.map((video, idx) => (
              <button
                key={video.id}
                onClick={() => setSelectedVideoIdx(idx)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95",
                  idx === selectedVideoIdx
                    ? "border-primary bg-primary/10 text-white scale-105"
                    : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/20",
                )}
              >
                <Film className="h-3.5 w-3.5" />
                <span className="max-w-24 truncate">{video.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Comments sheet ─────────────────────── */}
      <PortalCommentsSheet
        open={showComments}
        onClose={() => setShowComments(false)}
        videoId={selectedVideo?.id ?? ""}
        deliveryId={deliveryId}
        currentTime={currentTime}
        onSeek={seekTo}
      />

      {/* ── Approve confirmation dialog ────────── */}
      <ConfirmDialog
        open={showApproveConfirm}
        onOpenChange={setShowApproveConfirm}
        title="اعتماد المشروع"
        description="هل أنت متأكد من اعتماد هذا المشروع؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="نعم، اعتماد"
        cancelLabel="إلغاء"
        variant="default"
        onConfirm={handleApprove}
      />

      {/* ── Revision dialog ─────────────────────── */}
      <RevisionDialog
        open={showRevision}
        onOpenChange={setShowRevision}
        projectId={token}
        projectToken={token}
        onSuccess={() => {
          setWorkflowStatus("REVISION");
          setShowRevision(false);
        }}
      />
    </div>
  );
}
