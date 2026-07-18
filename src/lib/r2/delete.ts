import { DeleteObjectCommand } from "@aws-sdk/client-s3";

import { r2Client } from "./client";
import { R2_CONFIG } from "./config";

/**
 * Delete a single object from Cloudflare R2.
 */
export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_CONFIG.BUCKET,
      Key: key,
    })
  );
}
