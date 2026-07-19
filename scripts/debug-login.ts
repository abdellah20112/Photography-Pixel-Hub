import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  // 1. Check Supabase Auth users
  console.log("=== Supabase Auth Users ===");
  const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.log("Error listing users:", listError.message);
  } else {
    for (const u of authUsers.users) {
      console.log(`  email: ${u.email}`);
      console.log(`  uid:   ${u.id}`);
      console.log(`  confirmed: ${u.email_confirmed_at ? "yes" : "no"}`);
      console.log("---");
    }
  }

  // 2. Check Prisma users
  console.log("\n=== Prisma Users ===");
  const prismaUsers = await prisma.user.findMany();
  for (const u of prismaUsers) {
    console.log(`  id:          ${u.id}`);
    console.log(`  email:       ${u.email}`);
    console.log(`  name:        ${u.name}`);
    console.log(`  supabaseUid: ${u.supabaseUid}`);
    console.log(`  role:        ${u.role}`);
    console.log("---");
  }

  // 3. Test login via Supabase Auth API (same as signInWithPassword)
  console.log("\n=== Supabase Auth Login Test ===");
  const { data: loginData, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
    email: "abdellahafkhar6@gmail.com",
    password: "Abdellah2002@@",
  });

  if (loginError) {
    console.log("Login error:", loginError.message);
    console.log("Login error code:", loginError.code);
  } else {
    console.log("Login success! User ID:", loginData.user.id);

    // 4. Try Prisma lookup by supabaseUid (exactly what the app does)
    console.log("\n=== Prisma Lookup by supabaseUid ===");
    console.log("Looking for supabaseUid:", loginData.user.id);
    const prismaUser = await prisma.user.findUnique({
      where: { supabaseUid: loginData.user.id },
    });

    if (prismaUser) {
      console.log("Found!:", prismaUser.email, prismaUser.role);
    } else {
      console.log("NOT FOUND — this is the bug!");
      console.log("Supabase UID from auth:", loginData.user.id);
      console.log("Type:", typeof loginData.user.id);

      // Check all users to see what's stored
      const allUsers = await prisma.user.findMany();
      console.log("\nAll Prisma users' supabaseUid values:");
      for (const u of allUsers) {
        console.log(`  email: ${u.email}  supabaseUid: '${u.supabaseUid}'  match: ${u.supabaseUid === loginData.user.id}`);
      }
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
