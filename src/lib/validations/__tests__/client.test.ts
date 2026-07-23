import { describe, it, expect } from "vitest";

import {
  createClientSchema,
  updateClientSchema,
  clientQuerySchema,
  clientStatusSchema,
} from "@/lib/validations/client";

/* ============================================
   Client Validation Tests
   Email optional, phone required (Moroccan 06/07)
   ============================================ */

describe("createClientSchema", () => {
  const validInput = {
    name: "أحمد محمد",
    email: "ahmed@example.com",
    phone: "0612345678",
    company: "شركة الإبداع",
    notes: "عميل مميز",
    status: "ACTIVE" as const,
  };

  /* ── Valid input ─────────────────────────── */
  it("accepts valid input with all fields", () => {
    const result = createClientSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts valid input without optional fields (no email)", () => {
    const result = createClientSchema.safeParse({
      name: "أحمد",
      phone: "0712345678",
      status: "ACTIVE",
    });
    expect(result.success).toBe(true);
  });

  /* ── Name validation ──────────────────────── */
  it("rejects when name is missing", () => {
    const result = createClientSchema.safeParse({
      phone: "0612345678",
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

  /* ── Email validation (now optional) ──────── */
  it("rejects invalid email format", () => {
    const result = createClientSchema.safeParse({
      ...validInput,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty email (optional)", () => {
    const result = createClientSchema.safeParse({
      ...validInput,
      email: "",
    });
    expect(result.success).toBe(true);
  });

  /* ── Phone validation (now required, Moroccan) ── */
  it("rejects empty phone (required)", () => {
    const result = createClientSchema.safeParse({
      ...validInput,
      phone: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid phone format", () => {
    const result = createClientSchema.safeParse({
      ...validInput,
      phone: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("rejects phone not starting with 06 or 07", () => {
    const result = createClientSchema.safeParse({
      ...validInput,
      phone: "0512345678",
    });
    expect(result.success).toBe(false);
  });

  it("accepts 06 prefix", () => {
    const result = createClientSchema.safeParse({
      ...validInput,
      phone: "0612345678",
    });
    expect(result.success).toBe(true);
  });

  it("accepts 07 prefix", () => {
    const result = createClientSchema.safeParse({
      ...validInput,
      phone: "0712345678",
    });
    expect(result.success).toBe(true);
  });

  /* ── Status validation ───────────────────── */
  it("rejects invalid status value", () => {
    const result = createClientSchema.safeParse({
      ...validInput,
      status: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  /* ── Company / Notes length ──────────────── */
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
      phone: "0698765432",
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
