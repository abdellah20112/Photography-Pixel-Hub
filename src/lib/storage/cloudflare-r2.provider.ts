import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  ListObjectsV2Command,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { STORAGE_CONFIG } from "./config";
import type { StorageProvider } from "./provider";
import type {
  UploadParams,
  SignedUrlOptions,
  FileMetadata,
  ListFilesOptions,
  ListFilesResult,
  CopyFileOptions,
} from "./types";
import {
  mapStorageError,
  FileNotExistsError,
  UploadFailedError,
  DeleteFailedError,
  PermissionDeniedError,
} from "./errors";

/* ============================================
   Cloudflare R2 Storage Provider
   Implements StorageProvider using the AWS SDK
   (R2 is S3-compatible). All Cloudflare-specific
   logic lives here and nowhere else.

   Credentials are read from process.env via
   STORAGE_CONFIG — never hardcoded.
   ============================================ */

/** Lazy-initialized S3 client (only created when first used). */
let _r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (_r2Client) return _r2Client;

  _r2Client = new S3Client({
    region: "auto",
    endpoint: STORAGE_CONFIG.ENDPOINT,
    credentials: {
      accessKeyId: STORAGE_CONFIG.CREDENTIALS.accessKeyId,
      secretAccessKey: STORAGE_CONFIG.CREDENTIALS.secretAccessKey,
    },
  });
  return _r2Client;
}

export class CloudflareR2Provider implements StorageProvider {
  readonly name = "cloudflare-r2";
  readonly bucket: string;

  constructor() {
    this.bucket = STORAGE_CONFIG.BUCKET;
  }

  async upload(params: UploadParams): Promise<string> {
    const { key, body, contentType, metadata } = params;

    const commandInput: PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: metadata,
    };

    try {
      await getR2Client().send(new PutObjectCommand(commandInput));
      return key;
    } catch (error) {
      const mapped = mapStorageError(error, `upload(${key})`);
      if (mapped.code === "PERMISSION_DENIED") throw new PermissionDeniedError("upload");
      throw new UploadFailedError(key, mapped.message);
    }
  }

  async replace(oldKey: string, params: UploadParams): Promise<string> {
    // Delete old file first (ignore errors if it doesn't exist)
    try {
      await this.delete(oldKey);
    } catch {
      // Old file may not exist — that's OK
    }

    return this.upload(params);
  }

  async delete(key: string): Promise<void> {
    try {
      await getR2Client().send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch (error) {
      const mapped = mapStorageError(error, `delete(${key})`);
      if (mapped.code === "PERMISSION_DENIED") throw new PermissionDeniedError("delete");
      throw new DeleteFailedError(key);
    }
  }

  async moveFile(sourceKey: string, destinationKey: string): Promise<string> {
    // Copy to destination
    await this.copyFile(sourceKey, destinationKey);
    // Delete source
    await this.delete(sourceKey);
    return destinationKey;
  }

  async copyFile(
    sourceKey: string,
    destinationKey: string,
    _options?: CopyFileOptions,
  ): Promise<string> {
    try {
      await getR2Client().send(
        new CopyObjectCommand({
          Bucket: this.bucket,
          Key: destinationKey,
          CopySource: `${this.bucket}/${sourceKey}`,
        }),
      );
      return destinationKey;
    } catch (error) {
      const mapped = mapStorageError(error, `copyFile(${sourceKey} → ${destinationKey})`);
      if (mapped.code === "FILE_NOT_EXISTS") throw new FileNotExistsError(sourceKey);
      if (mapped.code === "PERMISSION_DENIED") throw new PermissionDeniedError("copyFile");
      throw mapped;
    }
  }

  async listFiles(options?: ListFilesOptions): Promise<ListFilesResult> {
    try {
      const response = await getR2Client().send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: options?.prefix,
          MaxKeys: options?.maxKeys ?? 1000,
          ContinuationToken: options?.continuationToken,
        }),
      );

      return {
        items: (response.Contents ?? []).map((obj) => ({
          key: obj.Key!,
          size: obj.Size ?? 0,
          lastModified: obj.LastModified ?? new Date(0),
          etag: obj.ETag?.replace(/"/g, "") ?? null,
        })),
        isTruncated: response.IsTruncated ?? false,
        continuationToken: response.NextContinuationToken ?? null,
      };
    } catch (error) {
      throw mapStorageError(error, "listFiles");
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await getR2Client().send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }

  async getMetadata(key: string): Promise<FileMetadata> {
    try {
      const response = await getR2Client().send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      return {
        key,
        size: response.ContentLength ?? 0,
        contentType: response.ContentType ?? null,
        lastModified: response.LastModified ?? null,
        etag: response.ETag?.replace(/"/g, "") ?? null,
        metadata: (response.Metadata as Record<string, string>) ?? {},
      };
    } catch (error) {
      const mapped = mapStorageError(error, `getMetadata(${key})`);
      if (mapped.code === "FILE_NOT_EXISTS") throw new FileNotExistsError(key);
      throw mapped;
    }
  }

  async getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    const expiresIn = options?.expiresIn ?? STORAGE_CONFIG.SIGNED_URL_EXPIRATION.DOWNLOAD;

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ...(options?.responseContentDisposition
        ? { ResponseContentDisposition: options.responseContentDisposition }
        : {}),
    });

    try {
      return await getSignedUrl(getR2Client(), command, { expiresIn });
    } catch (error) {
      throw mapStorageError(error, `getSignedUrl(${key})`);
    }
  }

  async getDownloadUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    return this.getSignedUrl(key, {
      expiresIn: options?.expiresIn ?? STORAGE_CONFIG.SIGNED_URL_EXPIRATION.DOWNLOAD,
      responseContentDisposition: options?.responseContentDisposition ?? 'attachment',
    });
  }

  async getStreamingUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    return this.getSignedUrl(key, {
      expiresIn: options?.expiresIn ?? STORAGE_CONFIG.SIGNED_URL_EXPIRATION.STREAMING,
    });
  }

  async generateUploadUrl(
    key: string,
    contentType: string,
    options?: SignedUrlOptions,
  ): Promise<string> {
    const expiresIn = options?.expiresIn ?? STORAGE_CONFIG.SIGNED_URL_EXPIRATION.UPLOAD;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    try {
      return await getSignedUrl(getR2Client(), command, { expiresIn });
    } catch (error) {
      throw mapStorageError(error, `generateUploadUrl(${key})`);
    }
  }
}
