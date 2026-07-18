import { describe, it, expect } from "vitest";

import { loginSchema } from "@/lib/validations/auth";

/* ============================================
   Login Validation Tests
   ============================================ */

describe("loginSchema", () => {
  /* ── Missing email ──────────────────────── */
  it("rejects when email is missing", () => {
    const result = loginSchema.safeParse({
      password: "SomePassword1",
    });

    expect(result.success).toBe(false);
  });

  it("rejects when email is empty string", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "SomePassword1",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("مطلوب");
    }
  });

  /* ── Missing password ───────────────────── */
  it("rejects when password is missing", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
    });

    expect(result.success).toBe(false);
  });

  it("rejects when password is empty string", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("مطلوبة");
    }
  });

  /* ── Invalid email format ────────────────── */
  it("rejects invalid email format", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "SomePassword1",
    });

    expect(result.success).toBe(false);
  });

  /* ── Valid input ────────────────────────── */
  it("accepts valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "AnyPassword123",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });
});
