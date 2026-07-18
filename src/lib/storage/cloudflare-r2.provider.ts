import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { STORAGE_CONFIG } from "./config";
import type { StorageProvider } from "./provider";
import type { UploadParams, SignedUrlOptions } from "./types";

/* ============================================
   Cloudflare R2 Storage Provider
   Implements StorageProvider using the AWS SDK
   (R2 is S3-compatible). All Cloudflare-specific
   logic lives here and nowhere else.
   ============================================ */

/** Lazy-initialized S3 client (only created when first used). */
let _r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (_r2Client) return _r2Client;

  _r2Client = new S3Client({
    region: "auto",
    endpoint: STORAGE_CONFIG.ENDPOINT,
    credentials: {
      accessKeyId: STORAGE_CONFIG.CREDENTIALS.accessKey,
      secretAccessKey: STORAGE_CONFIG.CREDENTIALS.secretKey,
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

    await getR2Client().send(new PutObjectCommand(commandInput));
    return key;
  }

  async replace(oldKey: string, params: UploadParams): Promise<string> {
    await this.delete(oldKey);
    return this.upload(params);
  }

  async delete(key: string): Promise<void> {
    await getR2Client().send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }

  async exists(key: string): Promise<boolean> {
    try {
      await getR2Client().send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  async getSignedUrl(
    key: string,
    options?: SignedUrlOptions
  ): Promise<string> {
    const expiresIn = options?.expiresIn ?? STORAGE_CONFIG.SIGNED_URL_EXPIRATION.DOWNLOAD;

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(getR2Client(), command, { expiresIn });
  }

  async getDownloadUrl(
    key: string,
    options?: SignedUrlOptions
  ): Promise<string> {
    return this.getSignedUrl(key, {
      expiresIn: options?.expiresIn ?? STORAGE_CONFIG.SIGNED_URL_EXPIRATION.DOWNLOAD,
    });
  }

  async getStreamingUrl(
    key: string,
    options?: SignedUrlOptions
  ): Promise<string> {
    return this.getSignedUrl(key, {
      expiresIn: options?.expiresIn ?? STORAGE_CONFIG.SIGNED_URL_EXPIRATION.STREAMING,
    });
  }

  async generateUploadUrl(
    key: string,
    contentType: string,
    options?: SignedUrlOptions
  ): Promise<string> {
    const expiresIn = options?.expiresIn ?? STORAGE_CONFIG.SIGNED_URL_EXPIRATION.UPLOAD;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(getR2Client(), command, { expiresIn });
  }
}
