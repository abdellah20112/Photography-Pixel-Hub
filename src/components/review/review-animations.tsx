"use client";

import { Heart, Film, Camera, MessageSquare, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ============================================
   Review Animations & Visual States
   DoubleTapHeart, LoadingSkeletons, EmptyStateIllustrations
   ============================================ */

/* ── Double Tap Heart ────────────────────── */

export function DoubleTapHeart({
  x,
  y,
  animationKey,
}: {
  x: number;
  y: number;
  animationKey: number;
}) {
  return (
    <div
      key={animationKey}
      className="pointer-events-none absolute z-50"
      style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
    >
      <Heart
        className="h-24 w-24 fill-red-500 text-red-500 animate-heart-burst drop-shadow-2xl"
        style={{ filter: "drop-shadow(0 4px 12px rgba(239,68,68,0.4))" }}
      />
    </div>
  );
}

/* ── Loading Skeletons ──────────────────── */

export function PhoneSkeleton() {
  return (
    <div
      className="relative h-full overflow-hidden rounded-[2.75rem] border-[3px] border-[#2a2a2e]"
      style={{ aspectRatio: "9 / 16", maxWidth: "100%" }}
    >
      <div className="h-full w-full animate-shimmer rounded-[2.5rem]" />

      {/* Skeleton Dynamic Island */}
      <div className="absolute left-1/2 top-3 h-6 w-24 -translate-x-1/2 rounded-full bg-white/5" />

      {/* Skeleton status bar */}
      <div className="absolute left-4 top-2 h-3 w-10 rounded bg-white/5" />
      <div className="absolute right-4 top-2 h-3 w-16 rounded bg-white/5" />

      {/* Skeleton social actions */}
      <div className="absolute bottom-28 end-3 flex flex-col gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-9 w-9 rounded-full bg-white/5" />
        ))}
      </div>

      {/* Skeleton caption */}
      <div className="absolute bottom-14 start-3 end-16 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-white/5" />
          <div className="h-3 w-20 rounded bg-white/5" />
        </div>
        <div className="h-2 w-full rounded bg-white/5" />
        <div className="h-2 w-2/3 rounded bg-white/5" />
      </div>

      {/* Skeleton bottom controls */}
      <div className="absolute bottom-2 left-3 right-3 h-1 rounded-full bg-white/5" />
    </div>
  );
}

/* ── Empty State Illustrations ──────────── */

export function EmptyStateIllustration({
  type,
  title,
  subtitle,
}: {
  type: "no-videos" | "video-error" | "no-comments";
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex animate-fade-in flex-col items-center justify-center gap-3 py-8 text-center">
      <div className="animate-float">
        {type === "no-videos" && <NoVideosIllustration />}
        {type === "video-error" && <VideoErrorIllustration />}
        {type === "no-comments" && <NoCommentsIllustration />}
      </div>
      <div>
        <p className="text-sm font-medium text-white/60">{title}</p>
        <p className="mt-0.5 text-xs text-white/30">{subtitle}</p>
      </div>
    </div>
  );
}

function NoVideosIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="text-white/15">
      {/* Film strip */}
      <rect x="20" y="14" width="40" height="52" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="40" cy="36" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="40" cy="36" r="4" fill="currentColor" />
      {/* Film holes */}
      <rect x="24" y="18" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.5" />
      <rect x="24" y="26" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.5" />
      <rect x="53" y="18" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.5" />
      <rect x="53" y="26" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.5" />
      {/* Sparkle */}
      <path d="M56 12 L57 9 L58 12 L61 13 L58 14 L57 17 L56 14 L53 13 Z" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

function VideoErrorIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="text-white/15">
      <rect x="16" y="18" width="48" height="44" rx="6" stroke="currentColor" strokeWidth="2" fill="none" />
      {/* Broken film icon */}
      <path d="M28 32 L52 48 M52 32 L28 48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Warning triangle */}
      <path
        d="M40 54 L44 60 L36 60 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <line x1="40" y1="56" x2="40" y2="58" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="40" cy="59" r="0.5" fill="currentColor" />
    </svg>
  );
}

function NoCommentsIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="text-white/15">
      {/* Chat bubble */}
      <path
        d="M20 24 Q20 18 26 18 L54 18 Q60 18 60 24 L60 40 Q60 46 54 46 L38 46 L30 54 L30 46 L26 46 Q20 46 20 40 Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      {/* Dots */}
      <circle cx="32" cy="32" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="40" cy="32" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="48" cy="32" r="2" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
