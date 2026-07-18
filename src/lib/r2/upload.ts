import {
  PutObjectCommand,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";

import { r2Client } from "./client";
import { R2_CONFIG } from "./config";

export type UploadParams = {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
  metadata?: Record<string, string>;
};

/**
 * Upload a file to Cloudflare R2.
 *
 * @returns the object key on success.
 */
export async function uploadToR2({
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
