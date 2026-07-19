-- Migration: add_supabase_uid
-- Replaces bcrypt-based password column with Supabase Auth integration.
-- The `password` column is dropped and `supabaseUid` is added to link
-- Prisma User profiles to Supabase Auth users.
--
-- NOTE: This migration was applied to the database via `prisma db push`
-- before this file was created. It is recorded here for fresh deployments
-- and migration history consistency.

-- AddColumn: supabaseUid
ALTER TABLE "users" ADD COLUMN "supabaseUid" UUID;

-- DropIndex: remove old password column (was NOT NULL, no longer needed)
ALTER TABLE "users" DROP COLUMN "password";

-- CreateIndex: unique constraint on supabaseUid
CREATE UNIQUE INDEX "users_supabaseUid_key" ON "users"("supabaseUid");

-- CreateIndex: index for fast lookups by supabaseUid
CREATE INDEX "users_supabaseUid_idx" ON "users"("supabaseUid");
