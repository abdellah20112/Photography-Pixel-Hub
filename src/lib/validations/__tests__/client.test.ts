import { describe, it, expect } from "vitest";

import {
  createClientSchema,
  updateClientSchema,
  clientQuerySchema,
  clientStatusSchema,
} from "@/lib/validations/client";

/* ============================================
   Client Validation Tests
   ============================================ */

describe("createClientSchema", () => {
  const validInput = {
    name: "أحمد محمد",
    email: "ahmed@example.com",
    phone: "0501234567",
    company: "شركة الإبداع",
    notes: "عميل مميز",
    status: "ACTIVE" as const,
  };

  /* ── Valid input ────────────────────────── */
  it("accepts valid input with all fields", () => {
    const result = createClientSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts valid input without optional fields", () => {
    const result = createClientSchema.safeParse({
      name: "أحمد",
      email: "ahmed@example.com",
      status: "ACTIVE",
    });
    expect(result.success).toBe(true);
  });

  /* ── Name validation ────────────────────── */
  it("rejects when name is missing", () => {
    const result = createClientSchema.safeParse({
      email: "ahmed@example.com",
      status: "ACTIVE",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when name is too short", () => {
    const result = createClientSchema.safeParse({
      ...validInput,
      name: "أ",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("حرفين");
    }
  });

  it("rejects when name exceeds 50 characters", () => {
    const result = createClientSchema.safeParse({
      ...validInput,
      name: "أ".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  /* ── Email validation ──────────────────── */
  it("rejects invalid email format", () => {
    const result = createClientSchema.safeParse({
      ...validInput,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when email is empty", () => {
    const result = createClientSchema.safeParse({
      ...validInput,
      email: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("مطلوب");
    }
  });

  /* ── Phone validation ──────────────────── */
  it("accepts empty phone", () => {
    const result = createClientSchema.safeParse({
      ...validInput,
      phone: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid phone format", () => {
    const result = createClientSchema.safeParse({
      ...validInput,
      phone: "12345",
    });
    expect(result.success).toBe(false);
  });

  /* ── Status validation ─────────────────── */
  it("rejects invalid status value", () => {
    const result = createClientSchema.safeParse({
      ...validInput,
      status: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  /* ── Company / Notes length ────────────── */
  it("rejects company name exceeding 100 characters", () => {
    const result = createClientSchema.safeParse({
      ...validInput,
      company: "x".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects notes exceeding 1000 characters", () => {
    const result = createClientSchema.safeParse({
      ...validInput,
      notes: "x".repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});

describe("updateClientSchema", () => {
  it("accepts valid update input", () => {
    const result = updateClientSchema.safeParse({
      name: "Updated Name",
      email: "updated@example.com",
      phone: "0509876543",
      status: "BLOCKED",
    });
    expect(result.success).toBe(true);
  });
});

describe("clientStatusSchema", () => {
  it("accepts ACTIVE", () => {
    expect(clientStatusSchema.safeParse("ACTIVE").success).toBe(true);
  });

  it("accepts ARCHIVED", () => {
    expect(clientStatusSchema.safeParse("ARCHIVED").success).toBe(true);
  });

  it("accepts BLOCKED", () => {
    expect(clientStatusSchema.safeParse("BLOCKED").success).toBe(true);
  });

  it("rejects unknown status", () => {
    expect(clientStatusSchema.safeParse("PENDING").success).toBe(false);
  });
});

describe("clientQuerySchema", () => {
  it("accepts valid query params", () => {
    const result = clientQuerySchema.safeParse({
      page: 1,
      pageSize: 10,
      filter: "all",
      sort: "newest",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid page size", () => {
    const result = clientQuerySchema.safeParse({
      page: 1,
      pageSize: 7,
    });
    expect(result.success).toBe(false);
  });

  it("rejects page less than 1", () => {
    const result = clientQuerySchema.safeParse({
      page: 0,
      pageSize: 10,
    });
    expect(result.success).toBe(false);
  });

  it("accepts page size 100", () => {
    const result = clientQuerySchema.safeParse({
      page: 1,
      pageSize: 100,
    });
    expect(result.success).toBe(true);
  });
});
