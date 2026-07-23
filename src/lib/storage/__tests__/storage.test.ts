import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── Mock AWS SDK ────────────────────────── */

const mockSend = vi.fn();

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn().mockImplementation(function (this: any) { this.send = mockSend; return this; }),
  PutObjectCommand: vi.fn(function (this: any) { return this; }),
  GetObjectCommand: vi.fn(function (this: any) { return this; }),
  DeleteObjectCommand: vi.fn(function (this: any) { return this; }),
  HeadObjectCommand: vi.fn(function (this: any) { return this; }),
  CopyObjectCommand: vi.fn(function (this: any) { return this; }),
  ListObjectsV2Command: vi.fn(function (this: any) { return this; }),
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(async () => "https://presigned-url.example.com"),
}));

vi.mock("@/lib/storage/config", () => ({
  STORAGE_CONFIG: {
    PROVIDER: "cloudflare-r2",
    BUCKET: "pixelhub-storage",
    ENDPOINT: "https://r2.example.com",
    ACCOUNT_ID: "test-account-id",
    CREDENTIALS: { accessKeyId: "test-key", secretAccessKey: "test-secret" },
    SIGNED_URL_EXPIRATION: {
      DOWNLOAD: 3600,
      STREAMING: 7200,
      UPLOAD: 600,
    },
    LIMITS: {
      MAX_FILE_SIZE: 500 * 1024 * 1024,
      MAX_VIDEO_DURATION_SECONDS: 300,
      ALLOWED_VIDEO_FORMATS: ["mp4", "webm", "mov"],
      ALLOWED_MIME_TYPES: ["video/mp4", "video/quicktime", "video/webm"],
    },
  },
}));

/* ── Imports (after mocks) ──────────────── */

import { CloudflareR2Provider } from "@/lib/storage/cloudflare-r2.provider";
import { storageService } from "@/lib/storage/storage.service";
import type { StorageProvider } from "@/lib/storage/provider";

/* ============================================
   Provider Interface Tests
   Verify StorageProvider contract compliance.
   ============================================ */

describe("StorageProvider Interface", () => {
  it("CloudflareR2Provider implements all required methods", () => {
    const provider: StorageProvider = new CloudflareR2Provider();

    expect(provider.name).toBe("cloudflare-r2");
    expect(provider.bucket).toBe("pixelhub-storage");
    expect(typeof provider.upload).toBe("function");
    expect(typeof provider.replace).toBe("function");
    expect(typeof provider.delete).toBe("function");
    expect(typeof provider.moveFile).toBe("function");
    expect(typeof provider.copyFile).toBe("function");
    expect(typeof provider.listFiles).toBe("function");
    expect(typeof provider.exists).toBe("function");
    expect(typeof provider.getMetadata).toBe("function");
    expect(typeof provider.getSignedUrl).toBe("function");
    expect(typeof provider.getDownloadUrl).toBe("function");
    expect(typeof provider.getStreamingUrl).toBe("function");
    expect(typeof provider.generateUploadUrl).toBe("function");
  });
});

/* ============================================
   CloudflareR2Provider Tests
   ============================================ */

describe("CloudflareR2Provider", () => {
  let provider: CloudflareR2Provider;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({});
    provider = new CloudflareR2Provider();
  });

  describe("upload", () => {
    it("uploads a file and returns the key", async () => {
      const key = await provider.upload({
        key: "projects/PR-000001/preview.mp4",
        body: Buffer.from("test"),
        contentType: "video/mp4",
        metadata: { "original-filename": "preview.mp4" },
      });

      expect(key).toBe("projects/PR-000001/preview.mp4");
      expect(mockSend).toHaveBeenCalled();
    });

    it("throws UploadFailedError on permission denied", async () => {
      mockSend.mockRejectedValueOnce(new Error("AccessDenied"));

      await expect(
        provider.upload({
          key: "test-key",
          body: Buffer.from("test"),
          contentType: "video/mp4",
        }),
      ).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("deletes a file from storage", async () => {
      await provider.delete("projects/PR-000001/preview.mp4");
      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe("replace", () => {
    it("deletes old key and uploads new file", async () => {
      const newKey = await provider.replace("old-key", {
        key: "new-key",
        body: Buffer.from("test"),
        contentType: "video/mp4",
      });

      expect(newKey).toBe("new-key");
      expect(mockSend).toHaveBeenCalledTimes(2);
    });
  });

  describe("moveFile", () => {
    it("copies then deletes the source", async () => {
      const result = await provider.moveFile("source-key", "dest-key");

      expect(result).toBe("dest-key");
      expect(mockSend).toHaveBeenCalledTimes(2);
    });
  });

  describe("copyFile", () => {
    it("copies a file to a new key", async () => {
      const result = await provider.copyFile("source-key", "dest-key");

      expect(result).toBe("dest-key");
      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe("listFiles", () => {
    it("lists files with prefix", async () => {
      mockSend.mockResolvedValueOnce({
        Contents: [
          { Key: "projects/PR-000001/preview.mp4", Size: 1000, LastModified: new Date(), ETag: '"abc"' },
        ],
        IsTruncated: false,
      });

      const result = await provider.listFiles({ prefix: "projects/PR-000001/" });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.key).toBe("projects/PR-000001/preview.mp4");
      expect(result.isTruncated).toBe(false);
    });
  });

  describe("exists", () => {
    it("returns true when object exists", async () => {
      const exists = await provider.exists("test-key");
      expect(exists).toBe(true);
    });

    it("returns false when object does not exist", async () => {
      mockSend.mockRejectedValueOnce(new Error("NotFound"));
      const exists = await provider.exists("nonexistent-key");
      expect(exists).toBe(false);
    });
  });

  describe("getMetadata", () => {
    it("returns file metadata", async () => {
      mockSend.mockResolvedValueOnce({
        ContentLength: 1024,
        ContentType: "video/mp4",
        LastModified: new Date("2025-01-01"),
        ETag: '"abc123"',
        Metadata: { "original-filename": "test.mp4" },
      });

      const meta = await provider.getMetadata("test-key");

      expect(meta.key).toBe("test-key");
      expect(meta.size).toBe(1024);
      expect(meta.contentType).toBe("video/mp4");
      expect(meta.etag).toBe("abc123");
    });
  });

  describe("getSignedUrl", () => {
    it("generates a signed URL with default expiration", async () => {
      const url = await provider.getSignedUrl("test-key");
      expect(url).toBe("https://presigned-url.example.com");
    });

    it("accepts custom expiration", async () => {
      await provider.getSignedUrl("test-key", { expiresIn: 1800 });

      const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 1800 },
      );
    });
  });

  describe("getDownloadUrl", () => {
    it("generates a download URL with download expiration", async () => {
      const url = await provider.getDownloadUrl("test-key");
      expect(url).toBe("https://presigned-url.example.com");
    });
  });

  describe("getStreamingUrl", () => {
    it("generates a streaming URL with streaming expiration", async () => {
      const url = await provider.getStreamingUrl("test-key");
      expect(url).toBe("https://presigned-url.example.com");
    });
  });

  describe("generateUploadUrl", () => {
    it("generates a presigned upload URL", async () => {
      const url = await provider.generateUploadUrl("test-key", "video/mp4");
      expect(url).toBe("https://presigned-url.example.com");
    });
  });
});

/* ============================================
   StorageService Tests
   Verifies DI and delegation behavior.
   ============================================ */

describe("StorageService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({});
  });

  it("exposes provider name", () => {
    expect(storageService.name).toBe("cloudflare-r2");
  });

  it("exposes bucket name", () => {
    expect(storageService.bucket).toBe("pixelhub-storage");
  });

  it("delegates upload to provider", async () => {
    const key = await storageService.upload({
      key: "test-key",
      body: Buffer.from("data"),
      contentType: "video/mp4",
    });

    expect(key).toBe("test-key");
    expect(mockSend).toHaveBeenCalled();
  });

  it("delegates delete to provider", async () => {
    await storageService.delete("test-key");
    expect(mockSend).toHaveBeenCalled();
  });

  it("delegates exists to provider", async () => {
    const exists = await storageService.exists("test-key");
    expect(exists).toBe(true);
  });

  it("delegates getDownloadUrl to provider", async () => {
    const url = await storageService.getDownloadUrl("test-key");
    expect(url).toBe("https://presigned-url.example.com");
  });

  it("delegates getStreamingUrl to provider", async () => {
    const url = await storageService.getStreamingUrl("test-key");
    expect(url).toBe("https://presigned-url.example.com");
  });

  it("delegates generateUploadUrl to provider", async () => {
    const url = await storageService.generateUploadUrl("test-key", "video/mp4");
    expect(url).toBe("https://presigned-url.example.com");
  });

  it("delegates moveFile to provider", async () => {
    const key = await storageService.moveFile("src", "dst");
    expect(key).toBe("dst");
  });

  it("delegates copyFile to provider", async () => {
    const key = await storageService.copyFile("src", "dst");
    expect(key).toBe("dst");
  });

  it("delegates listFiles to provider", async () => {
    mockSend.mockResolvedValueOnce({ Contents: [], IsTruncated: false });
    const result = await storageService.listFiles({ prefix: "projects/" });
    expect(result.items).toEqual([]);
  });

  it("delegates getMetadata to provider", async () => {
    mockSend.mockResolvedValueOnce({
      ContentLength: 0,
      ContentType: null,
      LastModified: null,
      ETag: null,
      Metadata: {},
    });
    const meta = await storageService.getMetadata("test-key");
    expect(meta.key).toBe("test-key");
  });
});

/* ============================================
   Storage Config Tests
   ============================================ */

describe("StorageConfig", () => {
  it("exports centralized configuration", async () => {
    const { STORAGE_CONFIG } = await import("@/lib/storage/config");

    expect(STORAGE_CONFIG.PROVIDER).toBe("cloudflare-r2");
    expect(STORAGE_CONFIG.BUCKET).toBe("pixelhub-storage");
    expect(STORAGE_CONFIG.ACCOUNT_ID).toBe("test-account-id");
    expect(STORAGE_CONFIG.SIGNED_URL_EXPIRATION.DOWNLOAD).toBe(3600);
    expect(STORAGE_CONFIG.SIGNED_URL_EXPIRATION.STREAMING).toBe(7200);
    expect(STORAGE_CONFIG.SIGNED_URL_EXPIRATION.UPLOAD).toBe(600);
    expect(STORAGE_CONFIG.LIMITS.MAX_FILE_SIZE).toBe(500 * 1024 * 1024);
    expect(STORAGE_CONFIG.LIMITS.ALLOWED_MIME_TYPES).toContain("video/mp4");
  });
});

/* ============================================
   Storage Key Builder Tests
   ============================================ */

describe("Storage Key Builder", () => {
  it("builds project file key with subfolder", async () => {
    const { buildStorageKey } = await import("@/lib/storage/keys");
    const key = buildStorageKey({
      projectCode: "PR-000001",
      fileName: "asset.mp4",
      subfolder: "assets",
    });
    expect(key).toMatch(/^projects\/PR-000001\/assets\/[a-f0-9-]+\.mp4$/);
  });

  it("builds project file key without subfolder", async () => {
    const { buildStorageKey } = await import("@/lib/storage/keys");
    const key = buildStorageKey({
      projectCode: "PR-000001",
      fileName: "file.pdf",
    });
    expect(key).toMatch(/^projects\/PR-000001\/[a-f0-9-]+\.pdf$/);
  });

  it("builds preview key", async () => {
    const { buildPreviewKey } = await import("@/lib/storage/keys");
    expect(buildPreviewKey("PR-000001")).toBe("projects/PR-000001/preview.mp4");
  });

  it("builds final key", async () => {
    const { buildFinalKey } = await import("@/lib/storage/keys");
    expect(buildFinalKey("PR-000001")).toBe("projects/PR-000001/final.mp4");
  });

  it("builds thumbnail key", async () => {
    const { buildThumbnailKey } = await import("@/lib/storage/keys");
    expect(buildThumbnailKey("PR-000001")).toBe("projects/PR-000001/thumbnail.jpg");
  });

  it("builds project prefix for listing", async () => {
    const { buildProjectPrefix } = await import("@/lib/storage/keys");
    expect(buildProjectPrefix("PR-000001")).toBe("projects/PR-000001/");
  });

  it("extracts project code from key", async () => {
    const { extractProjectCode } = await import("@/lib/storage/keys");
    expect(extractProjectCode("projects/PR-000001/preview.mp4")).toBe("PR-000001");
    expect(extractProjectCode("videos/proj/file.mp4")).toBeNull();
  });

  it("identifies preview keys", async () => {
    const { isPreviewKey } = await import("@/lib/storage/keys");
    expect(isPreviewKey("projects/PR-000001/preview.mp4")).toBe(true);
    expect(isPreviewKey("projects/PR-000001/final.mp4")).toBe(false);
  });

  it("identifies final keys", async () => {
    const { isFinalKey } = await import("@/lib/storage/keys");
    expect(isFinalKey("projects/PR-000001/final.mp4")).toBe(true);
    expect(isFinalKey("projects/PR-000001/preview.mp4")).toBe(false);
  });
});

/* ============================================
   File Validation Tests
   ============================================ */

describe("File Validation", () => {
  it("accepts valid mp4 file", async () => {
    const { validateVideoFile } = await import("@/lib/storage/validation");
    const result = validateVideoFile({ name: "test.mp4", size: 1024 * 1024, type: "video/mp4" });
    expect(result.valid).toBe(true);
  });

  it("rejects invalid extension", async () => {
    const { validateVideoFile } = await import("@/lib/storage/validation");
    const result = validateVideoFile({ name: "test.avi", size: 1024, type: "video/x-msvideo" });
    expect(result.valid).toBe(false);
  });

  it("rejects oversized file", async () => {
    const { validateVideoFile } = await import("@/lib/storage/validation");
    const result = validateVideoFile({
      name: "test.mp4",
      size: 501 * 1024 * 1024,
      type: "video/mp4",
    });
    expect(result.valid).toBe(false);
  });

  it("rejects empty file", async () => {
    const { validateVideoFile } = await import("@/lib/storage/validation");
    const result = validateVideoFile({ name: "test.mp4", size: 0, type: "video/mp4" });
    expect(result.valid).toBe(false);
  });

  it("validates general files by category", async () => {
    const { validateFile } = await import("@/lib/storage/validation");
    const result = validateFile({ name: "doc.pdf", size: 1024 }, ["DOCUMENT"]);
    expect(result.valid).toBe(true);
  });

  it("rejects file outside allowed categories", async () => {
    const { validateFile } = await import("@/lib/storage/validation");
    const result = validateFile({ name: "script.exe", size: 1024 }, ["DOCUMENT"]);
    expect(result.valid).toBe(false);
  });
});

/* ============================================
   Storage Error Tests
   ============================================ */

describe("Storage Errors", () => {
  it("creates BucketNotFoundError", async () => {
    const { BucketNotFoundError } = await import("@/lib/storage/errors");
    const err = new BucketNotFoundError("test-bucket");
    expect(err.code).toBe("BUCKET_NOT_FOUND");
    expect(err.statusCode).toBe(404);
  });

  it("creates FileNotExistsError", async () => {
    const { FileNotExistsError } = await import("@/lib/storage/errors");
    const err = new FileNotExistsError("test-key");
    expect(err.code).toBe("FILE_NOT_EXISTS");
    expect(err.message).toContain("test-key");
  });

  it("maps unknown SDK errors to StorageError", async () => {
    const { mapStorageError } = await import("@/lib/storage/errors");
    const err = mapStorageError(new Error("Something went wrong"));
    expect(err).toBeInstanceOf(Error);
  });
});

/* ============================================
   Video Metadata Utilities Tests
   ============================================ */

describe("Video Metadata Utilities", () => {
  describe("getExtension", () => {
    it("extracts extension from filename", async () => {
      const { getExtension } = await import("@/lib/video/metadata");
      expect(getExtension("video.mp4")).toBe("mp4");
      expect(getExtension("video.MOV")).toBe("mov");
      expect(getExtension("archive.tar.gz")).toBe("gz");
    });

    it("returns empty string for no extension", async () => {
      const { getExtension } = await import("@/lib/video/metadata");
      expect(getExtension("noextension")).toBe("");
    });
  });

  describe("getMimeType", () => {
    it("returns file.type if present", async () => {
      const { getMimeType } = await import("@/lib/video/metadata");
      const file = { name: "test.mp4", type: "video/mp4", size: 0 } as File;
      expect(getMimeType(file)).toBe("video/mp4");
    });

    it("detects from extension when type is empty", async () => {
      const { getMimeType } = await import("@/lib/video/metadata");
      const file = { name: "test.webm", type: "", size: 0 } as File;
      expect(getMimeType(file)).toBe("video/webm");
    });
  });

  describe("generateStorageKey", () => {
    it("generates key with projectId and uuid", async () => {
      const { generateStorageKey } = await import("@/lib/video/metadata");
      const key = generateStorageKey("project-1", "video.mp4");
      expect(key).toMatch(/^videos\/project-1\/[a-f0-9-]+\.mp4$/);
    });
  });

  describe("generateThumbnailKey", () => {
    it("replaces videos/ with thumbnails/ and extension with .jpg", async () => {
      const { generateThumbnailKey } = await import("@/lib/video/metadata");
      expect(generateThumbnailKey("videos/proj/uuid.mp4")).toBe("thumbnails/proj/uuid.jpg");
    });
  });

  describe("validateVideoFile", () => {
    it("accepts valid mp4 file", async () => {
      const { validateVideoFile } = await import("@/lib/video/metadata");
      const file = { name: "test.mp4", size: 1024 * 1024, type: "video/mp4" } as File;
      const result = validateVideoFile(file);
      expect(result.valid).toBe(true);
    });

    it("rejects invalid extension", async () => {
      const { validateVideoFile } = await import("@/lib/video/metadata");
      const file = { name: "test.avi", size: 1024, type: "video/x-msvideo" } as File;
      const result = validateVideoFile(file);
      expect(result.valid).toBe(false);
    });

    it("rejects oversized file", async () => {
      const { validateVideoFile } = await import("@/lib/video/metadata");
      const file = { name: "test.mp4", size: 501 * 1024 * 1024, type: "video/mp4" } as File;
      const result = validateVideoFile(file);
      expect(result.valid).toBe(false);
    });

    it("rejects empty file", async () => {
      const { validateVideoFile } = await import("@/lib/video/metadata");
      const file = { name: "test.mp4", size: 0, type: "video/mp4" } as File;
      const result = validateVideoFile(file);
      expect(result.valid).toBe(false);
    });
  });
});
