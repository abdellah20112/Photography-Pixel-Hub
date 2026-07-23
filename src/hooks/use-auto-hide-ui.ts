"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/* ============================================
   useAutoHideUI — Auto-hide chrome during playback
   When video is playing, hides UI after 2 seconds.
   Any interaction (tap) reveals it again and
   restarts the timer.

   Uses derived state: uiVisible is always true
   when not playing or disabled, avoiding
   synchronous setState in effects.
   ============================================ */

const HIDE_DELAY = 2000;

export function useAutoHideUI(isPlaying: boolean, enabled = true) {
  const [hidden, setHidden] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      setHidden(true);
    }, HIDE_DELAY);
  }, [clearTimer]);

  /** Reveal UI and restart the hide timer (if playing). */
  const showUI = useCallback(() => {
    setHidden(false);
    if (isPlaying && enabled) {
      startTimer();
    }
  }, [isPlaying, enabled, startTimer]);

  // Timer management only — no setState calls in effect body.
  // Timer callback (setHidden) is async, not synchronous.
  useEffect(() => {
    if (isPlaying && enabled) {
      startTimer();
    }
    return clearTimer;
  }, [isPlaying, enabled, startTimer, clearTimer]);

  // Derived: always visible when not playing or disabled
  const uiVisible = !isPlaying || !enabled ? true : !hidden;

  useEffect(() => clearTimer, [clearTimer]);

  return { uiVisible, showUI };
}
