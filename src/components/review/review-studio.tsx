"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  MessageSquare,
  X,
  CheckCircle2,
  Loader2,
  Send,
  Clock,
  ChevronLeft,
  Film,
  AlertTriangle,
  Download,
  Lock,
  Camera,
  Monitor,
  PlayCircle,
  Smartphone,
  ShieldCheck,
  Music2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewStatusBadge } from "@/components/review/review-status-badge";
import { RevisionDialog } from "@/components/review/revision-dialog";
import { CommentItem } from "@/components/review/comment-item";
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
import { useReviewKeyboard } from "@/hooks/use-review-keyboard";
import { useDraftComment } from "@/hooks/use-draft-comment";
import { useAutoHideUI } from "@/hooks/use-auto-hide-ui";
import { useSwipeNavigation } from "@/hooks/use-swipe-navigation";
import { useHoldToSpeed } from "@/hooks/use-hold-to-speed";
import { getCommentsAction } from "@/actions/reviews/get-comments";
import { createCommentAction } from "@/actions/reviews/create-comment";
import { approveVideoAction } from "@/actions/reviews/approve-video";
import { transitionWorkflowAction } from "@/actions/workflow/transition";
import { formatDuration } from "@/lib/video/metadata";
import type { CommentItem as CommentItemType, TimelineMarker } from "@/types/review";
import type { ProjectWorkflowStatus } from "@prisma/client";
import { cn } from "@/lib/utils/cn";

/* ============================================
   ReviewStudio — Social Preview Studio
   Vertical 9:16 video inside a premium phone mockup.
   Social platform overlays (IG/TikTok/YT/FB).
   Auto-hide UI, swipe nav, double-tap heart,
   hold-to-speed, screenshot & presentation modes.
   Mobile-first, desktop adapts naturally.
   ============================================ */

type VideoData = {
  id: string;
  videoCode: string;
  title: string;
  streamUrl: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  status: string;
  fileType: string;
};

type ReviewStudioProps = {
  projectId: string;
  projectCode: string;
  projectName: string;
  workflowStatus: string;
  projectToken: string;
  videos: VideoData[];
  isTeam: boolean;
};

const PLAYBACK_SPEEDS = [0.5, 1, 1.25, 1.5, 2];

const SOCIAL_MODES: { value: SocialMode; label: string; icon: typeof Camera; shortLabel: string }[] = [
  { value: "none", label: "بدون", icon: Film, shortLabel: "بدون" },
  { value: "instagram", label: "Instagram", icon: Camera, shortLabel: "IG" },
  { value: "tiktok", label: "TikTok", icon: Music2, shortLabel: "TT" },
  { value: "youtube", label: "Shorts", icon: PlayCircle, shortLabel: "YT" },
  { value: "facebook", label: "Facebook", icon: Smartphone, shortLabel: "FB" },
];

export function ReviewStudio({
  projectId,
  projectCode,
  projectName,
  workflowStatus: initialWorkflowStatus,
  projectToken,
  videos,
  isTeam,
}: ReviewStudioProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef(0);
  const speedHoldRef = useRef(false);
  const pointerDownTime = useRef(0);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [buffering, setBuffering] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Review state
  const [selectedVideoIdx, setSelectedVideoIdx] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [markers, setMarkers] = useState<TimelineMarker[]>([]);
  const [comments, setComments] = useState<CommentItemType[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentSearch, setCommentSearch] = useState("");
  const [commentFilter, setCommentFilter] = useState<string>("all");
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);
  const [showRevision, setShowRevision] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState(initialWorkflowStatus);
  const [downloading, setDownloading] = useState(false);
  const [hoveredMarker, setHoveredMarker] = useState<TimelineMarker | null>(null);

  // Social mode state
  const [socialMode, setSocialMode] = useState<SocialMode>("instagram");
  const [showSafeZones, setShowSafeZones] = useState(false);

  // New feature state
  const [screenshotMode, setScreenshotMode] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [doubleTapHeart, setDoubleTapHeart] = useState<{ x: number; y: number; key: number } | null>(null);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [swipeDir, setSwipeDir] = useState<"up" | "down">("up");

  // Draft comment
  const { draft, updateDraft, clearDraft } = useDraftComment(
    videos[selectedVideoIdx]?.id ?? "",
  );

  const selectedVideo = videos[selectedVideoIdx];
  const isPreviewVideo = selectedVideo?.fileType === "PREVIEW_VIDEO";
  const canDownload = selectedVideo?.fileType === "FINAL_VIDEO" &&
    (workflowStatus === "DELIVERED" || workflowStatus === "COMPLETED" || isTeam);
  const canApprove = workflowStatus === "REVIEW" || workflowStatus === "REVISION";
  const isApproved = workflowStatus === "APPROVED" ||
    workflowStatus === "DELIVERED" || workflowStatus === "COMPLETED";

  // Auto-hide UI (disabled in screenshot/presentation mode)
  const isChromeless = screenshotMode || presentationMode;
  const { uiVisible, showUI } = useAutoHideUI(isPlaying, !isChromeless);

  // ── Video navigation ─────────────────────
  const handleNextVideo = useCallback(() => {
    if (selectedVideoIdx >= videos.length - 1) return;
    setLoadingComments(true);
    setSwipeDir("up");
    setSelectedVideoIdx(selectedVideoIdx + 1);
  }, [selectedVideoIdx, videos.length]);

  const handlePrevVideo = useCallback(() => {
    if (selectedVideoIdx <= 0) return;
    setLoadingComments(true);
    setSwipeDir("down");
    setSelectedVideoIdx(selectedVideoIdx - 1);
  }, [selectedVideoIdx]);

  // Swipe navigation
  const swipeHandlers = useSwipeNavigation({
    onNext: handleNextVideo,
    onPrev: handlePrevVideo,
    disabled: isChromeless || showPanel || showCommentForm,
  });

  // Hold-to-speed
  const holdSpeed = useHoldToSpeed({
    videoRef,
    disabled: isChromeless,
  });

  // ── Video event listeners ─────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setContentLoaded(false);

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onLoadedMetadata = () => {
      setDuration(video.duration);
      setBuffering(false);
      setVideoError(false);
      setContentLoaded(true);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
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
  }, [selectedVideoIdx]);

  // ── Fullscreen tracking ────────────────────
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(document.fullscreenElement === stageRef.current);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // ── Fetch comments ────────────────────────
  useEffect(() => {
    if (!selectedVideo) return;
    let active = true;
    getCommentsAction({ videoId: selectedVideo.id }).then((result) => {
      if (!active) return;
      setComments(result.items);
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
      setLoadingComments(false);
    });
    return () => { active = false };
  }, [selectedVideo]);

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

  const seek = useCallback((delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + delta));
  }, []);

  const seekTo = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = seconds;
    video.pause();
  }, []);

  const handleSeekBar = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * duration;
  }, [duration]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const vol = parseFloat(e.target.value);
    video.volume = vol;
    video.muted = vol === 0;
    setVolume(vol);
    setIsMuted(vol === 0);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = stageRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  }, []);

  const changePlaybackRate = useCallback((rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  }, []);

  // ── Video tap handler (single/double tap) ──
  const handleVideoTap = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    // Suppress tap if we just released a hold-to-speed
    if (speedHoldRef.current) {
      speedHoldRef.current = false;
      return;
    }

    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < 300) {
      // Double tap → show heart
      lastTapRef.current = 0;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setDoubleTapHeart({ x, y, key: now });
      setTimeout(() => setDoubleTapHeart(null), 800);
      return;
    }

    lastTapRef.current = now;

    // Single tap: show UI if hidden, otherwise toggle play/pause
    if (!uiVisible) {
      showUI();
      return;
    }
    togglePlay();
  }, [uiVisible, showUI, togglePlay]);

  // ── Hold-to-speed pointer handlers ─────────
  const handlePointerDown = useCallback(() => {
    pointerDownTime.current = Date.now();
    holdSpeed.onPointerDown();
  }, [holdSpeed]);

  const handlePointerUp = useCallback(() => {
    const heldDuration = Date.now() - pointerDownTime.current;
    if (heldDuration >= 500) {
      speedHoldRef.current = true;
    }
    holdSpeed.onPointerUp();
  }, [holdSpeed]);

  // ── Keyboard shortcuts ─────────────────────
  useReviewKeyboard({
    onTogglePlay: togglePlay,
    onSeek: seek,
    onToggleMute: toggleMute,
    onToggleFullscreen: toggleFullscreen,
    onAddComment: () => {
      const video = videoRef.current;
      if (!video) return;
      video.pause();
      setShowCommentForm(true);
    },
    onClose: () => {
      if (screenshotMode) { setScreenshotMode(false); return; }
      if (presentationMode) { setPresentationMode(false); return; }
      if (showCommentForm) setShowCommentForm(false);
      else if (showPanel) setShowPanel(false);
    },
    onToggleScreenshot: () => setScreenshotMode((s) => !s),
    onTogglePresentation: () => setPresentationMode((p) => !p),
  });

  // ── Comment actions ────────────────────────
  const handleAddComment = async (authorName: string, authorEmail: string, message: string) => {
    if (!selectedVideo || !message.trim()) return;

    const result = await createCommentAction({
      videoId: selectedVideo.id,
      deliveryId: "",
      authorName,
      authorEmail,
      message,
      timestampSeconds: Math.floor(currentTime),
    });

    if (result.success) {
      toast.success("تم إضافة التعليق");
      clearDraft();
      setShowCommentForm(false);
      const refreshed = await getCommentsAction({ videoId: selectedVideo.id });
      setComments(refreshed.items);
      setMarkers(
        refreshed.items.map((c) => ({
          id: c.id,
          commentCode: c.commentCode,
          timestampSeconds: c.timestampSeconds,
          authorName: c.authorName,
          message: c.message,
          status: c.status,
        })),
      );
    } else {
      toast.error(result.error ?? "فشل في إضافة التعليق");
    }
  };

  // ── Approve action ─────────────────────────
  const handleApprove = async () => {
    if (!selectedVideo) return;
    setApproving(true);
    try {
      await approveVideoAction({
        videoId: selectedVideo.id,
        deliveryId: "",
        deliverySlug: "",
      });
      await transitionWorkflowAction({
        projectId,
        toStatus: "APPROVED" as ProjectWorkflowStatus,
      });
      setApproved(true);
      setWorkflowStatus("APPROVED");
      toast.success("تم اعتماد الفيديو");
    } catch {
      toast.error("فشل في الاعتماد");
    } finally {
      setApproving(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    toast.info("جاري توليد رابط التحميل الآمن...");
    setDownloading(false);
  };

  // ── Filtered comments ──────────────────────
  const filteredComments = useMemo(() => {
    let result = comments;
    if (commentFilter === "open") result = result.filter((c) => c.status === "OPEN");
    else if (commentFilter === "resolved") result = result.filter((c) => c.status === "RESOLVED");
    else if (commentFilter === "archived") result = result.filter((c) => c.status === "ARCHIVED");

    if (commentSearch.trim()) {
      const q = commentSearch.toLowerCase();
      result = result.filter(
        (c) => c.message.toLowerCase().includes(q) || c.authorName.toLowerCase().includes(q),
      );
    }
    return result;
  }, [comments, commentFilter, commentSearch]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const username = projectName.toLowerCase().replace(/\s/g, "_").replace(/[^\w]/g, "");

  return (
    <div className="flex h-[100dvh] flex-col bg-[#08080a] text-white" ref={stageRef}>
      {/* ── Header ──────────────────────────────── */}
      {!screenshotMode && (
        <header className={cn("shrink-0 items-center justify-between border-b border-white/8 px-3 py-2.5 sm:px-4 sm:py-3 flex transition-all duration-300", uiVisible && !presentationMode ? "ui-visible" : "ui-hidden")}>
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
              <h1 className="truncate text-xs font-semibold sm:text-sm">{projectName}</h1>
              <p className="text-[10px] text-white/40 sm:text-xs">{projectCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {!presentationMode && <ReviewStatusBadge status={workflowStatus} size="sm" />}
            {/* Screenshot mode toggle */}
            <button
              onClick={() => setScreenshotMode((s) => !s)}
              className={cn(
                "flex items-center justify-center rounded-lg p-1.5 text-xs transition-all active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                screenshotMode
                  ? "bg-primary text-primary-foreground"
                  : "text-white/40 hover:bg-white/8 hover:text-white",
              )}
              aria-label="وضع لقطة الشاشة"
              aria-pressed={screenshotMode}
            >
              <Camera className="h-4 w-4" />
            </button>
            {/* Presentation mode toggle */}
            <button
              onClick={() => setPresentationMode((p) => !p)}
              className={cn(
                "flex items-center justify-center rounded-lg p-1.5 text-xs transition-all active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                presentationMode
                  ? "bg-primary text-primary-foreground"
                  : "text-white/40 hover:bg-white/8 hover:text-white",
              )}
              aria-label="وضع العرض"
              aria-pressed={presentationMode}
            >
              <Monitor className="h-4 w-4" />
            </button>
          </div>
        </header>
      )}

      {/* ── Toolbar: Segmented social mode + safe zones ── */}
      {!screenshotMode && !presentationMode && (
        <div className={cn("shrink-0 items-center gap-2 border-b border-white/8 px-3 py-2 sm:px-4 flex transition-all duration-300", uiVisible ? "ui-visible" : "ui-hidden")}>
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
                  <span className="sm:hidden">{mode.shortLabel}</span>
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
      )}

      {/* ── Main stage: Phone mockup + side panel ── */}
      <div
        className="flex flex-1 overflow-hidden"
        {...swipeHandlers}
      >
        {/* ── Phone area ─────────────────────────── */}
        <div className="flex flex-1 flex-col items-center justify-center overflow-hidden p-3 sm:p-6">
          {videos.length === 0 ? (
            <EmptyStateIllustration
              type="no-videos"
              title="لا توجد فيديوهات"
              subtitle="لم يتم رفع أي فيديوهات بعد"
            />
          ) : selectedVideo?.streamUrl && !videoError ? (
            <div
              key={selectedVideoIdx}
              className={cn(
                "relative h-full",
                swipeDir === "up" ? "animate-slide-up-in" : "animate-slide-down-in",
              )}
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
                />

                {/* Buffering spinner */}
                {buffering && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-white/50" />
                  </div>
                )}

                {/* ── Safe zone overlay ─────────── */}
                {showSafeZones && <SafeZoneOverlay mode={socialMode} />}

                {/* ── Social platform UI ──────── */}
                {socialMode === "instagram" && (
                  <InstagramOverlay projectName={projectName} username={username} commentCount={comments.length} />
                )}
                {socialMode === "tiktok" && (
                  <TikTokOverlay projectName={projectName} username={username} commentCount={comments.length} />
                )}
                {socialMode === "youtube" && (
                  <YouTubeOverlay projectName={projectName} username={username} />
                )}
                {socialMode === "facebook" && (
                  <FacebookOverlay projectName={projectName} username={username} />
                )}

                {/* ── Double tap heart ─────────── */}
                {doubleTapHeart && (
                  <DoubleTapHeart
                    x={doubleTapHeart.x}
                    y={doubleTapHeart.y}
                    animationKey={doubleTapHeart.key}
                  />
                )}

                {/* ── Hold-to-speed indicator ──── */}
                {holdSpeed.isSpeeding && (
                  <div className="absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2">
                    <div className="animate-speed-pulse rounded-full bg-black/60 px-4 py-2 backdrop-blur-md">
                      <span className="text-lg font-bold text-white">2x</span>
                    </div>
                  </div>
                )}

                {/* ── Tap overlay (play/pause + UI show) ─ */}
                <button
                  onClick={handleVideoTap}
                  onPointerDown={handlePointerDown}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={holdSpeed.onPointerLeave}
                  className="absolute inset-0 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
                >
                  {!isPlaying && !buffering && uiVisible && !isChromeless && (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/40 backdrop-blur-md transition-transform active:scale-95">
                      <Play className="h-8 w-8 text-white" fill="white" />
                    </div>
                  )}
                </button>

                {/* ── Timeline + controls (bottom) ─ */}
                {!isChromeless && (
                  <div className={cn("absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-2 pb-2 pt-10 transition-all duration-300", uiVisible ? "ui-visible" : "ui-hidden")}>
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
                      <div className="absolute h-full rounded-full bg-white" style={{ width: `${progress}%` }} />
                      {duration > 0 && markers.map((marker) => {
                        const left = (marker.timestampSeconds / duration) * 100;
                        return (
                          <div
                            key={marker.id}
                            className="absolute top-1/2 h-3 w-0.5 origin-bottom -translate-y-1/2 cursor-pointer rounded-full bg-amber-400 transition-all duration-200 group-hover:scale-x-150"
                            style={{ left: `${left}%` }}
                            onMouseEnter={() => setHoveredMarker(marker)}
                            onMouseLeave={() => setHoveredMarker(null)}
                            onClick={(e) => {
                              e.stopPropagation();
                              seekTo(marker.timestampSeconds);
                            }}
                          />
                        );
                      })}
                      <div
                        className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg transition-transform group-hover:scale-125"
                        style={{ left: `${progress}%` }}
                      />
                    </div>

                    {/* Bottom controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={togglePlay} className="text-white/90 transition-transform hover:scale-110 active:scale-95 focus:outline-none" aria-label={isPlaying ? "إيقاف" : "تشغيل"}>
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </button>
                        <button onClick={toggleMute} className="text-white/90 transition-transform hover:scale-110 active:scale-95 focus:outline-none" aria-label="كتم الصوت">
                          {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </button>
                        <span className="text-[10px] text-white/60 font-mono" dir="ltr">
                          {formatDuration(currentTime)} / {formatDuration(duration)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <button
                            onClick={() => setShowSpeedMenu((s) => !s)}
                            className="text-[10px] text-white/60 transition-colors hover:text-white focus:outline-none"
                            aria-label="سرعة التشغيل"
                          >
                            {playbackRate}x
                          </button>
                          {showSpeedMenu && (
                            <div className="absolute bottom-full end-0 mb-2 rounded-lg border border-white/10 bg-[#1a1a1b] p-1 shadow-xl">
                              {PLAYBACK_SPEEDS.map((rate) => (
                                <button
                                  key={rate}
                                  onClick={() => changePlaybackRate(rate)}
                                  className={cn(
                                    "block w-full rounded px-3 py-1 text-xs transition-colors hover:bg-white/10 focus:outline-none",
                                    playbackRate === rate ? "font-bold text-primary" : "text-white/70",
                                  )}
                                >
                                  {rate}x
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <button onClick={toggleFullscreen} className="text-white/90 transition-transform hover:scale-110 active:scale-95 focus:outline-none" aria-label="ملء الشاشة">
                          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Floating review button ──── */}
                {!isChromeless && (
                  <button
                    onClick={() => setShowPanel(true)}
                    className={cn("absolute end-2 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-0.5 rounded-full bg-black/40 p-2.5 backdrop-blur-md transition-all hover:bg-black/60 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95", uiVisible ? "ui-visible" : "ui-hidden")}
                    aria-label={`المراجعة (${comments.length} تعليقات)`}
                  >
                    <MessageSquare className="h-5 w-5 text-white" />
                    {comments.length > 0 && (
                      <span className="text-[9px] font-bold text-white">{comments.length}</span>
                    )}
                  </button>
                )}

                {/* ── Floating action buttons ───── */}
                {!isChromeless && (
                  <div className={cn("absolute bottom-20 start-2 z-20 flex flex-col gap-1.5 transition-all duration-300", uiVisible ? "ui-visible" : "ui-hidden")}>
                    {canApprove && (
                      <>
                        <button
                          onClick={handleApprove}
                          disabled={approving || approved}
                          className={cn(
                            "flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium shadow-lg backdrop-blur-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 active:scale-95 hover:scale-105",
                            approved
                              ? "bg-green-600 text-white"
                              : "bg-green-600/80 text-white hover:bg-green-600",
                          )}
                          aria-label={approved ? "معتمد" : "اعتماد"}
                        >
                          {approving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          <span className="hidden sm:inline">{approved ? "معتمد" : "اعتماد"}</span>
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
                    {canDownload && (
                      <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-xs font-medium text-white shadow-lg backdrop-blur-md transition-all hover:bg-white/20 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 active:scale-95"
                        aria-label="تحميل"
                      >
                        {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                        <span className="hidden sm:inline">تحميل</span>
                      </button>
                    )}
                    {isPreviewVideo && !canDownload && (
                      <div className="flex items-center gap-1 rounded-full bg-black/30 px-2.5 py-1.5 text-[10px] text-white/40 backdrop-blur-sm">
                        <Lock className="h-3 w-3" />
                        <span className="hidden sm:inline">معاينة</span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Comment form popover ─────── */}
                {!screenshotMode && showCommentForm && (
                  <div className="absolute bottom-20 left-1/2 z-30 w-72 max-w-[85%] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#1a1a1b]/95 p-3 shadow-2xl backdrop-blur-xl animate-fade-in">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="flex items-center gap-1.5 text-xs font-medium">
                        <Clock className="h-3 w-3 text-primary" />
                        تعليق عند {formatDuration(Math.floor(currentTime))}
                      </p>
                      <button onClick={() => setShowCommentForm(false)} className="text-white/40 transition-colors hover:text-white focus:outline-none" aria-label="إغلاق">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <CommentInputForm
                      draft={draft}
                      onDraftChange={updateDraft}
                      onSubmit={handleAddComment}
                      onCancel={() => setShowCommentForm(false)}
                    />
                  </div>
                )}

                {/* ── Marker hover tooltip ─────── */}
                {hoveredMarker && (
                  <div className="absolute bottom-24 left-1/2 z-20 max-w-[220px] -translate-x-1/2 rounded-lg border border-white/10 bg-[#1a1a1b]/95 p-2 shadow-xl backdrop-blur-md animate-fade-in">
                    <p className="text-xs font-medium">{hoveredMarker.authorName}</p>
                    <p className="text-[10px] text-white/50">{formatDuration(hoveredMarker.timestampSeconds)}</p>
                    <p className="mt-1 text-xs text-white/80 line-clamp-2">{hoveredMarker.message}</p>
                  </div>
                )}
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

        {/* ── Desktop: Slide-over review panel ── */}
        {!screenshotMode && !presentationMode && showPanel && (
          <>
            <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowPanel(false)} />
            <div className="absolute end-0 top-0 z-40 flex h-full w-full max-w-md flex-col border-l border-white/8 bg-[#0c0c0e] shadow-2xl sm:w-96 animate-fade-in">
              <ReviewPanel
                comments={filteredComments}
                loading={loadingComments}
                commentSearch={commentSearch}
                setCommentSearch={setCommentSearch}
                commentFilter={commentFilter}
                setCommentFilter={setCommentFilter}
                onSeek={seekTo}
                isTeam={isTeam}
                onClose={() => setShowPanel(false)}
                onAddComment={() => {
                  const video = videoRef.current;
                  if (video) video.pause();
                  setShowCommentForm(true);
                  setShowPanel(false);
                }}
                currentTime={currentTime}
              />
            </div>
          </>
        )}
      </div>

      {/* ── Desktop: Timeline under phone ── */}
      {!screenshotMode && !presentationMode && (
        <div className={cn("mt-4 hidden w-full max-w-md shrink-0 px-6 sm:block transition-all duration-300", uiVisible ? "ui-visible" : "ui-hidden")}>
          <TimelineBar
            progress={progress}
            duration={duration}
            markers={markers}
            currentTime={currentTime}
            onSeek={handleSeekBar}
            onMarkerHover={setHoveredMarker}
            onMarkerClick={seekTo}
          />
        </div>
      )}

      {/* ── Video selector ─────────────────────── */}
      {!screenshotMode && videos.length > 1 && (
        <div className={cn("shrink-0 border-t border-white/8 bg-[#0c0c0e] px-3 py-2 transition-all duration-300", uiVisible && !presentationMode ? "ui-visible" : "ui-hidden")}>
          <div className="flex gap-2 overflow-x-auto">
            {videos.map((video, idx) => (
              <button
                key={video.id}
                onClick={() => {
                  if (idx === selectedVideoIdx) return;
                  setLoadingComments(true);
                  setSwipeDir(idx > selectedVideoIdx ? "up" : "down");
                  setSelectedVideoIdx(idx);
                }}
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

      {/* ── Screenshot / Presentation exit button ── */}
      {isChromeless && (
        <button
          onClick={() => {
            setScreenshotMode(false);
            setPresentationMode(false);
          }}
          className="fixed end-4 top-4 z-50 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-all hover:bg-black/80 active:scale-95"
        >
          <X className="h-3.5 w-3.5" />
          خروج
        </button>
      )}

      {/* Revision dialog */}
      {!screenshotMode && (
        <RevisionDialog
          open={showRevision}
          onOpenChange={setShowRevision}
          projectId={projectId}
          projectToken={projectToken}
          onSuccess={() => {
            setWorkflowStatus("REVISION");
            setShowRevision(false);
          }}
        />
      )}
    </div>
  );
}

/* ── Timeline bar (desktop under phone) ──── */

function TimelineBar({
  progress,
  duration,
  markers,
  currentTime,
  onSeek,
  onMarkerHover,
  onMarkerClick,
}: {
  progress: number;
  duration: number;
  markers: TimelineMarker[];
  currentTime: number;
  onSeek: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMarkerHover: (marker: TimelineMarker | null) => void;
  onMarkerClick: (seconds: number) => void;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/5 p-3">
      <div className="relative h-2 cursor-pointer rounded-full bg-white/10" onClick={onSeek}>
        <div className="absolute h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
        {duration > 0 && markers.map((marker) => {
          const left = (marker.timestampSeconds / duration) * 100;
          return (
            <div
              key={marker.id}
              className="absolute top-1/2 h-3.5 w-0.5 -translate-y-1/2 cursor-pointer rounded-full bg-amber-400 transition-transform hover:scale-x-150"
              style={{ left: `${left}%` }}
              onMouseEnter={() => onMarkerHover(marker)}
              onMouseLeave={() => onMarkerHover(null)}
              onClick={(e) => {
                e.stopPropagation();
                onMarkerClick(marker.timestampSeconds);
              }}
            />
          );
        })}
        <div className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md transition-transform hover:scale-125" style={{ left: `${progress}%` }} />
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-[10px] text-white/40 font-mono" dir="ltr">{formatDuration(currentTime)}</span>
        <span className="text-[10px] text-white/40 font-mono" dir="ltr">{formatDuration(duration)}</span>
      </div>
    </div>
  );
}

/* ── Review panel (slide-over / bottom sheet) ── */

function ReviewPanel({
  comments,
  loading,
  commentSearch,
  setCommentSearch,
  commentFilter,
  setCommentFilter,
  onSeek,
  isTeam,
  onClose,
  onAddComment,
  currentTime,
}: {
  comments: CommentItemType[];
  loading: boolean;
  commentSearch: string;
  setCommentSearch: (v: string) => void;
  commentFilter: string;
  setCommentFilter: (v: string) => void;
  onSeek: (s: number) => void;
  isTeam: boolean;
  onClose: () => void;
  onAddComment: () => void;
  currentTime: number;
}) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquare className="h-4 w-4" />
          المراجعة ({comments.length})
        </h3>
        <button onClick={onClose} className="text-white/40 transition-colors hover:text-white focus:outline-none" aria-label="إغلاق">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Search + filter */}
      <div className="space-y-2 border-b border-white/8 p-3">
        <input
          type="search"
          placeholder="بحث في التعليقات..."
          value={commentSearch}
          onChange={(e) => setCommentSearch(e.target.value)}
          className="h-8 w-full rounded-md border border-white/10 bg-transparent px-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="بحث في التعليقات"
        />
        <div className="flex items-center gap-1" role="tablist" aria-label="تصفية التعليقات">
          {[
            { value: "all", label: "الكل" },
            { value: "open", label: "مفتوح" },
            { value: "resolved", label: "محلول" },
          ].map((opt) => (
            <button
              key={opt.value}
              role="tab"
              aria-selected={commentFilter === opt.value}
              onClick={() => setCommentFilter(opt.value)}
              className={cn(
                "rounded-md px-2 py-1 text-xs transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary",
                commentFilter === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-white/40 hover:bg-white/5 hover:text-white/70",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg bg-white/5" />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <EmptyStateIllustration
            type="no-comments"
            title="لا توجد تعليقات"
            subtitle="اضغط على الفيديو لإضافة تعليق"
          />
        ) : (
          <div className="space-y-2">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                deliveryId=""
                onSeek={onSeek}
                isTeam={isTeam}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add comment button */}
      <div className="border-t border-white/8 p-3">
        <Button className="w-full" size="sm" onClick={onAddComment}>
          <MessageSquare className="h-4 w-4" />
          إضافة تعليق عند {formatDuration(Math.floor(currentTime))}
        </Button>
      </div>
    </>
  );
}

/* ── Inline comment input with draft ─────── */

function CommentInputForm({
  draft,
  onDraftChange,
  onSubmit,
  onCancel,
}: {
  draft: string;
  onDraftChange: (text: string) => void;
  onSubmit: (name: string, email: string, message: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(draft);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(name || "مراجع", email || "reviewer@pixelhub.local", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input
          placeholder="الاسم"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8 rounded-md border border-white/10 bg-transparent px-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          type="email"
          placeholder="البريد"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-8 rounded-md border border-white/10 bg-transparent px-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <textarea
        placeholder="اكتب تعليقك..."
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          onDraftChange(e.target.value);
        }}
        rows={3}
        className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-white/30">✓ حفظ تلقائي</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-2 py-1 text-xs text-white/50 transition-colors hover:text-white focus:outline-none"
          >
            إغلاق
          </button>
          <button
            type="submit"
            disabled={submitting || !message.trim()}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            إرسال
          </button>
        </div>
      </div>
    </form>
  );
}
