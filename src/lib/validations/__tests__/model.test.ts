import { describe, it, expect } from "vitest";

import {
  createModelSchema,
  updateModelSchema,
  modelQuerySchema,
  modelStatusSchema,
  modelFilterSchema,
  modelSortSchema,
  paymentStatusSchema,
  assignModelSchema,
  updateAssignmentSchema,
} from "@/lib/validations/model";

/* ============================================
   Model Validation Tests
   ============================================ */

const validModel = {
  fullName: "أحمد محمد",
  phone: "0501234567",
  whatsapp: "0501234567",
  email: "model@example.com",
  status: "ACTIVE" as const,
};

describe("createModelSchema", () => {
  it("accepts valid input", () => {
    expect(createModelSchema.safeParse(validModel).success).toBe(true);
  });

  it("rejects when fullName is too short", () => {
    expect(createModelSchema.safeParse({ ...validModel, fullName: "أ" }).success).toBe(false);
  });

  it("rejects when phone is missing", () => {
    expect(createModelSchema.safeParse({ ...validModel, phone: "" }).success).toBe(false);
  });

  it("accepts without optional fields", () => {
    expect(createModelSchema.safeParse({ fullName: "Test", phone: "050", status: "ACTIVE" }).success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(createModelSchema.safeParse({ ...validModel, email: "not-an-email" }).success).toBe(false);
  });
});

describe("updateModelSchema", () => {
  it("accepts valid update", () => {
    expect(updateModelSchema.safeParse(validModel).success).toBe(true);
  });
});

describe("assignModelSchema", () => {
  it("accepts valid assignment", () => {
    expect(assignModelSchema.safeParse({
      projectId: "p1", modelId: "m1", videosCount: 1,
    }).success).toBe(true);
  });

  it("rejects videosCount < 1", () => {
    expect(assignModelSchema.safeParse({
      projectId: "p1", modelId: "m1", videosCount: 0,
    }).success).toBe(false);
  });

  it("rejects missing projectId", () => {
    expect(assignModelSchema.safeParse({
      modelId: "m1", videosCount: 1,
    }).success).toBe(false);
  });
});

describe("updateAssignmentSchema", () => {
  it("accepts valid update", () => {
    expect(updateAssignmentSchema.safeParse({
      videosCount: 3, paymentStatus: "PAID",
    }).success).toBe(true);
  });
});

describe("modelStatusSchema", () => {
  it("accepts ACTIVE", () => { expect(modelStatusSchema.safeParse("ACTIVE").success).toBe(true); });
  it("accepts INACTIVE", () => { expect(modelStatusSchema.safeParse("INACTIVE").success).toBe(true); });
  it("rejects unknown", () => { expect(modelStatusSchema.safeParse("PENDING").success).toBe(false); });
});

describe("paymentStatusSchema", () => {
  it("accepts PENDING", () => { expect(paymentStatusSchema.safeParse("PENDING").success).toBe(true); });
  it("accepts PARTIALLY_PAID", () => { expect(paymentStatusSchema.safeParse("PARTIALLY_PAID").success).toBe(true); });
  it("accepts PAID", () => { expect(paymentStatusSchema.safeParse("PAID").success).toBe(true); });
  it("rejects unknown", () => { expect(paymentStatusSchema.safeParse("UNPAID").success).toBe(false); });
});

describe("modelFilterSchema", () => {
  it("accepts all values", () => {
    ["all", "active", "inactive"].forEach(v => {
      expect(modelFilterSchema.safeParse(v).success).toBe(true);
    });
  });
});

describe("modelSortSchema", () => {
  it("accepts all values", () => {
    ["newest", "oldest", "alphabetical"].forEach(v => {
      expect(modelSortSchema.safeParse(v).success).toBe(true);
    });
  });
});

describe("modelQuerySchema", () => {
  it("uses defaults", () => {
    const result = modelQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(10);
    }
  });
});
