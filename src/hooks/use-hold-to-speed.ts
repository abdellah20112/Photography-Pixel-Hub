"use client";

import { useRef, useState, useCallback, useEffect } from "react";

/* ============================================
   useHoldToSpeed — Long-press for 2x playback
   Holding the video for HOLD_DELAY ms sets
   playback to 2x. Releasing restores original.
   ============================================ */

const HOLD_DELAY = 500;
const SPEED_MULTIPLIER = 2;

type HoldToSpeedOptions = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  disabled?: boolean;
};

export function useHoldToSpeed({ videoRef, disabled }: HoldToSpeedOptions) {
  const [isSpeeding, setIsSpeeding] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originalRate = useRef(1);

  const clearHold = useCallback(() => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }, []);

  const onPointerDown = useCallback(() => {
    if (disabled) return;
    const video = videoRef.current;
    if (!video) return;

    originalRate.current = video.playbackRate;
    clearHold();

    holdTimer.current = setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.playbackRate = SPEED_MULTIPLIER;
        setIsSpeeding(true);
      }
    }, HOLD_DELAY);
  }, [disabled, videoRef, clearHold]);

  const onPointerUp = useCallback(() => {
    clearHold();
    const video = videoRef.current;
    if (video && isSpeeding) {
      video.playbackRate = originalRate.current;
    }
    setIsSpeeding(false);
  }, [videoRef, isSpeeding, clearHold]);

  const onPointerLeave = useCallback(() => {
    clearHold();
    const video = videoRef.current;
    if (video && isSpeeding) {
      video.playbackRate = originalRate.current;
    }
    setIsSpeeding(false);
  }, [videoRef, isSpeeding, clearHold]);

  useEffect(() => clearHold, [clearHold]);

  return { isSpeeding, onPointerDown, onPointerUp, onPointerLeave };
}
