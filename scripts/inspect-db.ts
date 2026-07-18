import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
  const prisma = new PrismaClient({ adapter });

  // 1. Check all tables
  const tables = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;
  console.log("=== TABLES IN DATABASE ===");
  console.log(JSON.stringify(tables, null, 2));

  // 2. Check if _prisma_migrations table exists
  const migrationsTable = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = '_prisma_migrations'
  `;
  console.log("=== _prisma_migrations TABLE ===");
  console.log(migrationsTable.length > 0 ? "EXISTS" : "DOES NOT EXIST");

  // 3. Check for any rows in _prisma_migrations
  if (migrationsTable.length > 0) {
    const rows = await prisma.$queryRaw`SELECT * FROM _prisma_migrations`;
    console.log("=== MIGRATION RECORDS ===");
    console.log(JSON.stringify(rows, null, 2));
  }

  // 4. Check enum types
  const enums = await prisma.$queryRaw`
    SELECT t.typname 
    FROM pg_type t 
    JOIN pg_namespace n ON t.typnamespace = n.oid 
    WHERE n.nspname = 'public' AND t.typtype = 'e'
    ORDER BY t.typname
  `;
  console.log("=== ENUM TYPES ===");
  console.log(JSON.stringify(enums, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
