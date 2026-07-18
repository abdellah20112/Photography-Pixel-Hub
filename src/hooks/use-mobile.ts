"use client";

import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 1024;

/**
 * Detects whether the viewport is below the mobile breakpoint.
 * Returns `false` during SSR to avoid hydration mismatches.
 */
export function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    mql.addEventListener("change", onChange);
    onChange();

    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
