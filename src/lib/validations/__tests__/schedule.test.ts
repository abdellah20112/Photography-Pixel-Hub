import { describe, it, expect } from "vitest";

import {
  createShootSchema,
  updateShootSchema,
  assignToShootSchema,
  shootQuerySchema,
  shootStatusSchema,
  shootFilterSchema,
  shootSortSchema,
} from "@/lib/validations/schedule";

const validShoot = {
  projectId: "project-1",
  title: "تصوير زفاف",
  date: new Date("2026-06-15").toISOString(),
  startTime: new Date("2026-06-15T10:00:00").toISOString(),
  endTime: new Date("2026-06-15T14:00:00").toISOString(),
};

describe("createShootSchema", () => {
  it("accepts valid input", () => {
    expect(createShootSchema.safeParse(validShoot).success).toBe(true);
  });

  it("rejects when projectId is missing", () => {
    expect(createShootSchema.safeParse({ ...validShoot, projectId: "" }).success).toBe(false);
  });

  it("rejects when endTime is before startTime", () => {
    expect(createShootSchema.safeParse({
      ...validShoot,
      startTime: new Date("2026-06-15T14:00:00").toISOString(),
      endTime: new Date("2026-06-15T10:00:00").toISOString(),
    }).success).toBe(false);
  });

  it("accepts optional fields", () => {
    expect(createShootSchema.safeParse({
      ...validShoot,
      location: "الاستوديو",
      description: "وصف",
      notes: "ملاحظات",
    }).success).toBe(true);
  });
});

describe("updateShootSchema", () => {
  it("accepts valid update", () => {
    expect(updateShootSchema.safeParse({ ...validShoot, status: "CONFIRMED" }).success).toBe(true);
  });

  it("rejects endTime before startTime", () => {
    expect(updateShootSchema.safeParse({
      ...validShoot,
      startTime: new Date("2026-06-15T15:00:00").toISOString(),
      endTime: new Date("2026-06-15T10:00:00").toISOString(),
    }).success).toBe(false);
  });
});

describe("assignToShootSchema", () => {
  it("accepts valid assignment with team member", () => {
    expect(assignToShootSchema.safeParse({
      shootId: "s1", teamMemberId: "tm1", role: "مصور",
    }).success).toBe(true);
  });

  it("accepts valid assignment with model", () => {
    expect(assignToShootSchema.safeParse({
      shootId: "s1", modelId: "m1", role: "موديل",
    }).success).toBe(true);
  });

  it("rejects missing shootId", () => {
    expect(assignToShootSchema.safeParse({ role: "مصور" }).success).toBe(false);
  });

  it("rejects missing role", () => {
    expect(assignToShootSchema.safeParse({ shootId: "s1" }).success).toBe(false);
  });
});

describe("shootStatusSchema", () => {
  it("accepts all statuses", () => {
    ["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].forEach(s => {
      expect(shootStatusSchema.safeParse(s).success).toBe(true);
    });
  });
});

describe("shootFilterSchema", () => {
  it("accepts all filters", () => {
    ["all", "scheduled", "confirmed", "in_progress", "completed", "cancelled"].forEach(f => {
      expect(shootFilterSchema.safeParse(f).success).toBe(true);
    });
  });
});

describe("shootSortSchema", () => {
  it("accepts all sorts", () => {
    ["newest", "oldest", "date_asc", "date_desc"].forEach(s => {
      expect(shootSortSchema.safeParse(s).success).toBe(true);
    });
  });
});

describe("shootQuerySchema", () => {
  it("uses defaults", () => {
    const result = shootQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(25);
    }
  });
});
