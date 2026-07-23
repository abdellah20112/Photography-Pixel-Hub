import { projectFileRepository } from "@/repositories/project-file.repository";
import { storageService } from "@/lib/storage/storage.service";
import { buildStorageKey } from "@/lib/storage/keys";
import { validateFile, getExtension, getMimeType } from "@/lib/storage/validation";
import { activityService } from "@/services/activity.service";
import type { ProjectFileType } from "@prisma/client";

/* ============================================
   ProjectFile Service
   Business logic: upload, list, delete, replace.
   Uses storageService for R2 operations.
   ============================================ */

export const projectFileService = {
  async getById(id: string) {
    return projectFileRepository.findById(id);
  },

  async listByProject(projectId: string) {
    return projectFileRepository.findByProject(projectId);
  },

  async upload(data: {
    projectId: string;
    projectCode: string;
    fileType: ProjectFileType;
    fileName: string;
    fileBuffer: Buffer;
    mimeType: string;
    fileSize: number;
    uploadedBy?: string;
    subfolder?: "assets" | "music" | "invoices" | "contracts" | null;
  }) {
    // Validate file
    const validation = validateFile(
      { name: data.fileName, size: data.fileSize },
      ["VIDEO", "IMAGE", "AUDIO", "DOCUMENT", "SPREADSHEET"],
    );
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Generate structured storage key
    const storageKey = buildStorageKey({
      projectCode: data.projectCode,
      fileName: data.fileName,
      subfolder: data.subfolder,
    });

    // Upload to R2
    await storageService.upload({
      key: storageKey,
      body: data.fileBuffer,
      contentType: data.mimeType,
      metadata: {
        "original-filename": data.fileName,
        "project-code": data.projectCode,
        "file-type": data.fileType,
      },
    });

    // Save DB record
    const file = await projectFileRepository.create({
      projectId: data.projectId,
      fileType: data.fileType,
      storageKey,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      uploadedBy: data.uploadedBy ?? null,
    });

    // Activity log
    if (data.uploadedBy) {
      await activityService.log({
        userId: data.uploadedBy,
        type: "UPLOAD",
        entity: "project_file",
        entityId: file.id,
        metadata: { fileName: data.fileName, fileType: data.fileType, projectId: data.projectId },
      }).catch(() => {});
    }

    return file;
  },

  async delete(id: string) {
    const file = await projectFileRepository.findById(id);
    if (!file) throw new Error("الملف غير موجود");

    // Delete from R2
    try {
      await storageService.delete(file.storageKey);
    } catch {
      // File may already be gone — continue with DB deletion
    }

    // Delete DB record
    await projectFileRepository.delete(id);
    return { success: true };
  },

  async replace(id: string, data: {
    fileName: string;
    fileBuffer: Buffer;
    mimeType: string;
    fileSize: number;
    uploadedBy?: string;
  }) {
    const existing = await projectFileRepository.findById(id);
    if (!existing) throw new Error("الملف غير موجود");

    // Delete old file from R2
    try {
      await storageService.delete(existing.storageKey);
    } catch {
      // Old file may not exist — continue
    }

    // Generate new storage key
    const storageKey = buildStorageKey({
      projectCode: existing.project.projectCode,
      fileName: data.fileName,
    });

    // Upload new file to R2
    await storageService.upload({
      key: storageKey,
      body: data.fileBuffer,
      contentType: data.mimeType,
      metadata: {
        "original-filename": data.fileName,
        "project-code": existing.project.projectCode,
        "file-type": existing.fileType,
        "replaced-from": existing.fileName,
      },
    });

    // Update DB record
    const updated = await projectFileRepository.update(id, {
      storageKey,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      uploadedBy: data.uploadedBy ?? null,
    });

    return updated;
  },

  /** Generate a signed download URL for a file. */
  async getDownloadUrl(id: string, expiresIn?: number) {
    const file = await projectFileRepository.findById(id);
    if (!file) throw new Error("الملف غير موجود");

    return storageService.getDownloadUrl(file.storageKey, { expiresIn });
  },

  /** Generate a signed streaming URL for a video file. */
  async getStreamingUrl(id: string, expiresIn?: number) {
    const file = await projectFileRepository.findById(id);
    if (!file) throw new Error("الملف غير موجود");

    return storageService.getStreamingUrl(file.storageKey, { expiresIn });
  },

  /** Generate a presigned upload URL for direct browser-to-R2 upload. */
  async generatePresignedUploadUrl(data: {
    projectCode: string;
    fileName: string;
    mimeType: string;
    subfolder?: "assets" | "music" | "invoices" | "contracts" | null;
  }) {
    const storageKey = buildStorageKey({
      projectCode: data.projectCode,
      fileName: data.fileName,
      subfolder: data.subfolder,
    });

    const uploadUrl = await storageService.generateUploadUrl(
      storageKey,
      data.mimeType,
    );

    return { uploadUrl, storageKey };
  },
};
