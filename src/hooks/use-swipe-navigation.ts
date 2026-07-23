"use client";

import { useRef, useCallback } from "react";

/* ============================================
   useSwipeNavigation — Vertical swipe / wheel
   navigation between videos.
   Swipe up   → next video
   Swipe down → previous video
   Works with touch, mouse wheel, and trackpad.
   ============================================ */

const SWIPE_THRESHOLD = 50;
const WHEEL_COOLDOWN = 400;

type SwipeHandlers = {
  onNext: () => void;
  onPrev: () => void;
  /** When true, swipe is disabled (e.g. comment panel open). */
  disabled?: boolean;
};

export function useSwipeNavigation({ onNext, onPrev, disabled }: SwipeHandlers) {
  const touchStartY = useRef<number | null>(null);
  const wheelLockRef = useRef(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      const touch = e.touches[0];
      if (!touch) return;
      touchStartY.current = touch.clientY;
    },
    [disabled],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || touchStartY.current === null) return;
      const changedTouch = e.changedTouches[0];
      if (!changedTouch) return;
      const deltaY = touchStartY.current - changedTouch.clientY;
      touchStartY.current = null;

      if (Math.abs(deltaY) < SWIPE_THRESHOLD) return;
      if (deltaY > 0) onNext();
      else onPrev();
    },
    [disabled, onNext, onPrev],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (disabled) return;
      if (wheelLockRef.current) return;
      if (Math.abs(e.deltaY) < 10) return;

      wheelLockRef.current = true;
      setTimeout(() => { wheelLockRef.current = false; }, WHEEL_COOLDOWN);

      if (e.deltaY > 0) onNext();
      else onPrev();
    },
    [disabled, onNext, onPrev],
  );

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onWheel: handleWheel,
  };
}
