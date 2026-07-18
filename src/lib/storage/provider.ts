import type { UploadParams, SignedUrlOptions } from "./types";

/* ============================================
   StorageProvider Interface
   Provider-agnostic contract for file storage.
   Every provider (R2, S3, Supabase, Local, etc.)
   must implement this interface.
   No provider-specific types leak here.
   ============================================ */

export interface StorageProvider {
  /** Human-readable provider name. */
  readonly name: string;

  /** The bucket/container name. */
  readonly bucket: string;

  /**
   * Upload a file to storage.
   * @returns the object key on success.
   */
  upload(params: UploadParams): Promise<string>;

  /**
   * Replace a file — deletes the old key, uploads the new one.
   * @returns the new object key.
   */
  replace(oldKey: string, params: UploadParams): Promise<string>;

  /**
   * Delete a single object from storage.
   */
  delete(key: string): Promise<void>;

  /**
   * Check if an object exists in storage.
   */
  exists(key: string): Promise<boolean>;

  /**
   * Generate a signed URL for downloading a private object.
   */
  getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string>;

  /**
   * Generate a signed download URL.
   * Uses download-specific expiration by default.
   */
  getDownloadUrl(key: string, options?: SignedUrlOptions): Promise<string>;

  /**
   * Generate a signed streaming URL.
   * Uses streaming-specific expiration by default.
   */
  getStreamingUrl(key: string, options?: SignedUrlOptions): Promise<string>;

  /**
   * Generate a presigned URL for direct browser upload.
   * @returns a temporary upload URL.
   */
  generateUploadUrl(
    key: string,
    contentType: string,
    options?: SignedUrlOptions
  ): Promise<string>;
}
