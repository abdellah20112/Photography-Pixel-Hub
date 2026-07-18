import { VIDEO_LIMITS } from "@/lib/constants";

/* ============================================
   Storage Configuration
   Centralized configuration for all storage
   operations — bucket, expiration, limits.
   ============================================ */

/** Cloudflare R2 environment configuration. */
const R2_ENV = {
  ENDPOINT: process.env.R2_ENDPOINT ?? "",
  ACCESS_KEY: process.env.R2_ACCESS_KEY ?? "",
  SECRET_KEY: process.env.R2_SECRET_KEY ?? "",
  BUCKET: process.env.R2_BUCKET ?? "",
  PUBLIC_URL: process.env.R2_PUBLIC_URL ?? "",
} as const;

/** Centralized storage configuration. */
export const STORAGE_CONFIG = {
  /** Active provider name (single source of truth). */
  PROVIDER: "cloudflare-r2" as const,

  /** Bucket name. */
  BUCKET: R2_ENV.BUCKET,

  /** Provider endpoint. */
  ENDPOINT: R2_ENV.ENDPOINT,

  /** Provider credentials. */
  CREDENTIALS: {
    accessKey: R2_ENV.ACCESS_KEY,
    secretKey: R2_ENV.SECRET_KEY,
  },

  /** Public CDN URL (if supported by provider). */
  PUBLIC_URL: R2_ENV.PUBLIC_URL,

  /** Signed URL expiration in seconds. */
  SIGNED_URL_EXPIRATION: {
    /** Download URL expiration (1 hour). */
    DOWNLOAD: 3600,
    /** Streaming URL expiration (2 hours). */
    STREAMING: 7200,
    /** Presigned upload URL expiration (10 minutes). */
    UPLOAD: 600,
  } as const,

  /** Upload limits — sourced from existing config. */
  LIMITS: {
    MAX_FILE_SIZE: VIDEO_LIMITS.MAX_VIDEO_SIZE,
    MAX_VIDEO_DURATION_SECONDS: VIDEO_LIMITS.MAX_VIDEO_DURATION_SECONDS,
    ALLOWED_VIDEO_FORMATS: VIDEO_LIMITS.ALLOWED_VIDEO_FORMATS,
    ALLOWED_MIME_TYPES: [
      "video/mp4",
      "video/quicktime",
      "video/webm",
    ] as const,
  } as const,
} as const;

/** Build a public URL for an object (if provider supports it). */
export function getPublicUrl(key: string): string {
  return `${STORAGE_CONFIG.PUBLIC_URL}/${key}`;
}
