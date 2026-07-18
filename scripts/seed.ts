import { PrismaClient, UserRole, ProjectStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

/* ============================================
   Prisma Seed Script
   Creates: Owner user → Demo client → Demo project
   ============================================ */

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...\n");

  const hashedPassword = await bcrypt.hash("Owner@123", 12);

  // 1. Create owner user
  const owner = await prisma.user.upsert({
    where: { email: "owner@pixelpixel.hub" },
    update: {
      password: hashedPassword,
      role: UserRole.OWNER,
    },
    create: {
      email: "owner@pixelpixel.hub",
      name: "Owner",
      password: hashedPassword,
      role: UserRole.OWNER,
    },
  });
  console.log(`  ✓ Owner user: ${owner.email} (${owner.id})`);

  // 2. Create demo client
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

  // 3. Create demo project
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
