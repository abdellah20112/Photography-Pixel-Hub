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

  /** Content-Disposition header for downloads. */
  responseContentDisposition?: string;
};

/** Result of a signed URL generation. */
export type SignedUrlResult = {
  url: string;
  expiresAt: number;
};

/** Object metadata returned by getMetadata(). */
export type FileMetadata = {
  key: string;
  size: number;
  contentType: string | null;
  lastModified: Date | null;
  etag: string | null;
  metadata: Record<string, string>;
};

/** Options for listFiles(). */
export type ListFilesOptions = {
  /** Prefix to filter objects by. */
  prefix?: string;
  /** Maximum number of objects to return (default: 1000). */
  maxKeys?: number;
  /** Continuation token from a previous request. */
  continuationToken?: string;
};

/** Result of listFiles(). */
export type ListFilesResult = {
  items: Array<{
    key: string;
    size: number;
    lastModified: Date;
    etag: string | null;
  }>;
  isTruncated: boolean;
  continuationToken: string | null;
};

/** Options for copyFile(). */
export type CopyFileOptions = {
  /** Overwrite if destination already exists (default: true). */
  overwrite?: boolean;
};

/** Configuration for a storage provider. */
export type StorageProviderConfig = {
  bucket: string;
  endpoint?: string;
  accessKey?: string;
  secretKey?: string;
  accountId?: string;
};

/** Supported storage provider names. */
export type StorageProviderName = "cloudflare-r2" | "aws-s3";
