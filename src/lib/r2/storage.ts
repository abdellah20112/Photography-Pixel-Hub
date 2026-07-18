import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { r2Client } from "./client";
import { R2_CONFIG } from "./config";

/* ============================================
   Cloudflare R2 Storage Service
   Consolidated R2 operations — upload, replace,
   delete, signed URLs, file exists.
   ============================================ */

export type UploadParams = {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
  metadata?: Record<string, string>;
};

export type SignedUrlOptions = {
  /** Expiration in seconds (default: 1 hour). */
  expiresIn?: number;
};

/** Upload a file to Cloudflare R2. Returns the object key. */
export async function uploadFile({
  key,
  body,
  contentType,
  metadata,
}: UploadParams): Promise<string> {
  const params: PutObjectCommandInput = {
    Bucket: R2_CONFIG.BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    Metadata: metadata,
  };

  await r2Client.send(new PutObjectCommand(params));
  return key;
}

/** Replace a file — deletes the old key, uploads the new one. */
export async function replaceFile(
  oldKey: string,
  params: UploadParams
): Promise<string> {
  await deleteFile(oldKey);
  return uploadFile(params);
}

/** Delete a single object from R2. */
export async function deleteFile(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_CONFIG.BUCKET,
      Key: key,
    })
  );
}

/** Generate a presigned URL for downloading a private object. */
export async function getSignedUrlForKey(
  key: string,
  { expiresIn = 3600 }: SignedUrlOptions = {}
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_CONFIG.BUCKET,
    Key: key,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}

/** Generate a signed download URL (alias for getSignedUrlForKey). */
export async function getDownloadUrl(
  key: string,
  options?: SignedUrlOptions
): Promise<string> {
  return getSignedUrlForKey(key, {
    expiresIn: options?.expiresIn ?? 3600,
  });
}

/** Generate a signed streaming URL (shorter expiration for security). */
export async function getStreamingUrl(
  key: string,
  options?: SignedUrlOptions
): Promise<string> {
  return getSignedUrlForKey(key, {
    expiresIn: options?.expiresIn ?? 7200,
  });
}

/** Check if an object exists in R2. */
export async function fileExists(key: string): Promise<boolean> {
  try {
    await r2Client.send(
      new HeadObjectCommand({
        Bucket: R2_CONFIG.BUCKET,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

/** Generate a presigned URL for direct browser upload to R2. */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 600
): Promise<string> {
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  const command = new PutObjectCommand({
    Bucket: R2_CONFIG.BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}

/** Re-export config and helpers for backward compatibility. */
export { R2_CONFIG, getR2PublicUrl } from "./config";
export { uploadToR2 } from "./upload";
export { getSignedDownloadUrl } from "./signed-url";
export { deleteFromR2 } from "./delete";
