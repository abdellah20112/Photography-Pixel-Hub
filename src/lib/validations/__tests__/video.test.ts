import { describe, it, expect } from "vitest";

import {
  createVideoSchema,
  updateVideoSchema,
  videoQuerySchema,
  videoStatusSchema,
  videoFilterSchema,
  videoSortSchema,
  validateFileSize,
  validateFileType,
  validateMimeType,
} from "@/lib/validations/video";

/* ============================================
   Video Validation Tests
   ============================================ */

const validInput = {
  projectId: "550e8400-e29b-41d4-a716-446655440000",
  title: "حفل زفاف كامل",
  originalFileName: "wedding-video.mp4",
  storageKey: "videos/proj-1/uuid.mp4",
  storageBucket: "pph-videos",
  mimeType: "video/mp4",
  extension: "mp4",
  fileSize: 1024 * 1024 * 50,
};

/* ── createVideoSchema ───────────────────── */

describe("createVideoSchema", () => {
  it("accepts valid input with all fields", () => {
    const result = createVideoSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts with optional duration, width, height", () => {
    const result = createVideoSchema.safeParse({
      ...validInput,
      duration: 120,
      width: 1920,
      height: 1080,
    });
    expect(result.success).toBe(true);
  });

  it("rejects when projectId is missing", () => {
    const result = createVideoSchema.safeParse({
      ...validInput,
      projectId: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when title is missing", () => {
    const result = createVideoSchema.safeParse({
      ...validInput,
      title: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when title exceeds 200 chars", () => {
    const result = createVideoSchema.safeParse({
      ...validInput,
      title: "x".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects when fileSize is not positive", () => {
    const result = createVideoSchema.safeParse({
      ...validInput,
      fileSize: 0,
    });
    expect(result.success).toBe(false);
  });
});

/* ── updateVideoSchema ───────────────────── */

describe("updateVideoSchema", () => {
  it("accepts valid update input", () => {
    const result = updateVideoSchema.safeParse({
      title: "Updated Title",
      status: "READY",
      duration: 180,
      width: 1280,
      height: 720,
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty optional fields", () => {
    const result = updateVideoSchema.safeParse({
      title: "Test",
    });
    expect(result.success).toBe(true);
  });
});

/* ── videoStatusSchema ────────────────────── */

describe("videoStatusSchema", () => {
  it("accepts UPLOADING", () => {
    expect(videoStatusSchema.safeParse("UPLOADING").success).toBe(true);
  });

  it("accepts PROCESSING", () => {
    expect(videoStatusSchema.safeParse("PROCESSING").success).toBe(true);
  });

  it("accepts READY", () => {
    expect(videoStatusSchema.safeParse("READY").success).toBe(true);
  });

  it("accepts FAILED", () => {
    expect(videoStatusSchema.safeParse("FAILED").success).toBe(true);
  });

  it("accepts DELETED", () => {
    expect(videoStatusSchema.safeParse("DELETED").success).toBe(true);
  });

  it("rejects PENDING (old value)", () => {
    expect(videoStatusSchema.safeParse("PENDING").success).toBe(false);
  });
});

/* ── videoFilterSchema ────────────────────── */

describe("videoFilterSchema", () => {
  it("accepts all filter values", () => {
    const values = ["ready", "processing", "uploading", "failed", "deleted"];
    for (const v of values) {
      expect(videoFilterSchema.safeParse(v).success).toBe(true);
    }
  });

  it("rejects unknown filter", () => {
    expect(videoFilterSchema.safeParse("archived").success).toBe(false);
  });
});

/* ── videoSortSchema ──────────────────────── */

describe("videoSortSchema", () => {
  it("accepts all sort values", () => {
    const values = ["newest", "oldest", "duration", "size"];
    for (const v of values) {
      expect(videoSortSchema.safeParse(v).success).toBe(true);
    }
  });

  it("rejects unknown sort", () => {
    expect(videoSortSchema.safeParse("alphabetical").success).toBe(false);
  });
});

/* ── videoQuerySchema ─────────────────────── */

describe("videoQuerySchema", () => {
  it("accepts valid query params", () => {
    const result = videoQuerySchema.safeParse({
      page: 1,
      pageSize: 12,
      search: "test",
      filter: "ready",
      sort: "newest",
    });
    expect(result.success).toBe(true);
  });

  it("uses defaults when omitted", () => {
    const result = videoQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(12);
    }
  });

  it("rejects page less than 1", () => {
    const result = videoQuerySchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });
});

/* ── Validation helpers ───────────────────── */

describe("validateFileSize", () => {
  it("accepts valid size", () => {
    expect(validateFileSize(1024)).toBe(true);
  });

  it("rejects zero", () => {
    expect(validateFileSize(0)).toBe(false);
  });

  it("rejects negative", () => {
    expect(validateFileSize(-1)).toBe(false);
  });

  it("accepts max video size (500MB)", () => {
    expect(validateFileSize(500 * 1024 * 1024)).toBe(true);
  });

  it("rejects over max video size", () => {
    expect(validateFileSize(501 * 1024 * 1024)).toBe(false);
  });
});

describe("validateFileType", () => {
  it("accepts mp4", () => {
    expect(validateFileType("video.mp4")).toBe(true);
  });

  it("accepts mov", () => {
    expect(validateFileType("video.mov")).toBe(true);
  });

  it("accepts webm", () => {
    expect(validateFileType("video.webm")).toBe(true);
  });

  it("rejects avi", () => {
    expect(validateFileType("video.avi")).toBe(false);
  });

  it("rejects files without extension", () => {
    expect(validateFileType("video")).toBe(false);
  });
});

describe("validateMimeType", () => {
  it("accepts video/mp4", () => {
    expect(validateMimeType("video/mp4")).toBe(true);
  });

  it("accepts video/quicktime", () => {
    expect(validateMimeType("video/quicktime")).toBe(true);
  });

  it("accepts video/webm", () => {
    expect(validateMimeType("video/webm")).toBe(true);
  });

  it("rejects image/png", () => {
    expect(validateMimeType("image/png")).toBe(false);
  });
});
