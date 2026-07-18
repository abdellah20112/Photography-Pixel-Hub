import { describe, it, expect } from "vitest";

import {
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
  projectStatusSchema,
  retentionPeriodSchema,
  projectFilterSchema,
  projectSortSchema,
} from "@/lib/validations/project";

/* ============================================
   Project Validation Tests
   ============================================ */

const validInput = {
  clientId: "550e8400-e29b-41d4-a716-446655440000",
  name: "مشروع تصوير زفاف",
  description: "تصوير حفل زفاف كامل",
  retentionPeriod: "TWENTY_FOUR_HOURS" as const,
  deadline: new Date("2026-12-31").toISOString(),
  status: "DRAFT" as const,
};

/* ── createProjectSchema ─────────────────── */

describe("createProjectSchema", () => {
  it("accepts valid input with all fields", () => {
    const result = createProjectSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts valid input without optional description", () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      description: "",
    });
    expect(result.success).toBe(true);
  });

  /* ── Client ID ─────────────────────────── */
  it("rejects when clientId is missing", () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      clientId: undefined,
    });
    expect(result.success).toBe(false);
  });

  it("rejects when clientId is empty", () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      clientId: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("مطلوب");
    }
  });

  /* ── Name ──────────────────────────────── */
  it("rejects when name is missing", () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      name: undefined,
    });
    expect(result.success).toBe(false);
  });

  it("rejects when name is too short", () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      name: "أ",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("حرفين");
    }
  });

  it("rejects when name exceeds 50 characters", () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      name: "أ".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  /* ── Description ───────────────────────── */
  it("rejects description exceeding 500 characters", () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      description: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  /* ── Retention Period ─────────────────── */
  it("rejects invalid retentionPeriod", () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      retentionPeriod: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  /* ── Deadline ─────────────────────────── */
  it("rejects missing deadline", () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      deadline: undefined,
    });
    expect(result.success).toBe(false);
  });

  /* ── Status ───────────────────────────── */
  it("rejects invalid status", () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      status: "INVALID",
    });
    expect(result.success).toBe(false);
  });
});

/* ── updateProjectSchema ──────────────────── */

describe("updateProjectSchema", () => {
  it("accepts valid update input", () => {
    const result = updateProjectSchema.safeParse({
      ...validInput,
      name: "اسم محدّث",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all status values", () => {
    const statuses = ["DRAFT", "IN_PROGRESS", "READY", "DOWNLOAD_ENABLED", "COMPLETED"];
    for (const status of statuses) {
      const result = updateProjectSchema.safeParse({
        ...validInput,
        status,
      });
      expect(result.success).toBe(true);
    }
  });
});

/* ── projectStatusSchema ──────────────────── */

describe("projectStatusSchema", () => {
  it("accepts DRAFT", () => {
    expect(projectStatusSchema.safeParse("DRAFT").success).toBe(true);
  });

  it("accepts IN_PROGRESS", () => {
    expect(projectStatusSchema.safeParse("IN_PROGRESS").success).toBe(true);
  });

  it("accepts READY", () => {
    expect(projectStatusSchema.safeParse("READY").success).toBe(true);
  });

  it("accepts DOWNLOAD_ENABLED", () => {
    expect(projectStatusSchema.safeParse("DOWNLOAD_ENABLED").success).toBe(true);
  });

  it("accepts COMPLETED", () => {
    expect(projectStatusSchema.safeParse("COMPLETED").success).toBe(true);
  });

  it("accepts ARCHIVED", () => {
    expect(projectStatusSchema.safeParse("ARCHIVED").success).toBe(true);
  });

  it("rejects PUBLISHED (old value)", () => {
    expect(projectStatusSchema.safeParse("PUBLISHED").success).toBe(false);
  });

  it("rejects EXPIRED (old value)", () => {
    expect(projectStatusSchema.safeParse("EXPIRED").success).toBe(false);
  });
});

/* ── retentionPeriodSchema ─────────────────── */

describe("retentionPeriodSchema", () => {
  it("accepts TWENTY_FOUR_HOURS", () => {
    expect(retentionPeriodSchema.safeParse("TWENTY_FOUR_HOURS").success).toBe(true);
  });

  it("accepts FORTY_EIGHT_HOURS", () => {
    expect(retentionPeriodSchema.safeParse("FORTY_EIGHT_HOURS").success).toBe(true);
  });

  it("accepts SEVENTY_TWO_HOURS", () => {
    expect(retentionPeriodSchema.safeParse("SEVENTY_TWO_HOURS").success).toBe(true);
  });

  it("accepts SEVEN_DAYS", () => {
    expect(retentionPeriodSchema.safeParse("SEVEN_DAYS").success).toBe(true);
  });

  it("accepts CUSTOM", () => {
    expect(retentionPeriodSchema.safeParse("CUSTOM").success).toBe(true);
  });

  it("rejects unknown value", () => {
    expect(retentionPeriodSchema.safeParse("ONE_MONTH").success).toBe(false);
  });
});

/* ── projectFilterSchema ───────────────────── */

describe("projectFilterSchema", () => {
  it("accepts all", () => {
    expect(projectFilterSchema.safeParse("all").success).toBe(true);
  });

  it("accepts draft", () => {
    expect(projectFilterSchema.safeParse("draft").success).toBe(true);
  });

  it("accepts in_progress", () => {
    expect(projectFilterSchema.safeParse("in_progress").success).toBe(true);
  });

  it("accepts ready", () => {
    expect(projectFilterSchema.safeParse("ready").success).toBe(true);
  });

  it("accepts download_enabled", () => {
    expect(projectFilterSchema.safeParse("download_enabled").success).toBe(true);
  });

  it("accepts completed", () => {
    expect(projectFilterSchema.safeParse("completed").success).toBe(true);
  });

  it("accepts archived", () => {
    expect(projectFilterSchema.safeParse("archived").success).toBe(true);
  });

  it("rejects unknown filter", () => {
    expect(projectFilterSchema.safeParse("expired").success).toBe(false);
  });
});

/* ── projectSortSchema ──────────────────────── */

describe("projectSortSchema", () => {
  it("accepts newest", () => {
    expect(projectSortSchema.safeParse("newest").success).toBe(true);
  });

  it("accepts oldest", () => {
    expect(projectSortSchema.safeParse("oldest").success).toBe(true);
  });

  it("accepts deadline", () => {
    expect(projectSortSchema.safeParse("deadline").success).toBe(true);
  });

  it("accepts alphabetical", () => {
    expect(projectSortSchema.safeParse("alphabetical").success).toBe(true);
  });

  it("rejects unknown sort", () => {
    expect(projectSortSchema.safeParse("by_size").success).toBe(false);
  });
});

/* ── projectQuerySchema ────────────────────── */

describe("projectQuerySchema", () => {
  it("accepts valid query params", () => {
    const result = projectQuerySchema.safeParse({
      page: 1,
      pageSize: 10,
      filter: "all",
      sort: "newest",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid page size", () => {
    const result = projectQuerySchema.safeParse({
      page: 1,
      pageSize: 7,
    });
    expect(result.success).toBe(false);
  });

  it("rejects page less than 1", () => {
    const result = projectQuerySchema.safeParse({
      page: 0,
      pageSize: 10,
    });
    expect(result.success).toBe(false);
  });

  it("accepts page size 100", () => {
    const result = projectQuerySchema.safeParse({
      page: 1,
      pageSize: 100,
    });
    expect(result.success).toBe(true);
  });

  it("accepts page size 25", () => {
    const result = projectQuerySchema.safeParse({
      page: 1,
      pageSize: 25,
    });
    expect(result.success).toBe(true);
  });

  it("accepts page size 50", () => {
    const result = projectQuerySchema.safeParse({
      page: 1,
      pageSize: 50,
    });
    expect(result.success).toBe(true);
  });

  it("uses defaults when omitted", () => {
    const result = projectQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(10);
    }
  });
});
