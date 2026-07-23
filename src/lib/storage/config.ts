import { VIDEO_LIMITS } from "@/lib/constants";

/* ============================================
   Storage Configuration
   Centralized configuration for all storage
   operations — reads credentials ONLY from
   process.env. No hardcoded credentials.
   ============================================ */

/** Cloudflare R2 environment configuration (from process.env). */
const R2_ENV = {
  ACCOUNT_ID: process.env.R2_ACCOUNT_ID ?? "",
  ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ?? "",
  SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ?? "",
  BUCKET_NAME: process.env.R2_BUCKET_NAME ?? "",
  ENDPOINT: process.env.R2_ENDPOINT ?? "",
} as const;

/** Centralized storage configuration. */
export const STORAGE_CONFIG = {
  /** Active provider name (single source of truth). */
  PROVIDER: "cloudflare-r2" as const,

  /** Bucket name. */
  BUCKET: R2_ENV.BUCKET_NAME,

  /** Provider endpoint. */
  ENDPOINT: R2_ENV.ENDPOINT,

  /** Cloudflare account ID. */
  ACCOUNT_ID: R2_ENV.ACCOUNT_ID,

  /** Provider credentials. */
  CREDENTIALS: {
    accessKeyId: R2_ENV.ACCESS_KEY_ID,
    secretAccessKey: R2_ENV.SECRET_ACCESS_KEY,
  },

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
