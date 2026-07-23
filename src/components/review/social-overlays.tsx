"use client";

import { useState, useRef, useEffect } from "react";
import {
  Heart,
  MessageSquare,
  Share2,
  MoreHorizontal,
  Music2,
  Home,
  Search,
  PlusSquare,
  Film,
  User,
  Smile,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { SocialMode } from "@/components/review/safe-zones-overlay";

export type { SocialMode };

/* ============================================
   Social Platform Overlays
   Each overlay renders the platform-specific UI
   on top of the phone screen:
   - Right-side action bar (like, comment, share)
   - Bottom caption area (username, text, music)
   - Bottom navigation (platform-specific)
   ============================================ */

/* ── Animated Caption ────────────────────── */

export function AnimatedCaption({
  username,
  text,
  hashtags,
}: {
  username?: string;
  text: string;
  hashtags: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [text, hashtags]);

  return (
    <div className="space-y-1">
      {username && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white">{username}</span>
        </div>
      )}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          expanded ? "max-h-40" : "max-h-10",
        )}
      >
        <p ref={textRef} className="text-xs leading-relaxed text-white/90">
          {text} <span className="text-white/60">{hashtags}</span>
        </p>
      </div>
      {overflows && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-[10px] font-medium text-white/50 transition-colors hover:text-white/80"
        >
          {expanded ? "...less" : "...more"}
        </button>
      )}
    </div>
  );
}

/* ── Music Marquee ──────────────────────── */

export function MusicMarquee({
  text,
  icon: Icon = Music2,
}: {
  text: string;
  icon?: typeof Music2;
}) {
  return (
    <div className="flex items-center gap-1.5 overflow-hidden">
      <Icon className="h-3 w-3 shrink-0 text-white/70" />
      <div className="relative flex-1 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee">
          <span className="text-[9px] text-white/60">{text}</span>
          <span className="text-[9px] text-white/60">&nbsp;&nbsp;&nbsp;&nbsp;</span>
          <span className="text-[9px] text-white/60">{text}</span>
          <span className="text-[9px] text-white/60">&nbsp;&nbsp;&nbsp;&nbsp;</span>
        </div>
      </div>
    </div>
  );
}

/* ── Shared Social Action Button ────────── */

export function SocialAction({
  icon: Icon,
  label,
  filled = false,
}: {
  icon: typeof Heart;
  label: string;
  filled?: boolean;
}) {
  return (
    <div className="flex cursor-pointer flex-col items-center gap-0.5 transition-transform active:scale-90">
      <div className="flex h-9 w-9 items-center justify-center transition-transform hover:scale-110">
        <Icon className={cn("h-7 w-7 text-white", filled && "fill-white")} />
      </div>
      {label && <span className="text-[9px] text-white">{label}</span>}
    </div>
  );
}

/* ── Instagram Overlay ──────────────────── */

export function InstagramOverlay({
  projectName,
  username,
  commentCount,
}: {
  projectName: string;
  username: string;
  commentCount: number;
}) {
  return (
    <>
      {/* Right action bar */}
      <div className="absolute end-2 bottom-28 z-10 flex flex-col items-center gap-3.5">
        <SocialAction icon={Heart} label="2.3K" />
        <SocialAction icon={MessageSquare} label={String(commentCount || 142)} />
        <SocialAction icon={Share2} label="" />
        <SocialAction icon={MoreHorizontal} label="" />
      </div>

      {/* Bottom caption */}
      <div className="absolute bottom-14 start-0 end-12 z-10 px-3 pb-1">
        <div className="mb-1.5 flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-0.5">
            <div className="h-full w-full rounded-full bg-black" />
          </div>
          <span className="text-xs font-semibold text-white">{username}</span>
          <span className="rounded border border-white/40 px-1.5 py-0.5 text-[9px] text-white">متابعة</span>
        </div>
        <AnimatedCaption
          username=""
          text={projectName}
          hashtags="✨ #reels #trending"
        />
        <div className="mt-1.5">
          <MusicMarquee text={`Original Audio — ${projectName}`} />
        </div>
      </div>

      {/* Bottom nav */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-around border-t border-white/10 bg-black/80 px-2 py-1.5 backdrop-blur-sm">
        <Home className="h-4 w-4 text-white" />
        <Search className="h-4 w-4 text-white/50" />
        <PlusSquare className="h-4 w-4 text-white/50" />
        <Film className="h-4 w-4 text-white/50" />
        <User className="h-4 w-4 text-white/50" />
      </div>
    </>
  );
}

/* ── TikTok Overlay ─────────────────────── */

export function TikTokOverlay({
  projectName,
  username,
  commentCount,
}: {
  projectName: string;
  username: string;
  commentCount: number;
}) {
  return (
    <>
      <div className="absolute end-2 bottom-28 z-10 flex flex-col items-center gap-3.5">
        {/* Avatar + Follow */}
        <div className="relative">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-cyan-400 to-pink-500 p-0.5">
            <div className="h-full w-full rounded-full bg-black" />
          </div>
          <div className="absolute -bottom-1.5 left-1/2 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full bg-[#fe2c55]">
            <span className="text-[12px] font-bold leading-none text-white">+</span>
          </div>
        </div>
        <SocialAction icon={Heart} label="12.5K" filled />
        <SocialAction icon={MessageSquare} label={String(commentCount || 342)} filled />
        <SocialAction icon={Share2} label="856" filled />
        {/* Music disc */}
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 bg-gradient-to-br from-gray-700 to-gray-900"
          style={{ animationDuration: "4s" }}
        >
          <div className="m-auto mt-1.5 h-2.5 w-2.5 rounded-full bg-white/30" />
        </div>
      </div>

      <div className="absolute bottom-14 start-0 end-12 z-10 px-3 pb-1">
        <p className="text-sm font-bold text-white">@{username}</p>
        <div className="mt-0.5">
          <AnimatedCaption username="" text={projectName} hashtags="🎬 #fyp #viral" />
        </div>
        <div className="mt-1.5">
          <MusicMarquee text={`Original Audio — ${projectName}`} />
        </div>
      </div>
    </>
  );
}

/* ── YouTube Shorts Overlay ─────────────── */

export function YouTubeOverlay({
  projectName,
  username,
}: {
  projectName: string;
  username: string;
}) {
  return (
    <>
      <div className="absolute end-2 bottom-28 z-10 flex flex-col items-center gap-3">
        <SocialAction icon={Heart} label="1.2K" />
        <SocialAction icon={MessageSquare} label="89" />
        <SocialAction icon={Share2} label="" />
      </div>
      <div className="absolute bottom-14 start-0 end-12 z-10 px-3 pb-1">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-red-600" />
          <span className="text-xs text-white">@{username}</span>
        </div>
        <div className="mt-1">
          <AnimatedCaption username="" text={projectName} hashtags="#shorts" />
        </div>
        <div className="mt-1.5">
          <MusicMarquee text={`Original Audio — ${projectName}`} />
        </div>
      </div>
    </>
  );
}

/* ── Facebook Overlay ────────────────────── */

export function FacebookOverlay({
  projectName,
  username,
}: {
  projectName: string;
  username: string;
}) {
  return (
    <>
      <div className="absolute end-2 bottom-28 z-10 flex flex-col items-center gap-3">
        <SocialAction icon={Heart} label="5.6K" filled />
        <SocialAction icon={MessageSquare} label="234" filled />
        <SocialAction icon={Share2} label="" filled />
      </div>
      <div className="absolute bottom-14 start-0 end-12 z-10 px-3 pb-1">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-blue-600" />
          <span className="text-xs text-white">{username}</span>
        </div>
        <div className="mt-1">
          <AnimatedCaption username="" text={projectName} hashtags="🎬 #reels" />
        </div>
        <div className="mt-1.5">
          <MusicMarquee text="Original Audio" icon={Smile} />
        </div>
      </div>
    </>
  );
}
