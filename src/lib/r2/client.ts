import { S3Client } from "@aws-sdk/client-s3";

/**
 * Cloudflare R2 S3-compatible client.
 *
 * Configured with R2 endpoint, credentials, and region.
 * This is the only S3Client instance — all R2 modules import from here.
 */
export const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_KEY!,
  },
});
