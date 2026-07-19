import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient, UserRole, ProjectStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/* ============================================
   Prisma Seed Script
   Creates: Owner user (Supabase Auth + Prisma)
            → Demo client → Demo project
   ============================================ */

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...\n");

  const supabaseAdmin = createSupabaseAdminClient();

  // 1. Create owner user in Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin
    .createUser({
      email: "owner@pixelpixel.hub",
      password: "Owner@123",
      email_confirm: true,
      user_metadata: { name: "Owner", role: "OWNER" },
    });

  let supabaseUid: string;

  if (authError) {
    // User might already exist in Supabase Auth — try to find by email
    const { data: existingUser, error: lookupError } = await supabaseAdmin.auth
      .admin.listUsers();

    if (lookupError) {
      throw new Error(`Failed to create or find Supabase Auth user: ${authError.message}`);
    }

    const found = existingUser.users.find((u) => u.email === "owner@pixelpixel.hub");
    if (!found) {
      throw new Error(`Failed to create Supabase Auth user: ${authError.message}`);
    }
    supabaseUid = found.id;
    console.log("  ℹ Owner already exists in Supabase Auth");
  } else {
    supabaseUid = authData.user.id;
    console.log("  ✓ Owner created in Supabase Auth");
  }

  // 2. Upsert Prisma profile
  const owner = await prisma.user.upsert({
    where: { email: "owner@pixelpixel.hub" },
    update: {
      supabaseUid,
      role: UserRole.OWNER,
    },
    create: {
      email: "owner@pixelpixel.hub",
      name: "Owner",
      supabaseUid,
      role: UserRole.OWNER,
    },
  });
  console.log(`  ✓ Owner profile: ${owner.email} (${owner.id})`);

  // 3. Create demo client
  const client = await prisma.client.upsert({
    where: { token: "demo-client-token-00000000" },
    update: {},
    create: {
      userId: owner.id,
      clientCode: "CL-000001",
      name: "Demo Client",
      email: "demo@example.com",
      phone: "0500000000",
      token: "demo-client-token-00000000",
      status: "ACTIVE",
    },
  });
  console.log(`  ✓ Demo client: ${client.email} (${client.id})`);

  // 4. Create demo project
  const project = await prisma.project.upsert({
    where: { token: "demo-project-token-00000000" },
    update: {},
    create: {
      clientId: client.id,
      projectCode: "PR-000001",
      name: "Demo Project",
      description: "مشروع تجريبي للعرض",
      status: ProjectStatus.DRAFT,
      retentionPeriod: "TWENTY_FOUR_HOURS",
      deadline: new Date("2026-12-31"),
      token: "demo-project-token-00000000",
    },
  });
  console.log(`  ✓ Demo project: ${project.name} (${project.id})`);

  console.log("\n✅ Seed completed successfully!");
  console.log(`\n📋 Login credentials:`);
  console.log(`   Email:    owner@pixelpixel.hub`);
  console.log(`   Password: Owner@123`);
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
