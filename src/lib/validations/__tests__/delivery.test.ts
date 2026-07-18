import { describe, it, expect } from "vitest";

import {
  createDeliverySchema,
  updateDeliverySchema,
  deliveryQuerySchema,
  deliveryStatusSchema,
  deliveryFilterSchema,
  deliverySortSchema,
  deliveryPasswordSchema,
} from "@/lib/validations/delivery";

/* ============================================
   Delivery Validation Tests
   ============================================ */

const validInput = {
  projectId: "550e8400-e29b-41d4-a716-446655440000",
  title: "تسليم زفاف أحمد",
  expiresAt: new Date("2026-12-31").toISOString(),
  downloadEnabled: true,
  allowStreaming: true,
  allowComments: false,
  passwordProtected: false,
  videoIds: ["video-1", "video-2"],
};

/* ── createDeliverySchema ────────────────── */

describe("createDeliverySchema", () => {
  it("accepts valid input", () => {
    const result = createDeliverySchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects when projectId is missing", () => {
    const result = createDeliverySchema.safeParse({ ...validInput, projectId: "" });
    expect(result.success).toBe(false);
  });

  it("rejects when title is too short", () => {
    const result = createDeliverySchema.safeParse({ ...validInput, title: "أ" });
    expect(result.success).toBe(false);
  });

  it("rejects when videoIds is empty", () => {
    const result = createDeliverySchema.safeParse({ ...validInput, videoIds: [] });
    expect(result.success).toBe(false);
  });

  it("accepts password when passwordProtected is true", () => {
    const result = createDeliverySchema.safeParse({
      ...validInput,
      passwordProtected: true,
      password: "secret123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short password", () => {
    const result = createDeliverySchema.safeParse({
      ...validInput,
      passwordProtected: true,
      password: "123",
    });
    expect(result.success).toBe(false);
  });
});

/* ── updateDeliverySchema ────────────────── */

describe("updateDeliverySchema", () => {
  it("accepts valid update input", () => {
    const result = updateDeliverySchema.safeParse({
      ...validInput,
      status: "ACTIVE",
    });
    expect(result.success).toBe(true);
  });
});

/* ── deliveryStatusSchema ────────────────── */

describe("deliveryStatusSchema", () => {
  it("accepts ACTIVE", () => {
    expect(deliveryStatusSchema.safeParse("ACTIVE").success).toBe(true);
  });
  it("accepts EXPIRED", () => {
    expect(deliveryStatusSchema.safeParse("EXPIRED").success).toBe(true);
  });
  it("accepts DISABLED", () => {
    expect(deliveryStatusSchema.safeParse("DISABLED").success).toBe(true);
  });
  it("rejects unknown", () => {
    expect(deliveryStatusSchema.safeParse("PENDING").success).toBe(false);
  });
});

/* ── deliveryFilterSchema ─────────────────── */

describe("deliveryFilterSchema", () => {
  it("accepts all filter values", () => {
    const values = ["all", "active", "expired", "disabled"];
    for (const v of values) {
      expect(deliveryFilterSchema.safeParse(v).success).toBe(true);
    }
  });
  it("rejects unknown", () => {
    expect(deliveryFilterSchema.safeParse("archived").success).toBe(false);
  });
});

/* ── deliverySortSchema ──────────────────── */

describe("deliverySortSchema", () => {
  it("accepts all sort values", () => {
    const values = ["newest", "oldest", "alphabetical"];
    for (const v of values) {
      expect(deliverySortSchema.safeParse(v).success).toBe(true);
    }
  });
});

/* ── deliveryQuerySchema ──────────────────── */

describe("deliveryQuerySchema", () => {
  it("accepts valid query params", () => {
    const result = deliveryQuerySchema.safeParse({
      page: 1,
      pageSize: 10,
      search: "test",
      filter: "active",
      sort: "newest",
    });
    expect(result.success).toBe(true);
  });

  it("uses defaults when omitted", () => {
    const result = deliveryQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(10);
    }
  });

  it("rejects page less than 1", () => {
    const result = deliveryQuerySchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });
});

/* ── deliveryPasswordSchema ───────────────── */

describe("deliveryPasswordSchema", () => {
  it("accepts slug + password", () => {
    const result = deliveryPasswordSchema.safeParse({
      slug: "test-slug",
      password: "secret123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = deliveryPasswordSchema.safeParse({
      slug: "test-slug",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});
