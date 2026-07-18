/* ============================================
   App Configuration Constants
   ============================================ */

export const APP_NAME = "Photography Pixel Hub";
export const APP_DESCRIPTION =
  "منصة إدارة التصوير الاحترافية — أرشفة ومشاركة ومعارض صور للعملاء";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
export const APP_LOCALE = "ar_SA";
export const APP_DIR = "rtl" as const;
export const APP_LANG = "ar" as const;

/* ── Pagination ──────────────────────────── */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [12, 24, 48, 96] as const,
} as const;

/* ── Upload Limits ───────────────────────── */
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024,
  MAX_FILES_PER_UPLOAD: 50,
  MAX_TOTAL_UPLOAD_SIZE: 2 * 1024 * 1024 * 1024,
  ALLOWED_CONCURRENT_UPLOADS: 3,
} as const;

/* ── Video Limits ────────────────────────── */
export const VIDEO_LIMITS = {
  MAX_VIDEO_SIZE: 500 * 1024 * 1024,
  MAX_VIDEO_DURATION_SECONDS: 300,
  ALLOWED_VIDEO_FORMATS: ["mp4", "webm", "mov"] as const,
} as const;

/* ── Allowed File Types ──────────────────── */
export const ALLOWED_FILE_TYPES = {
  IMAGES: ["jpg", "jpeg", "png", "webp", "gif", "avif"] as const,
  VIDEOS: ["mp4", "webm", "mov"] as const,
  RAW: ["raw", "cr2", "nef", "arw", "dng"] as const,
} as const;

export const ALL_ALLOWED_TYPES = [
  ...ALLOWED_FILE_TYPES.IMAGES,
  ...ALLOWED_FILE_TYPES.VIDEOS,
  ...ALLOWED_FILE_TYPES.RAW,
] as const;

/* ── Default Settings ────────────────────── */
export const DEFAULT_SETTINGS = {
  LANGUAGE: "ar",
  THEME: "dark",
  TIMEZONE: "Asia/Riyadh",
  CURRENCY: "SAR",
  DATE_FORMAT: "long",
} as const;
