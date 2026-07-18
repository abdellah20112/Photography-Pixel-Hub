/* ============================================
   Storage Types
   Provider-agnostic types shared across
   the storage abstraction layer.
   ============================================ */

/** Parameters for uploading a file to storage. */
export type UploadParams = {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
  metadata?: Record<string, string>;
};

/** Options for signed URL generation. */
export type SignedUrlOptions = {
  /** Expiration in seconds. */
  expiresIn?: number;
};

/** Result of a signed URL generation. */
export type SignedUrlResult = {
  url: string;
  expiresAt: number;
};

/** Configuration for a storage provider. */
export type StorageProviderConfig = {
  bucket: string;
  endpoint?: string;
  accessKey?: string;
  secretKey?: string;
  publicUrl?: string;
};

/** Supported storage provider names. */
export type StorageProviderName = "cloudflare-r2" | "aws-s3" | "supabase" | "local";
