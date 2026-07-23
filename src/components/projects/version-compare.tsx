"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Link2,
  Link2Off,
  Maximize,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { formatDuration } from "@/lib/video/metadata";
import type { VideoVersion } from "@/actions/projects/get-version-history";

/* ============================================
   VersionCompare — Side-by-side video compare
   Synced playback, frame stepping, fullscreen.
   ============================================ */

type VersionCompareProps = {
  versionA: VideoVersion;
  versionB: VideoVersion;
  versions: VideoVersion[];
  onClose: () => void;
  onSelectA: (v: VideoVersion) => void;
  onSelectB: (v: VideoVersion) => void;
};

export function VersionCompare({
  versionA,
  versionB,
  versions,
  onClose,
  onSelectA,
  onSelectB,
}: VersionCompareProps) {
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [synced, setSynced] = useState(true);

  // Sync playback
  const handlePlayPause = useCallback(() => {
    const a = videoARef.current;
    const b = videoBRef.current;
    if (!a || !b) return;

    if (a.paused) {
      a.play();
      b.play();
      setIsPlaying(true);
    } else {
      a.pause();
      b.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleStep = useCallback(
    (delta: number) => {
      const a = videoARef.current;
      const b = videoBRef.current;
      if (!a || !b) return;
      const newTime = Math.max(0, Math.min(a.duration || 0, a.currentTime + delta));
      a.currentTime = newTime;
      if (synced) b.currentTime = newTime;
      setCurrentTime(newTime);
    },
    [synced],
  );

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const a = videoARef.current;
      const b = videoBRef.current;
      if (!a || !b || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = percent * duration;
      a.currentTime = newTime;
      if (synced) b.currentTime = newTime;
      setCurrentTime(newTime);
    },
    [duration, synced],
  );

  // Track time
  useEffect(() => {
    const a = videoARef.current;
    if (!a) return;
    const onTimeUpdate = () => setCurrentTime(a.currentTime);
    const onLoadedMetadata = () => setDuration(a.duration);
    a.addEventListener("timeupdate", onTimeUpdate);
    a.addEventListener("loadedmetadata", onLoadedMetadata);
    return () => {
      a.removeEventListener("timeupdate", onTimeUpdate);
      a.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#08080a] text-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          مقارنة الإصدارات
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn("gap-1.5", synced && "text-primary")}
            onClick={() => setSynced(!synced)}
          >
            {synced ? <Link2 className="h-4 w-4" /> : <Link2Off className="h-4 w-4" />}
            {synced ? "متزامن" : "غير متزامن"}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="إغلاق">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Side-by-side videos */}
      <div className="flex flex-1 overflow-hidden">
        {/* Version A */}
        <div className="flex flex-1 flex-col border-l border-white/8">
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-2">
            <select
              value={versionA.id}
              onChange={(e) => {
                const v = versions.find((vv) => vv.id === e.target.value);
                if (v) onSelectA(v);
              }}
              className="rounded-md border border-white/10 bg-transparent px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id} className="bg-[#1a1a1b]">
                  V{v.version} — {v.title}
                </option>
              ))}
            </select>
            <span className="text-xs font-bold text-primary">V{versionA.version}</span>
          </div>
          <div className="flex flex-1 items-center justify-center bg-black p-4">
            {versionA.streamUrl ? (
              <video
                ref={videoARef}
                src={versionA.streamUrl}
                poster={versionA.thumbnailUrl ?? undefined}
                className="max-h-full max-w-full object-contain"
                playsInline
              />
            ) : (
              <p className="text-sm text-white/30">لا تتوفر معاينة</p>
            )}
          </div>
        </div>

        {/* Version B */}
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-2">
            <select
              value={versionB.id}
              onChange={(e) => {
                const v = versions.find((vv) => vv.id === e.target.value);
                if (v) onSelectB(v);
              }}
              className="rounded-md border border-white/10 bg-transparent px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id} className="bg-[#1a1a1b]">
                  V{v.version} — {v.title}
                </option>
              ))}
            </select>
            <span className="text-xs font-bold text-green-500">V{versionB.version}</span>
          </div>
          <div className="flex flex-1 items-center justify-center bg-black p-4">
            {versionB.streamUrl ? (
              <video
                ref={videoBRef}
                src={versionB.streamUrl}
                poster={versionB.thumbnailUrl ?? undefined}
                className="max-h-full max-w-full object-contain"
                playsInline
              />
            ) : (
              <p className="text-sm text-white/30">لا تتوفر معاينة</p>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="shrink-0 border-t border-white/8 bg-[#0c0c0e] px-4 py-3">
        {/* Seek bar */}
        <div
          className="mb-3 h-1.5 cursor-pointer rounded-full bg-white/20"
          onClick={handleSeek}
          role="slider"
          aria-label="الانتقال"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
        >
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => handleStep(-1)} aria-label="خطوة للخلف">
            <SkipBack className="h-5 w-5" />
          </Button>
          <Button variant="default" size="icon" onClick={handlePlayPause} aria-label="تشغيل/إيقاف">
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" fill="white" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleStep(1)} aria-label="خطوة للأمام">
            <SkipForward className="h-5 w-5" />
          </Button>
          <span className="ms-4 font-mono text-xs text-white/60" dir="ltr">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
