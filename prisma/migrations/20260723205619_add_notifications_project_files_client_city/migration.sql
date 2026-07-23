-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('VIDEO', 'PHOTOGRAPHY', 'BOTH', 'EDITING');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PROJECT_CREATED', 'MODEL_ASSIGNED', 'UPLOAD_FINISHED', 'CLIENT_COMMENTED', 'CLIENT_APPROVED', 'CHANGES_REQUESTED', 'DOWNLOAD_ENABLED', 'DOWNLOAD_COMPLETED', 'PROJECT_COMPLETED', 'STATUS_CHANGED');

-- CreateEnum
CREATE TYPE "ProjectFileType" AS ENUM ('PREVIEW_VIDEO', 'FINAL_VIDEO', 'THUMBNAIL', 'ASSET', 'MUSIC', 'LOGO', 'DOCUMENT', 'INVOICE', 'CONTRACT');

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "city" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "downloads" ADD COLUMN     "browser" TEXT,
ADD COLUMN     "device" TEXT;

-- AlterTable
ALTER TABLE "models" ADD COLUMN     "availability" TEXT;

-- AlterTable
ALTER TABLE "project_models" ADD COLUMN     "script" TEXT;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "brandName" TEXT,
ADD COLUMN     "price" DOUBLE PRECISION,
ADD COLUMN     "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "serviceType" "ServiceType",
ADD COLUMN     "shootingDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_files" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "fileType" "ProjectFileType" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "mimeType" TEXT NOT NULL DEFAULT '',
    "uploadedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "project_files_projectId_idx" ON "project_files"("projectId");

-- CreateIndex
CREATE INDEX "project_files_fileType_idx" ON "project_files"("fileType");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_files" ADD CONSTRAINT "project_files_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
