import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { storageService } from "@/lib/storage/storage.service";

/* ============================================
   Health Check API Route
   /api/health
   Verifies: Database, Storage, Auth config.
   ============================================ */

export async function GET() {
  const checks = {
    database: false,
    storage: false,
    auth: false,
    timestamp: new Date().toISOString(),
  };

  const errors: string[] = [];

  // 1. Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (err) {
    errors.push(`Database: ${err instanceof Error ? err.message : "connection failed"}`);
  }

  // 2. Storage check (just verify config exists, don't make network call)
  try {
    if (storageService.bucket) {
      checks.storage = true;
    } else {
      errors.push("Storage: no bucket configured");
    }
  } catch (err) {
    errors.push(`Storage: ${err instanceof Error ? err.message : "config error"}`);
  }

  // 3. Auth check (verify AUTH_SECRET is set)
  try {
    const secret = process.env.AUTH_SECRET;
    if (secret && secret.length > 0) {
      checks.auth = true;
    } else {
      errors.push("Auth: AUTH_SECRET not set");
    }
  } catch {
    errors.push("Auth: configuration error");
  }

  const isHealthy = checks.database && checks.storage && checks.auth;

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "unhealthy",
      checks,
      errors: errors.length > 0 ? errors : undefined,
    },
    { status: isHealthy ? 200 : 503 }
  );
}
