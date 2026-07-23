import { STORAGE_CONFIG } from "./config";
import { CloudflareR2Provider } from "./cloudflare-r2.provider";
import type { StorageProvider } from "./provider";
import type {
  UploadParams,
  SignedUrlOptions,
  FileMetadata,
  ListFilesOptions,
  ListFilesResult,
  CopyFileOptions,
} from "./types";

/* ============================================
   StorageService
   The ONLY storage entry point for the application.
   Depends on StorageProvider interface — never on
   a concrete provider. Consumers (services, actions,
   API routes) import from here exclusively.
   ============================================ */

function createProvider(): StorageProvider {
  switch (STORAGE_CONFIG.PROVIDER) {
    case "cloudflare-r2":
      return new CloudflareR2Provider();
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

  moveFile(sourceKey: string, destinationKey: string): Promise<string> {
    return provider.moveFile(sourceKey, destinationKey);
  },

  copyFile(sourceKey: string, destinationKey: string, options?: CopyFileOptions): Promise<string> {
    return provider.copyFile(sourceKey, destinationKey, options);
  },

  listFiles(options?: ListFilesOptions): Promise<ListFilesResult> {
    return provider.listFiles(options);
  },

  exists(key: string): Promise<boolean> {
    return provider.exists(key);
  },

  getMetadata(key: string): Promise<FileMetadata> {
    return provider.getMetadata(key);
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
    options?: SignedUrlOptions,
  ): Promise<string> {
    return provider.generateUploadUrl(key, contentType, options);
  },
};

/** Re-export types for consumer convenience. */
export type { StorageProvider, UploadParams, SignedUrlOptions, FileMetadata, ListFilesOptions, ListFilesResult, CopyFileOptions };
