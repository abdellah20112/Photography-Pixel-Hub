"use client";

import { useEffect, useCallback } from "react";

/* ============================================
   useReviewKeyboard — Keyboard shortcuts
   Space → Play/Pause
   ←/→ → Seek -5s/+5s
   M → Mute toggle
   F → Fullscreen toggle
   C → Add comment at current time
   Esc → Close overlays
   ============================================ */

type KeyboardHandlers = {
  onTogglePlay?: () => void;
  onSeek?: (delta: number) => void;
  onToggleMute?: () => void;
  onToggleFullscreen?: () => void;
  onAddComment?: () => void;
  onClose?: () => void;
  onToggleScreenshot?: () => void;
  onTogglePresentation?: () => void;
};

export function useReviewKeyboard(handlers: KeyboardHandlers, enabled = true) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't interfere with text inputs
      const target = e.target as HTMLElement;
      const tag = target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || target.isContentEditable) return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          handlers.onTogglePlay?.();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handlers.onSeek?.(-5);
          break;
        case "ArrowRight":
          e.preventDefault();
          handlers.onSeek?.(5);
          break;
        case "m":
          e.preventDefault();
          handlers.onToggleMute?.();
          break;
        case "f":
          e.preventDefault();
          handlers.onToggleFullscreen?.();
          break;
        case "c":
          e.preventDefault();
          handlers.onAddComment?.();
          break;
        case "s":
          e.preventDefault();
          handlers.onToggleScreenshot?.();
          break;
        case "p":
          e.preventDefault();
          handlers.onTogglePresentation?.();
          break;
        case "Escape":
          handlers.onClose?.();
          break;
      }
    },
    [enabled, handlers],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
