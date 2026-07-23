"use client";

import { useState, useEffect } from "react";
import { Wifi } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ============================================
   PhoneFrame — Premium iPhone-style mockup
   Titanium border, Dynamic Island, speaker,
   gesture bar, glass reflections, multi-layer shadows.
   ============================================ */

type PhoneFrameProps = {
  children: React.ReactNode;
  className?: string;
};

export function PhoneFrame({ children, className }: PhoneFrameProps) {
  return (
    <div
      className={cn("relative h-full", className)}
      style={{
        borderRadius: "2.75rem",
        padding: "3px",
        background:
          "linear-gradient(135deg, #3a3a3e 0%, #2a2a2e 30%, #4a4a4e 50%, #2a2a2e 70%, #3a3a3e 100%)",
        boxShadow: [
          "0 0 0 1px rgba(255,255,255,0.06)",
          "0 8px 40px rgba(0,0,0,0.6)",
          "0 2px 8px rgba(0,0,0,0.3)",
          "inset 0 0 2px rgba(255,255,255,0.1)",
        ].join(", "),
      }}
    >
      {/* Inner screen */}
      <div
        className="relative h-full w-full overflow-hidden bg-black sm:rounded-[calc(2.75rem-3px)]"
        style={{ borderRadius: "calc(2.75rem - 3px)" }}
      >
        {children}

        {/* Dynamic Island */}
        <div className="absolute left-1/2 top-2 z-40 -translate-x-1/2 sm:top-2.5">
          <div className="relative h-6 w-24 rounded-full bg-black sm:h-7 sm:w-28">
            {/* Speaker grill */}
            <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-0.5 w-0.5 rounded-full bg-white/15" />
              ))}
            </div>
            {/* Subtle inner glow */}
            <div
              className="absolute inset-0 rounded-full"
              style={{ boxShadow: "inset 0 0 4px rgba(255,255,255,0.05)" }}
            />
          </div>
        </div>

        {/* Glass reflection overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-30"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 20%, transparent 80%, rgba(255,255,255,0.03) 100%)",
          }}
        />

        {/* Gesture bar (home indicator) */}
        <div className="absolute bottom-1.5 left-1/2 z-40 h-1 w-28 -translate-x-1/2 rounded-full bg-white/30 sm:w-32" />
      </div>
    </div>
  );
}

/* ============================================
   StatusBar — Phone status bar
   Live time, signal bars, WiFi/5G, battery.
   Sits at the top of the phone screen.
   ============================================ */

type StatusBarProps = {
  className?: string;
};

export function StatusBar({ className }: StatusBarProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes().toString().padStart(2, "0");
      setTime(`${h}:${m}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={cn(
        "absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-5 pt-1.5 text-white",
        className,
      )}
    >
      {/* Time — left */}
      <span className="text-[11px] font-semibold tracking-tight tabular-nums sm:text-xs">
        {time}
      </span>

      {/* Signal + WiFi + Battery — right */}
      <div className="flex items-center gap-1.5">
        {/* Signal bars */}
        <svg width="16" height="10" viewBox="0 0 16 10" fill="none" className="text-white">
          <rect x="0" y="6" width="3" height="4" rx="0.5" fill="currentColor" />
          <rect x="4" y="4" width="3" height="6" rx="0.5" fill="currentColor" />
          <rect x="8" y="2" width="3" height="8" rx="0.5" fill="currentColor" />
          <rect x="12" y="0" width="3" height="10" rx="0.5" fill="currentColor" />
        </svg>

        {/* WiFi */}
        <Wifi className="h-3 w-3 text-white" />

        {/* Battery */}
        <div className="flex items-center gap-0.5">
          <div className="relative h-3 w-6 rounded-[3px] border border-white/60 p-0.5">
            <div className="h-full w-[80%] rounded-[1px] bg-white" />
          </div>
          <div className="h-1 w-0.5 rounded-r bg-white/60" />
        </div>
      </div>
    </div>
  );
}
