import { describe, it, expect } from "vitest";

import {
  createCommentSchema,
  updateCommentSchema,
  commentQuerySchema,
  commentStatusSchema,
  authorTypeSchema,
  commentFilterSchema,
  commentSortSchema,
  sanitizeMessage,
} from "@/lib/validations/review";

/* ============================================
   Review Validation Tests
   ============================================ */

const validInput = {
  videoId: "video-1",
  deliveryId: "delivery-1",
  authorName: "أحمد محمد",
  authorEmail: "ahmed@example.com",
  authorType: "CLIENT" as const,
  message: "هذا المشهد يحتاج إلى تعديل",
  timestampSeconds: 45,
};

/* ── createCommentSchema ─────────────────── */

describe("createCommentSchema", () => {
  it("accepts valid input", () => {
    const result = createCommentSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts with parentId", () => {
    const result = createCommentSchema.safeParse({
      ...validInput,
      parentId: "parent-1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when authorName is too short", () => {
    const result = createCommentSchema.safeParse({
      ...validInput,
      authorName: "أ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = createCommentSchema.safeParse({
      ...validInput,
      authorEmail: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty message", () => {
    const result = createCommentSchema.safeParse({
      ...validInput,
      message: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects message over 1000 chars", () => {
    const result = createCommentSchema.safeParse({
      ...validInput,
      message: "x".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative timestamp", () => {
    const result = createCommentSchema.safeParse({
      ...validInput,
      timestampSeconds: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects timestamp over 86400", () => {
    const result = createCommentSchema.safeParse({
      ...validInput,
      timestampSeconds: 100000,
    });
    expect(result.success).toBe(false);
  });
});

/* ── updateCommentSchema ─────────────────── */

describe("updateCommentSchema", () => {
  it("accepts valid message", () => {
    const result = updateCommentSchema.safeParse({ message: "Updated message" });
    expect(result.success).toBe(true);
  });

  it("rejects empty message", () => {
    const result = updateCommentSchema.safeParse({ message: "" });
    expect(result.success).toBe(false);
  });
});

/* ── commentStatusSchema ─────────────────── */

describe("commentStatusSchema", () => {
  it("accepts OPEN", () => {
    expect(commentStatusSchema.safeParse("OPEN").success).toBe(true);
  });
  it("accepts RESOLVED", () => {
    expect(commentStatusSchema.safeParse("RESOLVED").success).toBe(true);
  });
  it("accepts ARCHIVED", () => {
    expect(commentStatusSchema.safeParse("ARCHIVED").success).toBe(true);
  });
  it("rejects unknown", () => {
    expect(commentStatusSchema.safeParse("PENDING").success).toBe(false);
  });
});

/* ── authorTypeSchema ────────────────────── */

describe("authorTypeSchema", () => {
  it("accepts CLIENT", () => {
    expect(authorTypeSchema.safeParse("CLIENT").success).toBe(true);
  });
  it("accepts TEAM", () => {
    expect(authorTypeSchema.safeParse("TEAM").success).toBe(true);
  });
  it("rejects unknown", () => {
    expect(authorTypeSchema.safeParse("ADMIN").success).toBe(false);
  });
});

/* ── commentFilterSchema ─────────────────── */

describe("commentFilterSchema", () => {
  it("accepts all filter values", () => {
    const values = ["all", "open", "resolved", "archived"];
    for (const v of values) {
      expect(commentFilterSchema.safeParse(v).success).toBe(true);
    }
  });
  it("rejects unknown", () => {
    expect(commentFilterSchema.safeParse("pending").success).toBe(false);
  });
});

/* ── commentSortSchema ───────────────────── */

describe("commentSortSchema", () => {
  it("accepts all sort values", () => {
    const values = ["newest", "oldest", "timestamp"];
    for (const v of values) {
      expect(commentSortSchema.safeParse(v).success).toBe(true);
    }
  });
});

/* ── commentQuerySchema ───────────────────── */

describe("commentQuerySchema", () => {
  it("accepts valid query params", () => {
    const result = commentQuerySchema.safeParse({
      page: 1,
      pageSize: 50,
      videoId: "video-1",
      filter: "open",
      sort: "timestamp",
    });
    expect(result.success).toBe(true);
  });

  it("uses defaults when omitted", () => {
    const result = commentQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(50);
    }
  });
});

/* ── sanitizeMessage ─────────────────────── */

describe("sanitizeMessage", () => {
  it("escapes HTML tags", () => {
    const result = sanitizeMessage("<script>alert('xss')</script>");
    expect(result).not.toContain("<script>");
    expect(result).toContain("&lt;script&gt;");
  });

  it("escapes quotes", () => {
    const result = sanitizeMessage('test "quote"');
    expect(result).toContain("&quot;");
  });

  it("trims whitespace", () => {
    const result = sanitizeMessage("  test  ");
    expect(result).toBe("test");
  });

  it("escapes single quotes", () => {
    const result = sanitizeMessage("test 'quote'");
    expect(result).toContain("&#x27;");
  });
});
