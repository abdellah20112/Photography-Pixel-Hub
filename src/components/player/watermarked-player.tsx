"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { BRANDING } from "@/config/branding";

/* ============================================
   WatermarkedPlayer — Anti-download preview
   Streams video with animated watermark overlay.
   Prevents: download, context menu, PiP, direct source access.
   ============================================ */

type WatermarkedPlayerProps = {
  src: string;
  poster?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
};

type WatermarkPosition = {
  x: number;
  y: number;
};

/** Calculate a new random position within the video bounds (as percentages). */
function randomPosition(): WatermarkPosition {
  const padding = 10;
  const x = padding + Math.random() * (100 - padding * 2 - 30);
  const y = padding + Math.random() * (100 - padding * 2 - 10);
  return { x, y };
}

export function WatermarkedPlayer({ src, poster, onTimeUpdate }: WatermarkedPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [watermarkPos, setWatermarkPos] = useState<WatermarkPosition>({ x: 15, y: 20 });
  const watermarkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animate watermark position every 3-4 seconds
  useEffect(() => {
    watermarkTimerRef.current = setInterval(() => {
      setWatermarkPos(randomPosition());
    }, 3500);

    return () => {
      if (watermarkTimerRef.current) clearInterval(watermarkTimerRef.current);
    };
  }, []);

  // Prevent context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    video.currentTime = percent * duration;
  }, [duration]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const vol = parseFloat(e.target.value);
    video.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  }, []);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg bg-black"
      onContextMenu={handleContextMenu}
    >
      {/* Video element — no download attributes */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full"
        playsInline
        controlsList="nodownload noplaybackrate nopictureinpicture"
        disablePictureInPicture
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(e) => {
          const video = e.currentTarget;
          setCurrentTime(video.currentTime);
          onTimeUpdate?.(video.currentTime, video.duration);
        }}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          setVolume(e.currentTarget.volume);
        }}
        onVolumeChange={(e) => {
          setVolume(e.currentTarget.volume);
          setIsMuted(e.currentTarget.muted);
        }}
      />

      {/* Animated watermark overlay */}
      <div
        className="pointer-events-none absolute z-10 select-none transition-all duration-[3000ms] ease-in-out"
        style={{
          left: `${watermarkPos.x}%`,
          top: `${watermarkPos.y}%`,
          opacity: 0.12,
        }}
      >
        <div className="rotate-[-20deg] text-center">
          <p className="text-lg font-bold text-white whitespace-nowrap" style={{ textShadow: "0 0 4px rgba(0,0,0,0.5)" }}>
            {BRANDING.companyName}
          </p>
          <p className="text-[10px] text-white/80" style={{ textShadow: "0 0 4px rgba(0,0,0,0.5)" }}>
            PREVIEW — DO NOT DISTRIBUTE
          </p>
        </div>
      </div>

      {/* Custom controls bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8">
        {/* Seek bar */}
        <div
          className="mb-2 h-1.5 w-full cursor-pointer rounded-full bg-white/30"
          onClick={handleSeek}
        >
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="text-white transition-opacity hover:opacity-80"
            aria-label={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
          >
            {isPlaying ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>

          {/* Mute */}
          <button
            onClick={toggleMute}
            className="text-white transition-opacity hover:opacity-80"
            aria-label={isMuted ? "إلغاء الكتم" : "كتم الصوت"}
          >
            {isMuted || volume === 0 ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.17v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
            )}
          </button>

          {/* Volume slider */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="h-1 w-16 cursor-pointer appearance-none rounded-full bg-white/30"
            aria-label="مستوى الصوت"
          />

          {/* Time */}
          <span className="text-xs text-white/90 font-mono" dir="ltr">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          {/* Branding badge */}
          <span className="text-[10px] text-white/50">{BRANDING.shortName}</span>
        </div>
      </div>
    </div>
  );
}
