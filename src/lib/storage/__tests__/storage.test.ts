import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── Mock AWS SDK ────────────────────────── */

const mockSend = vi.fn();

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn().mockImplementation(function (this: any) { this.send = mockSend; return this; }),
  PutObjectCommand: vi.fn(function (this: any) { return this; }),
  GetObjectCommand: vi.fn(function (this: any) { return this; }),
  DeleteObjectCommand: vi.fn(function (this: any) { return this; }),
  HeadObjectCommand: vi.fn(function (this: any) { return this; }),
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(async () => "https://presigned-url.example.com"),
}));

vi.mock("@/lib/storage/config", () => ({
  STORAGE_CONFIG: {
    PROVIDER: "cloudflare-r2",
    BUCKET: "test-bucket",
    ENDPOINT: "https://r2.example.com",
    CREDENTIALS: { accessKey: "test-key", secretKey: "test-secret" },
    PUBLIC_URL: "https://cdn.example.com",
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
  getPublicUrl: (key: string) => `https://cdn.example.com/${key}`,
}));

/* ── Imports (after mocks) ────────────────── */

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
    expect(provider.bucket).toBe("test-bucket");
    expect(typeof provider.upload).toBe("function");
    expect(typeof provider.replace).toBe("function");
    expect(typeof provider.delete).toBe("function");
    expect(typeof provider.exists).toBe("function");
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
        key: "videos/test/file.mp4",
        body: Buffer.from("test"),
        contentType: "video/mp4",
        metadata: { "original-filename": "file.mp4" },
      });

      expect(key).toBe("videos/test/file.mp4");
      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("deletes a file from storage", async () => {
      await provider.delete("videos/test/file.mp4");
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
        { expiresIn: 1800 }
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
    expect(storageService.bucket).toBe("test-bucket");
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
});

/* ============================================
   Storage Config Tests
   ============================================ */

describe("StorageConfig", () => {
  it("exports centralized configuration", async () => {
    const { STORAGE_CONFIG } = await import("@/lib/storage/config");

    expect(STORAGE_CONFIG.PROVIDER).toBe("cloudflare-r2");
    expect(STORAGE_CONFIG.BUCKET).toBe("test-bucket");
    expect(STORAGE_CONFIG.SIGNED_URL_EXPIRATION.DOWNLOAD).toBe(3600);
    expect(STORAGE_CONFIG.SIGNED_URL_EXPIRATION.STREAMING).toBe(7200);
    expect(STORAGE_CONFIG.SIGNED_URL_EXPIRATION.UPLOAD).toBe(600);
    expect(STORAGE_CONFIG.LIMITS.MAX_FILE_SIZE).toBe(500 * 1024 * 1024);
    expect(STORAGE_CONFIG.LIMITS.ALLOWED_MIME_TYPES).toContain("video/mp4");
  });

  it("getPublicUrl builds CDN URL", async () => {
    const { getPublicUrl } = await import("@/lib/storage/config");

    expect(getPublicUrl("test-key")).toBe("https://cdn.example.com/test-key");
  });
});

/* ============================================
   Video Metadata Utilities Tests
   (kept from previous sprint — unchanged)
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

  describe("formatResolution", () => {
    it("formats width and height", async () => {
      const { formatResolution } = await import("@/lib/video/metadata");
      expect(formatResolution(1920, 1080)).toBe("1920x1080");
    });

    it("returns dash for null values", async () => {
      const { formatResolution } = await import("@/lib/video/metadata");
      expect(formatResolution(null, null)).toBe("—");
      expect(formatResolution(1920, null)).toBe("—");
    });
  });

  describe("formatDuration", () => {
    it("formats seconds as M:SS", async () => {
      const { formatDuration } = await import("@/lib/video/metadata");
      expect(formatDuration(75)).toBe("1:15");
      expect(formatDuration(5)).toBe("0:05");
    });

    it("formats hours as H:MM:SS", async () => {
      const { formatDuration } = await import("@/lib/video/metadata");
      expect(formatDuration(3661)).toBe("1:01:01");
    });

    it("returns dash for null", async () => {
      const { formatDuration } = await import("@/lib/video/metadata");
      expect(formatDuration(null)).toBe("—");
    });
  });

  describe("generateStorageKey", () => {
    it("generates key with projectId and uuid", async () => {
      const { generateStorageKey } = await import("@/lib/video/metadata");
      const key = generateStorageKey("project-1", "video.mp4");
      expect(key).toMatch(/^videos\/project-1\/[a-f0-9-]+\.mp4$/);
    });

    it("handles files without extension", async () => {
      const { generateStorageKey } = await import("@/lib/video/metadata");
      const key = generateStorageKey("project-1", "video");
      expect(key).toMatch(/^videos\/project-1\/[a-f0-9-]+$/);
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
      expect(result.error).toBeDefined();
    });

    it("rejects oversized file", async () => {
      const { validateVideoFile } = await import("@/lib/video/metadata");
      const file = {
        name: "test.mp4",
        size: 501 * 1024 * 1024,
        type: "video/mp4",
      } as File;
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
