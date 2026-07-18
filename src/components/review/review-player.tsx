"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { MessageSquare, X, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/player/video-player";
import { CommentsPanel } from "@/components/review/comments-panel";
import { CommentForm } from "@/components/review/comment-form";
import { getCommentsAction } from "@/actions/reviews/get-comments";
import { approveVideoAction } from "@/actions/reviews/approve-video";
import { formatDuration } from "@/lib/video/metadata";
import type { TimelineMarker } from "@/types/review";

/* ============================================
   ReviewPlayer — VideoPlayer + Review System
   Wraps existing VideoPlayer without rewriting it.
   Adds timeline markers, comments panel, approval.
   ============================================ */

type ReviewPlayerProps = {
  src: string;
  title?: string;
  poster?: string;
  onClose?: () => void;
  autoPlay?: boolean;
  videoId: string;
  deliveryId: string;
  duration?: number;
};

export function ReviewPlayer({
  src,
  title,
  poster,
  onClose,
  autoPlay = false,
  videoId,
  deliveryId,
}: ReviewPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [markers, setMarkers] = useState<TimelineMarker[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);

  // Fetch timeline markers
  useEffect(() => {
    let active = true;
    (async () => {
      const result = await getCommentsAction({ videoId, deliveryId });
      if (!active) return;
      setMarkers(
        result.items.map((c) => ({
          id: c.id,
          commentCode: c.commentCode,
          timestampSeconds: c.timestampSeconds,
          authorName: c.authorName,
          message: c.message,
          status: c.status,
        }))
      );
    })();
    return () => { active = false };
  }, [videoId, deliveryId]);

  // Track current time from the video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onLoadedMetadata = () => setDuration(video.duration);

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, []);

  const handleSeek = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = seconds;
    video.pause();
  }, []);

  const handleVideoClick = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    // Pause and open comment form at current position
    video.pause();
    setCurrentTime(video.currentTime);
    setShowCommentForm(true);
  }, []);

  const handleApprove = async () => {
    setApproving(true);
    try {
      const result = await approveVideoAction({ videoId, deliveryId, deliverySlug: "" });
      if (result.success) {
        setApproved(true);
      }
    } finally {
      setApproving(false);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex bg-black/95">
      {/* Close button */}
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute end-4 top-4 z-10 text-white hover:bg-white/10"
          onClick={onClose}
          aria-label="إغلاق"
        >
          <X className="h-5 w-5" />
        </Button>
      )}

      {/* Title */}
      {title && (
        <div className="absolute start-4 top-4 z-10">
          <p className="text-sm font-medium text-white">{title}</p>
        </div>
      )}

      {/* Video area */}
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="relative w-full max-w-4xl">
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            autoPlay={autoPlay}
            className="w-full rounded-lg"
            controls
          />

          {/* Timeline markers overlay */}
          {duration > 0 && (
            <div className="absolute bottom-[60px] left-0 right-0 h-2 px-4">
              <div className="relative h-full">
                {markers.map((marker) => {
                  const left = (marker.timestampSeconds / duration) * 100;
                  return (
                    <div
                      key={marker.id}
                      className="absolute -top-1 h-4 w-1 cursor-pointer rounded-full bg-amber-400 transition-transform hover:scale-150"
                      style={{ left: `${left}%` }}
                      title={`${formatDuration(marker.timestampSeconds)} — ${marker.authorName}: ${marker.message.slice(0, 50)}`}
                      onClick={() => handleSeek(marker.timestampSeconds)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Comment on click overlay */}
          <button
            className="absolute inset-0 opacity-0"
            onDoubleClick={handleVideoClick}
            aria-label="اضغط مرتين لإضافة تعليق"
          />
        </div>
      </div>

      {/* Comment Form Dialog */}
      {showCommentForm && (
        <div className="absolute bottom-20 left-1/2 z-20 w-96 max-w-[90%] -translate-x-1/2 rounded-lg border bg-popover p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">
              تعليق عند {formatDuration(currentTime)}
            </p>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowCommentForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CommentForm
            videoId={videoId}
            deliveryId={deliveryId}
            timestampSeconds={Math.floor(currentTime)}
            onSubmitted={() => {
              setShowCommentForm(false);
              setShowPanel(true);
              // Refresh markers
              getCommentsAction({ videoId, deliveryId }).then((result) => {
                setMarkers(
                  result.items.map((c) => ({
                    id: c.id,
                    commentCode: c.commentCode,
                    timestampSeconds: c.timestampSeconds,
                    authorName: c.authorName,
                    message: c.message,
                    status: c.status,
                  }))
                );
              });
            }}
          />
        </div>
      )}

      {/* Comments Panel Toggle */}
      <Button
        variant="secondary"
        size="sm"
        className="absolute bottom-4 end-4 z-10"
        onClick={() => setShowPanel((s) => !s)}
      >
        <MessageSquare className="h-4 w-4" />
        التعليقات
        {markers.length > 0 && (
          <span className="ms-1 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
            {markers.length}
          </span>
        )}
      </Button>

      {/* Approve Button */}
      <Button
        variant={approved ? "default" : "outline"}
        size="sm"
        className="absolute bottom-4 start-4 z-10"
        onClick={handleApprove}
        disabled={approving || approved}
      >
        {approving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : approved ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : null}
        {approved ? "معتمد" : "اعتماد الفيديو"}
      </Button>

      {/* Comments Panel */}
      {showPanel && (
        <div className="absolute end-0 top-0 z-20 h-full w-96 max-w-[90%] border-s bg-card">
          <CommentsPanel
            videoId={videoId}
            deliveryId={deliveryId}
            onClose={() => setShowPanel(false)}
            onSeek={handleSeek}
          />
        </div>
      )}
    </div>
  );
}
