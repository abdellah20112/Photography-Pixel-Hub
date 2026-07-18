import { VIDEO_LIMITS } from "@/lib/constants";

/* ============================================
   Video Metadata Utilities
   Extract and format video metadata.
   ============================================ */

/** Extract file extension from filename. */
export function getExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

/** Get MIME type from File object (falls back to extension-based detection). */
export function getMimeType(file: File): string {
  if (file.type) return file.type;
  const ext = getExtension(file.name);
  const map: Record<string, string> = {
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
  };
  return map[ext] ?? "application/octet-stream";
}

/** Format resolution as "WxH" (e.g., "1920x1080"). */
export function formatResolution(width: number | null, height: number | null): string {
  if (!width || !height) return "—";
  return `${width}x${height}`;
}

/** Format duration in seconds as "M:SS" or "H:MM:SS". */
export function formatDuration(seconds: number | null): string {
  if (seconds == null) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Generate a unique storage key for a video file. */
export function generateStorageKey(projectId: string, filename: string): string {
  const ext = getExtension(filename);
  const uuid = crypto.randomUUID();
  return `videos/${projectId}/${uuid}${ext ? `.${ext}` : ""}`;
}

/** Generate a thumbnail key from a video storage key. */
export function generateThumbnailKey(videoKey: string): string {
  return videoKey.replace(/^videos\//, "thumbnails/").replace(/\.[^.]+$/, ".jpg");
}

/** Validate a file against upload limits. */
export function validateVideoFile(file: File): { valid: boolean; error?: string } {
  const ext = getExtension(file.name);
  if (!(VIDEO_LIMITS.ALLOWED_VIDEO_FORMATS as readonly string[]).includes(ext)) {
    return {
      valid: false,
      error: `صيغة غير مدعومة. الصيغ المسموحة: ${VIDEO_LIMITS.ALLOWED_VIDEO_FORMATS.join(", ")}`,
    };
  }

  if (file.size > VIDEO_LIMITS.MAX_VIDEO_SIZE) {
    const maxSizeMB = VIDEO_LIMITS.MAX_VIDEO_SIZE / (1024 * 1024);
    return {
      valid: false,
      error: `حجم الملف يتجاوز الحد الأقصى (${maxSizeMB} ميجابايت)`,
    };
  }

  if (file.size <= 0) {
    return { valid: false, error: "الملف فارغ" };
  }

  return { valid: true };
}

/**
 * Extract video metadata (duration, width, height) using the browser's
 * HTMLVideoElement API. This runs client-side before upload.
 */
export function extractVideoMetadata(
  file: File
): Promise<{ duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      const metadata = {
        duration: Math.round(video.duration) || 0,
        width: video.videoWidth || 0,
        height: video.videoHeight || 0,
      };
      URL.revokeObjectURL(url);
      resolve(metadata);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("فشل في قراءة بيانات الفيديو"));
    };
  });
}

/**
 * Placeholder thumbnail generation.
 * Architecture is in place — actual FFmpeg-based generation
 * will be implemented in a future sprint.
 */
export function generateThumbnailPlaceholder(videoCode: string): string {
  return `/api/thumbnail/${videoCode}`;
}
