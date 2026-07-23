"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";

import { getPresignedUploadUrlAction, completePresignedUploadAction } from "@/actions/project-files/upload-file";
import type { ProjectFileType } from "@prisma/client";

/* ============================================
   usePresignedUpload — Direct browser-to-R2 upload
   Uses presigned PUT URLs for direct upload.
   Shows real upload progress via XMLHttpRequest.
   ============================================ */

export type UploadItem = {
  id: string;
  file: File;
  status: "waiting" | "uploading" | "processing" | "completed" | "failed";
  progress: number;
  error?: string;
  fileId?: string;
};

export function usePresignedUpload(projectId: string | null) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const xhrRefs = useRef<Map<string, XMLHttpRequest>>(new Map());

  const updateItem = useCallback((id: string, updates: Partial<UploadItem>) => {
    setItems((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  }, []);

  const addFiles = useCallback((files: FileList | File[], fileType: ProjectFileType = "ASSET") => {
    const list = Array.from(files);
    const newItems: UploadItem[] = list.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: "waiting" as const,
      progress: 0,
    }));
    setItems((prev) => [...prev, ...newItems]);
    return newItems;
  }, []);

  const removeItem = useCallback((id: string) => {
    const xhr = xhrRefs.current.get(id);
    if (xhr) {
      xhr.abort();
      xhrRefs.current.delete(id);
    }
    setItems((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setItems((prev) => prev.filter((f) => f.status !== "completed"));
  }, []);

  const clearAll = useCallback(() => {
    xhrRefs.current.forEach((xhr) => xhr.abort());
    xhrRefs.current.clear();
    setItems([]);
  }, []);

  const uploadSingle = useCallback(
    async (item: UploadItem, fileType: ProjectFileType) => {
      if (!projectId) return;

      updateItem(item.id, { status: "uploading", progress: 0, error: undefined });

      try {
        // Step 1: Get presigned upload URL from server
        const presignedResult = await getPresignedUploadUrlAction({
          projectId,
          fileName: item.file.name,
          mimeType: item.file.type || "application/octet-stream",
        });

        if (!presignedResult.success || !presignedResult.uploadUrl || !presignedResult.storageKey) {
          throw new Error(presignedResult.error ?? "فشل في توليد رابط الرفع");
        }

        // Step 2: Upload directly to R2 via presigned PUT URL
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhrRefs.current.set(item.id, xhr);

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              updateItem(item.id, { progress: percent });
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`R2 upload failed: ${xhr.status}`));
            }
          });

          xhr.addEventListener("error", () => {
            reject(new Error("فشل في الاتصال بـ R2"));
          });

          xhr.addEventListener("abort", () => {
            reject(new Error("تم الإلغاء"));
          });

          xhr.open("PUT", presignedResult.uploadUrl!);
          xhr.setRequestHeader("Content-Type", item.file.type || "application/octet-stream");
          xhr.send(item.file);
        });

        updateItem(item.id, { status: "processing", progress: 100 });

        // Step 3: Save DB record via server action
        const completeResult = await completePresignedUploadAction({
          projectId,
          storageKey: presignedResult.storageKey,
          fileName: item.file.name,
          mimeType: item.file.type || "application/octet-stream",
          fileSize: item.file.size,
          fileType,
        });

        if (completeResult.success) {
          updateItem(item.id, {
            status: "completed",
            progress: 100,
            fileId: completeResult.fileId,
          });
        } else {
          throw new Error(completeResult.error ?? "فشل في حفظ بيانات الملف");
        }
      } catch (error) {
        const err = error as Error;
        if (err.message === "تم الإلغاء") {
          updateItem(item.id, { status: "failed", error: "تم الإلغاء" });
        } else {
          updateItem(item.id, {
            status: "failed",
            error: err.message ?? "فشل في الرفع",
          });
        }
      } finally {
        xhrRefs.current.delete(item.id);
      }
    },
    [projectId, updateItem],
  );

  const startUpload = useCallback(
    async (fileType: ProjectFileType = "ASSET") => {
      if (!projectId || isUploading) return;
      setIsUploading(true);

      const pending = items.filter((f) => f.status === "waiting" || f.status === "failed");
      for (const item of pending) {
        await uploadSingle(item, fileType);
      }

      setIsUploading(false);
    },
    [projectId, isUploading, items, uploadSingle],
  );

  const retryItem = useCallback(
    async (id: string, fileType: ProjectFileType = "ASSET") => {
      const item = items.find((f) => f.id === id);
      if (!item) return;
      updateItem(id, { status: "waiting", progress: 0, error: undefined });
      await uploadSingle({ ...item, status: "waiting", progress: 0, error: undefined }, fileType);
    },
    [items, updateItem, uploadSingle],
  );

  const cancelUpload = useCallback((id: string) => {
    const xhr = xhrRefs.current.get(id);
    if (xhr) {
      xhr.abort();
      xhrRefs.current.delete(id);
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
