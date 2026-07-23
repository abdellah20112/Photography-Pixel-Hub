import { STORAGE_CONFIG } from "./config";
import { FileValidationError } from "./errors";

/* ============================================
   File Validation Utilities
   Validates file type, MIME, size before upload.
   ============================================ */

/** Supported file type categories. */
export const FILE_TYPE_CATEGORIES = {
  VIDEO: ["mp4", "mov", "webm", "avi"],
  IMAGE: ["jpg", "jpeg", "png", "webp", "gif", "avif"],
  AUDIO: ["mp3", "wav", "aac", "flac", "ogg"],
  DOCUMENT: ["pdf", "doc", "docx", "txt", "rtf"],
  SPREADSHEET: ["xls", "xlsx", "csv"],
  ARCHIVE: ["zip", "rar", "7z", "tar", "gz"],
} as const;

/** MIME type mapping for common extensions. */
const MIME_MAP: Record<string, string> = {
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  avi: "video/x-msvideo",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  aac: "audio/aac",
  flac: "audio/flac",
  ogg: "audio/ogg",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  rtf: "application/rtf",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
  zip: "application/zip",
  rar: "application/vnd.rar",
  "7z": "application/x-7z-compressed",
};

export type ValidationResult = {
  valid: boolean;
  error?: string;
  mimeType?: string;
  extension?: string;
};

/** Get extension from filename (lowercase, no dot). */
export function getExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

/** Get MIME type from extension. */
export function getMimeType(filename: string): string {
  const ext = getExtension(filename);
  return MIME_MAP[ext] ?? "application/octet-stream";
}

/**
 * Validate a video file against upload limits.
 * Checks: extension, MIME type, file size, empty file.
 */
export function validateVideoFile(file: { name: string; size: number; type?: string }): ValidationResult {
  const ext = getExtension(file.name);
  const mimeType = file.type || getMimeType(file.name);

  if (!ext) {
    return { valid: false, error: "الملف لا يحتوي على امتداد", extension: ext };
  }

  const allowedFormats = STORAGE_CONFIG.LIMITS.ALLOWED_VIDEO_FORMATS as readonly string[];
  if (!allowedFormats.includes(ext)) {
    return {
      valid: false,
      error: `صيغة غير مدعومة. الصيغ المسموحة: ${allowedFormats.join(", ")}`,
      extension: ext,
      mimeType,
    };
  }

  if (file.size <= 0) {
    return { valid: false, error: "الملف فارغ", extension: ext, mimeType };
  }

  const maxSize = STORAGE_CONFIG.LIMITS.MAX_FILE_SIZE;
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `حجم الملف يتجاوز الحد الأقصى (${maxSizeMB} ميجابايت)`,
      extension: ext,
      mimeType,
    };
  }

  return { valid: true, extension: ext, mimeType };
}

/**
 * Validate any file against allowed categories.
 */
export function validateFile(
  file: { name: string; size: number; type?: string },
  allowedCategories: (keyof typeof FILE_TYPE_CATEGORIES)[] = ["VIDEO", "IMAGE", "DOCUMENT"],
  maxSize?: number,
): ValidationResult {
  const ext = getExtension(file.name);
  const mimeType = file.type || getMimeType(file.name);

  if (!ext) {
    return { valid: false, error: "الملف لا يحتوي على امتداد" };
  }

  const allowedExtensions = allowedCategories.flatMap(
    (cat) => FILE_TYPE_CATEGORIES[cat] as readonly string[],
  );

  if (!allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `نوع الملف غير مدعوم. الأنواع المسموحة: ${allowedExtensions.join(", ")}`,
      extension: ext,
      mimeType,
    };
  }

  if (file.size <= 0) {
    return { valid: false, error: "الملف فارغ", extension: ext, mimeType };
  }

  const limit = maxSize ?? STORAGE_CONFIG.LIMITS.MAX_FILE_SIZE;
  if (file.size > limit) {
    const limitMB = Math.round(limit / (1024 * 1024));
    return {
      valid: false,
      error: `حجم الملف يتجاوز الحد الأقصى (${limitMB} ميجابايت)`,
      extension: ext,
      mimeType,
    };
  }

  return { valid: true, extension: ext, mimeType };
}

/**
 * Throw a FileValidationError if validation fails.
 */
export function assertValid(
  file: { name: string; size: number; type?: string },
  allowedCategories: (keyof typeof FILE_TYPE_CATEGORIES)[] = ["VIDEO", "IMAGE", "DOCUMENT"],
  maxSize?: number,
): void {
  const result = validateFile(file, allowedCategories, maxSize);
  if (!result.valid) {
    throw new FileValidationError(result.error ?? "فشل في التحقق من الملف");
  }
}
