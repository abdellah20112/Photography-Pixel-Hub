"use client";

/* ============================================
   SafeZoneOverlay — Professional safe zones
   Soft translucent overlays instead of dashed borders.
   Red   = Platform UI area
   Yellow = Danger area
   Green  = Safe area
   ============================================ */

export type SocialMode = "instagram" | "tiktok" | "youtube" | "facebook" | "none";

const ZONES: Record<SocialMode, { top: number; bottom: number; sides: number }> = {
  none: { top: 0, bottom: 0, sides: 0 },
  instagram: { top: 10, bottom: 28, sides: 12 },
  tiktok: { top: 6, bottom: 30, sides: 14 },
  youtube: { top: 7, bottom: 25, sides: 8 },
  facebook: { top: 8, bottom: 27, sides: 12 },
};

export function SafeZoneOverlay({ mode }: { mode: SocialMode }) {
  if (mode === "none") return null;

  const z = ZONES[mode];
  const dangerTop = z.top;
  const dangerBottom = z.bottom;
  const dangerSides = z.sides;
  const yellowInset = 2;

  return (
    <div className="pointer-events-none absolute inset-0 z-[15]">
      {/* Red zones — platform UI */}
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: `${dangerTop}%`,
          background: "linear-gradient(to bottom, rgba(239,68,68,0.14), rgba(239,68,68,0.06))",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: `${dangerBottom}%`,
          background: "linear-gradient(to top, rgba(239,68,68,0.14), rgba(239,68,68,0.06))",
        }}
      />
      <div
        className="absolute inset-y-0 start-0"
        style={{
          width: `${dangerSides}%`,
          background: "linear-gradient(to right, rgba(239,68,68,0.12), rgba(239,68,68,0.04))",
        }}
      />
      <div
        className="absolute inset-y-0 end-0"
        style={{
          width: `${dangerSides}%`,
          background: "linear-gradient(to left, rgba(239,68,68,0.12), rgba(239,68,68,0.04))",
        }}
      />

      {/* Yellow zones — danger area (slightly inset from red) */}
      <div
        className="absolute"
        style={{
          top: `${dangerTop}%`,
          bottom: `${dangerBottom}%`,
          left: `${dangerSides}%`,
          right: `${dangerSides}%`,
          background: `rgba(245,158,11,0.06)`,
        }}
      />
      <div
        className="absolute"
        style={{
          top: `${dangerTop + yellowInset}%`,
          bottom: `${dangerBottom + yellowInset}%`,
          left: `${dangerSides + yellowInset}%`,
          right: `${dangerSides + yellowInset}%`,
          background: `rgba(245,158,11,0.04)`,
        }}
      />

      {/* Green zone — safe area */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-green-500/10 px-2 py-0.5"
        style={{
          border: "1px solid rgba(34,197,94,0.2)",
        }}
      >
        <span className="text-[8px] font-medium text-green-400">Safe Area</span>
      </div>
    </div>
  );
}
