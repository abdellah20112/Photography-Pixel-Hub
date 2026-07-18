import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma v7 does not automatically load .env.local.
// Load it explicitly — .env.local takes priority over .env.
config({ path: ".env.local" });

// For migrations (prisma migrate), use the DIRECT_URL (port 5432, no PgBouncer).
// For runtime (PrismaClient), use DATABASE_URL (port 6543, pooled).
// Prisma v7 migrate commands use the datasource.url from this config.
const isMigrateCommand = process.argv.some((arg) => arg.includes("migrate"));

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use DIRECT_URL for migrations (no PgBouncer, port 5432)
    // Use DATABASE_URL for everything else (pooled, port 6543)
    url: (isMigrateCommand ? process.env.DIRECT_URL : process.env.DATABASE_URL) ?? "",
  },
});
