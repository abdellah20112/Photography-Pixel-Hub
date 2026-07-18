import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── Mock AWS SDK ────────────────────────── */

vi.mock("@aws-sdk/client-s3", () => {
  return {
    S3Client: vi.fn(() => ({ send: vi.fn() })),
    PutObjectCommand: vi.fn(function (this: any) { return this; }),
    GetObjectCommand: vi.fn(function (this: any) { return this; }),
    DeleteObjectCommand: vi.fn(function (this: any) { return this; }),
    HeadObjectCommand: vi.fn(function (this: any) { return this; }),
  };
});

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(async () => "https://presigned-url.example.com"),
}));

vi.mock("@/lib/r2/client", () => ({
  r2Client: { send: vi.fn() },
}));

vi.mock("@/lib/r2/config", () => ({
  R2_CONFIG: {
    ENDPOINT: "https://r2.example.com",
    ACCESS_KEY: "test-key",
    SECRET_KEY: "test-secret",
    BUCKET: "test-bucket",
    PUBLIC_URL: "https://cdn.example.com",
  },
  getR2PublicUrl: (key: string) => `https://cdn.example.com/${key}`,
}));

/* ── Imports (after mocks) ────────────────── */

import { r2Client } from "@/lib/r2/client";

/* ============================================
   Storage Service Tests
   ============================================ */

describe("R2 Storage Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(r2Client.send).mockResolvedValue({} as never);
  });

  describe("uploadFile", () => {
    it("uploads a file to R2 and returns the key", async () => {
      const { uploadFile } = await import("@/lib/r2/storage");

      const key = await uploadFile({
        key: "videos/test/file.mp4",
        body: Buffer.from("test"),
        contentType: "video/mp4",
        metadata: { "original-filename": "file.mp4" },
      });

      expect(key).toBe("videos/test/file.mp4");
      expect(r2Client.send).toHaveBeenCalled();
    });
  });

  describe("deleteFile", () => {
    it("deletes a file from R2", async () => {
      const { deleteFile } = await import("@/lib/r2/storage");

      await deleteFile("videos/test/file.mp4");

      expect(r2Client.send).toHaveBeenCalled();
    });
  });

  describe("replaceFile", () => {
    it("deletes old key and uploads new file", async () => {
      const { replaceFile } = await import("@/lib/r2/storage");

      const newKey = await replaceFile("old-key", {
        key: "new-key",
        body: Buffer.from("test"),
        contentType: "video/mp4",
      });

      expect(newKey).toBe("new-key");
      expect(r2Client.send).toHaveBeenCalledTimes(2);
    });
  });

  describe("getSignedUrl functions", () => {
    it("getDownloadUrl generates a signed URL", async () => {
      const { getDownloadUrl } = await import("@/lib/r2/storage");

      const url = await getDownloadUrl("test-key");

      expect(url).toBe("https://presigned-url.example.com");
    });

    it("getStreamingUrl generates a signed URL", async () => {
      const { getStreamingUrl } = await import("@/lib/r2/storage");

      const url = await getStreamingUrl("test-key");

      expect(url).toBe("https://presigned-url.example.com");
    });

    it("getSignedUrlForKey accepts custom expiration", async () => {
      const { getSignedUrlForKey } = await import("@/lib/r2/storage");

      await getSignedUrlForKey("test-key", { expiresIn: 1800 });

      const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 1800 }
      );
    });
  });

  describe("fileExists", () => {
    it("returns true when object exists", async () => {
      const { fileExists } = await import("@/lib/r2/storage");

      const exists = await fileExists("test-key");

      expect(exists).toBe(true);
    });

    it("returns false when object does not exist", async () => {
      const { fileExists } = await import("@/lib/r2/storage");
      vi.mocked(r2Client.send).mockRejectedValueOnce(new Error("NotFound"));

      const exists = await fileExists("nonexistent-key");

      expect(exists).toBe(false);
    });
  });

  describe("getPresignedUploadUrl", () => {
    it("generates a presigned upload URL", async () => {
      const { getPresignedUploadUrl } = await import("@/lib/r2/storage");

      const url = await getPresignedUploadUrl("test-key", "video/mp4");

      expect(url).toBe("https://presigned-url.example.com");
    });
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
