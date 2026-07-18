/* ============================================
   Cloudflare R2 Configuration
   ============================================ */

export const R2_CONFIG = {
  ENDPOINT: process.env.R2_ENDPOINT!,
  ACCESS_KEY: process.env.R2_ACCESS_KEY!,
  SECRET_KEY: process.env.R2_SECRET_KEY!,
  BUCKET: process.env.R2_BUCKET!,
  PUBLIC_URL: process.env.R2_PUBLIC_URL!,
} as const;

/** Build a public URL for an object stored in R2. */
export function getR2PublicUrl(key: string): string {
  return `${R2_CONFIG.PUBLIC_URL}/${key}`;
}
