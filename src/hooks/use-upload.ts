"use client";

import { useState, useCallback, useRef } from "react";

import type { UploadQueueItem } from "@/types/video";
import { extractVideoMetadata } from "@/lib/video/metadata";
import { completeUploadAction } from "@/actions/uploads/complete-upload";

/* ============================================
   useUploadQueue — Client-side upload manager
   Handles file queue, upload to R2, progress,
   cancel, retry, and completion.
   ============================================ */

export function useUploadQueue(projectId: string | null) {
  const [items, setItems] = useState<UploadQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const addFiles = useCallback((files: FileList | File[]) => {
    const list = Array.from(files);
    const newItems: UploadQueueItem[] = list.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: "waiting" as const,
      progress: 0,
    }));
    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const removeItem = useCallback((id: string) => {
    const controller = abortControllers.current.get(id);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(id);
    }
    setItems((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const updateItem = useCallback(
    (id: string, updates: Partial<UploadQueueItem>) => {
      setItems((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
      );
    },
    []
  );

  const clearCompleted = useCallback(() => {
    setItems((prev) => prev.filter((f) => f.status !== "completed"));
  }, []);

  const clearAll = useCallback(() => {
    abortControllers.current.forEach((c) => c.abort());
    abortControllers.current.clear();
    setItems([]);
  }, []);

  const uploadFile = useCallback(
    async (item: UploadQueueItem) => {
      if (!projectId) return;

      const abortController = new AbortController();
      abortControllers.current.set(item.id, abortController);

      updateItem(item.id, { status: "uploading", progress: 0, error: undefined });

      try {
        // Extract metadata client-side
        let duration: number | undefined;
        let width: number | undefined;
        let height: number | undefined;
        try {
          const meta = await extractVideoMetadata(item.file);
          duration = meta.duration || undefined;
          width = meta.width || undefined;
          height = meta.height || undefined;
        } catch {
          // Metadata extraction failed — continue without it
        }

        // Upload via FormData to /api/upload
        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("projectId", projectId);

        updateItem(item.id, { status: "uploading", progress: 10 });

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          signal: abortController.signal,
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error ?? "فشل في رفع الملف");
        }

        updateItem(item.id, { status: "processing", progress: 90 });

        const result = await response.json();

        // Complete upload — create video record
        const completeResult = await completeUploadAction({
          projectId,
          title: item.file.name.replace(/\.[^.]+$/, ""),
          originalFileName: item.file.name,
          storageKey: result.storageKey,
          storageBucket: result.storageBucket,
          mimeType: result.mimeType,
          extension: result.extension,
          fileSize: result.fileSize,
          duration,
          width,
          height,
        });

        if (completeResult.success) {
          updateItem(item.id, {
            status: "completed",
            progress: 100,
            videoId: completeResult.videoId,
          });
        } else {
          throw new Error(completeResult.error ?? "فشل في إكمال الرفع");
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          updateItem(item.id, { status: "failed", error: "تم الإلغاء" });
        } else {
          updateItem(item.id, {
            status: "failed",
            error: (error as Error).message ?? "فشل في الرفع",
          });
        }
      } finally {
        abortControllers.current.delete(item.id);
      }
    },
    [projectId, updateItem]
  );

  const startUpload = useCallback(async () => {
    if (!projectId || isUploading) return;
    setIsUploading(true);

    const pending = items.filter((f) => f.status === "waiting" || f.status === "failed");
    for (const item of pending) {
      await uploadFile(item);
    }

    setIsUploading(false);
  }, [projectId, isUploading, items, uploadFile]);

  const retryItem = useCallback(
    async (id: string) => {
      const item = items.find((f) => f.id === id);
      if (!item) return;
      updateItem(id, { status: "waiting", progress: 0, error: undefined });
      await uploadFile({ ...item, status: "waiting", progress: 0, error: undefined });
    },
    [items, updateItem, uploadFile]
  );

  const cancelUpload = useCallback((id: string) => {
    const controller = abortControllers.current.get(id);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(id);
    }
    updateItem(id, { status: "failed", error: "تم الإلغاء" });
  }, [updateItem]);

  return {
    items,
    isUploading,
    addFiles,
    removeItem,
    retryItem,
    cancelUpload,
    startUpload,
    clearCompleted,
    clearAll,
  };
}
