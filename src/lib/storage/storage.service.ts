import { STORAGE_CONFIG } from "./config";
import { CloudflareR2Provider } from "./cloudflare-r2.provider";
import type { StorageProvider } from "./provider";
import type { UploadParams, SignedUrlOptions } from "./types";

/* ============================================
   StorageService
   The ONLY storage entry point for the application.
   Depends on StorageProvider interface — never on
   a concrete provider. Consumers (services, actions,
   API routes) import from here exclusively.
   ============================================ */

/**
 * Instantiate the active provider based on configuration.
 * To swap providers, change STORAGE_CONFIG.PROVIDER
 * and add the provider class — no other code changes needed.
 */
function createProvider(): StorageProvider {
  switch (STORAGE_CONFIG.PROVIDER) {
    case "cloudflare-r2":
      return new CloudflareR2Provider();
    // Future providers:
    // case "aws-s3": return new AwsS3Provider();
    // case "supabase": return new SupabaseStorageProvider();
    // case "local": return new LocalStorageProvider();
    default:
      return new CloudflareR2Provider();
  }
}

/** Singleton provider instance. */
const provider: StorageProvider = createProvider();

/**
 * StorageService — delegates all operations to the
 * injected StorageProvider. This is the single
 * storage facade for the entire application.
 */
export const storageService: StorageProvider = {
  get name() {
    return provider.name;
  },

  get bucket() {
    return provider.bucket;
  },

  upload(params: UploadParams): Promise<string> {
    return provider.upload(params);
  },

  replace(oldKey: string, params: UploadParams): Promise<string> {
    return provider.replace(oldKey, params);
  },

  delete(key: string): Promise<void> {
    return provider.delete(key);
  },

  exists(key: string): Promise<boolean> {
    return provider.exists(key);
  },

  getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    return provider.getSignedUrl(key, options);
  },

  getDownloadUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    return provider.getDownloadUrl(key, options);
  },

  getStreamingUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    return provider.getStreamingUrl(key, options);
  },

  generateUploadUrl(
    key: string,
    contentType: string,
    options?: SignedUrlOptions
  ): Promise<string> {
    return provider.generateUploadUrl(key, contentType, options);
  },
};

/** Re-export types for consumer convenience. */
export type { StorageProvider, UploadParams, SignedUrlOptions };
