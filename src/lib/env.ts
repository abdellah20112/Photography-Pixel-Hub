import { z } from "zod";

/* ============================================
   Environment Variable Validation
   Fail immediately if any required variable
   is missing on the server.
   ============================================ */

const envSchema = z.object({
  /* ── Database ───────────────────────────── */
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL is required"),

  /* ── Supabase ───────────────────────────── */
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL")
    .min(1, "NEXT_PUBLIC_SUPABASE_URL is required"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),

  /* ── Cloudflare R2 ──────────────────────── */
  R2_ENDPOINT: z
    .string()
    .url("R2_ENDPOINT must be a valid URL")
    .min(1, "R2_ENDPOINT is required"),
  R2_ACCESS_KEY: z.string().min(1, "R2_ACCESS_KEY is required"),
  R2_SECRET_KEY: z.string().min(1, "R2_SECRET_KEY is required"),
  R2_BUCKET: z.string().min(1, "R2_BUCKET is required"),
  R2_PUBLIC_URL: z
    .string()
    .url("R2_PUBLIC_URL must be a valid URL")
    .min(1, "R2_PUBLIC_URL is required"),

  /* ── App (public) ───────────────────────── */
  NEXT_PUBLIC_APP_NAME: z.string().default("Photography Pixel Hub"),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL")
    .default("http://localhost:3000"),

  /* ── Auth ──────────────────────────────── */
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),

  /* ── Node Env ──────────────────────────── */
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables.
 * Throws immediately if any required variable is missing or invalid.
 *
 * This function is server-only — never import from client components.
 */
function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.issues
      .map((issue) => `  ✗ ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `\n❌ Invalid environment variables:\n${errors}\n\n` +
        `Please check your .env file and ensure all required variables are set.\n`
    );
  }

  return parsed.data;
}

export const env = loadEnv();
