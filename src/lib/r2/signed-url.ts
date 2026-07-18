import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { r2Client } from "./client";
import { R2_CONFIG } from "./config";

export type SignedUrlOptions = {
  /** Expiration in seconds (default: 1 hour). */
  expiresIn?: number;
};

/**
 * Generate a presigned URL for downloading a private object from R2.
 *
 * @param key    - Object key in the bucket.
 * @param options - Optional expiration (default 3600s).
 * @returns A temporary signed URL.
 */
export async function getSignedDownloadUrl(
  key: string,
  { expiresIn = 3600 }: SignedUrlOptions = {}
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_CONFIG.BUCKET,
    Key: key,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}
