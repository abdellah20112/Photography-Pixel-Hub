#!/usr/bin/env node
/**
 * Apply CORS policy to Cloudflare R2 bucket.
 *
 * Requires: CLOUDFLARE_API_TOKEN environment variable.
 * Create one at: https://dash.cloudflare.com/profile/api-tokens
 *   → Create Token → "Cloudflare API Token" → Custom token:
 *     - Permissions: Account → R2 → Edit
 *     - Account Resources: Include → your account
 *
 * Usage:
 *   $env:CLOUDFLARE_API_TOKEN="your-token-here"
 *   node scripts/apply-r2-cors.mjs
 *
 * Or with Wrangler:
 *   $env:CLOUDFLARE_API_TOKEN="your-token-here"
 *   npx wrangler r2 bucket cors set pixelhub-storage --file scripts/r2-cors-policy.json --force
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const BUCKET_NAME = process.env.R2_BUCKET_NAME || "pixelhub-storage";
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!API_TOKEN) {
  console.error("ERROR: CLOUDFLARE_API_TOKEN environment variable is not set.");
  console.error("");
  console.error("Create a token at: https://dash.cloudflare.com/profile/api-tokens");
  console.error('  → Create Token → Custom token:');
  console.error("  → Permissions: Account → R2 → Edit");
  console.error("");
  console.error("Then run:");
  console.error('  $env:CLOUDFLARE_API_TOKEN="your-token-here"; node scripts/apply-r2-cors.mjs');
  process.exit(1);
}

if (!ACCOUNT_ID) {
  console.error("ERROR: R2_ACCOUNT_ID not found in .env.local");
  process.exit(1);
}

const corsPolicy = [
  {
    AllowedOrigins: ["*"],
    AllowedMethods: ["PUT", "GET", "HEAD"],
    AllowedHeaders: ["Content-Type"],
    ExposeHeaders: ["ETag", "Content-Length", "Content-Type"],
    MaxAgeSeconds: 86400,
  },
];

const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}/cors`;

console.log("=== Apply R2 CORS Policy ===");
console.log("Bucket:", BUCKET_NAME);
console.log("Account:", ACCOUNT_ID);
console.log("Policy:", JSON.stringify(corsPolicy, null, 2));
console.log("");

// Step 1: Apply CORS via Cloudflare API
console.log("[1/3] Applying CORS policy...");
const putResponse = await fetch(apiUrl, {
  method: "PUT",
  headers: {
    Authorization: `Bearer ${API_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(corsPolicy),
});

const putBody = await putResponse.json();

if (!putResponse.ok || !putBody.success) {
  console.error("  FAILED:", putResponse.status, putResponse.statusText);
  console.error("  Errors:", JSON.stringify(putBody.errors, null, 2));
  process.exit(1);
}

console.log("  ✅ CORS policy applied");
console.log("");

// Step 2: Verify by reading it back
console.log("[2/3] Verifying CORS policy...");
const getResponse = await fetch(apiUrl, {
  method: "GET",
  headers: { Authorization: `Bearer ${API_TOKEN}` },
});

const getBody = await getResponse.json();

if (getResponse.ok && getBody.success) {
  console.log("  ✅ Current CORS rules:");
  console.log(JSON.stringify(getBody.result, null, 2));
} else {
  console.error("  ⚠️ Could not read back CORS policy:", getResponse.status);
}
console.log("");

// Step 3: Test preflight (simulates browser)
console.log("[3/3] Testing CORS preflight (OPTIONS)...");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = await import("@aws-sdk/client-s3");
const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
const { randomUUID } = await import("crypto");

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const testKey = `videos/cors-verify-${randomUUID()}.mp4`;
const presignedUrl = await getSignedUrl(
  r2Client,
  new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: testKey,
    ContentType: "video/mp4",
  }),
  { expiresIn: 60 }
);

const optionsResponse = await fetch(presignedUrl, {
  method: "OPTIONS",
  headers: {
    Origin: "http://localhost:3000",
    "Access-Control-Request-Method": "PUT",
    "Access-Control-Request-Headers": "content-type",
  },
});

const corsOrigin = optionsResponse.headers.get("access-control-allow-origin");
const corsMethods = optionsResponse.headers.get("access-control-allow-methods");
const corsHeaders = optionsResponse.headers.get("access-control-allow-headers");

console.log("  OPTIONS Status:", optionsResponse.status);
console.log("  Access-Control-Allow-Origin:", corsOrigin || "❌ MISSING");
console.log("  Access-Control-Allow-Methods:", corsMethods || "❌ MISSING");
console.log("  Access-Control-Allow-Headers:", corsHeaders || "❌ MISSING");

if (corsOrigin && corsMethods && corsMethods.includes("PUT")) {
  console.log("\n  ✅ CORS is working — browser uploads to R2 will succeed");
} else {
  console.log("\n  ❌ CORS not working — check Cloudflare dashboard");
}

// Cleanup test file
try {
  await r2Client.send(
    new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: testKey })
  );
} catch {}

console.log("\n=== Done ===");
