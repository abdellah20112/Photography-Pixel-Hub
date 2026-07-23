"use client";

import { useState, useCallback } from "react";

/* ============================================
   useDraftComment — Auto-save draft comments
   Persists unsaved comment text to localStorage
   so it survives page refreshes.
   ============================================ */

const STORAGE_PREFIX = "draft-comment:";

export function useDraftComment(videoId: string) {
  const storageKey = `${STORAGE_PREFIX}${videoId}`;
  const [draft, setDraft] = useState(() => {
    try {
      return localStorage.getItem(storageKey) ?? "";
    } catch {
      return "";
    }
  });

  const updateDraft = useCallback(
    (text: string) => {
      setDraft(text);
      try {
        if (text.trim()) {
          localStorage.setItem(storageKey, text);
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch {
        // Storage full or unavailable
      }
    },
    [storageKey],
  );

  const clearDraft = useCallback(() => {
    setDraft("");
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore
    }
  }, [storageKey]);

  return { draft, updateDraft, clearDraft };
}
