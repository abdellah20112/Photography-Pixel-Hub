import { describe, it, expect } from "vitest";

import {
  createQuoteSchema,
  createInvoiceSchema,
  createPaymentSchema,
  quoteStatusSchema,
  invoiceStatusSchema,
  paymentMethodSchema,
  calculateTotals,
} from "@/lib/validations/financial";

/* ============================================
   Financial Validation Tests
   ============================================ */

const validQuote = {
  clientId: "client-1",
  items: [
    { description: "تصوير زفاف", quantity: 1, unitPrice: 5000, total: 5000, order: 0 },
  ],
  discount: 0,
  tax: 15,
  validUntil: new Date("2026-12-31").toISOString(),
};

describe("createQuoteSchema", () => {
  it("accepts valid input", () => {
    expect(createQuoteSchema.safeParse(validQuote).success).toBe(true);
  });

  it("rejects empty items", () => {
    expect(createQuoteSchema.safeParse({ ...validQuote, items: [] }).success).toBe(false);
  });

  it("rejects negative discount", () => {
    expect(createQuoteSchema.safeParse({ ...validQuote, discount: -100 }).success).toBe(false);
  });

  it("rejects negative tax", () => {
    expect(createQuoteSchema.safeParse({ ...validQuote, tax: -5 }).success).toBe(false);
  });

  it("rejects item with quantity < 1", () => {
    expect(createQuoteSchema.safeParse({
      ...validQuote,
      items: [{ description: "Test", quantity: 0, unitPrice: 100, total: 0, order: 0 }],
    }).success).toBe(false);
  });

  it("rejects item with negative unitPrice", () => {
    expect(createQuoteSchema.safeParse({
      ...validQuote,
      items: [{ description: "Test", quantity: 1, unitPrice: -50, total: 0, order: 0 }],
    }).success).toBe(false);
  });
});

describe("createInvoiceSchema", () => {
  it("accepts valid input", () => {
    expect(createInvoiceSchema.safeParse({
      ...validQuote,
      issueDate: new Date().toISOString(),
      dueDate: new Date("2026-12-31").toISOString(),
    }).success).toBe(true);
  });
});

describe("createPaymentSchema", () => {
  it("accepts valid payment", () => {
    expect(createPaymentSchema.safeParse({
      invoiceId: "inv-1",
      amount: 500,
      paymentMethod: "CASH",
    }).success).toBe(true);
  });

  it("rejects zero amount", () => {
    expect(createPaymentSchema.safeParse({
      invoiceId: "inv-1",
      amount: 0,
    }).success).toBe(false);
  });

  it("rejects negative amount", () => {
    expect(createPaymentSchema.safeParse({
      invoiceId: "inv-1",
      amount: -100,
    }).success).toBe(false);
  });

  it("rejects missing invoiceId", () => {
    expect(createPaymentSchema.safeParse({
      amount: 100,
    }).success).toBe(false);
  });
});

describe("quoteStatusSchema", () => {
  it("accepts all statuses", () => {
    ["DRAFT", "SENT", "APPROVED", "REJECTED", "EXPIRED"].forEach(s => {
      expect(quoteStatusSchema.safeParse(s).success).toBe(true);
    });
  });
});

describe("invoiceStatusSchema", () => {
  it("accepts all statuses", () => {
    ["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"].forEach(s => {
      expect(invoiceStatusSchema.safeParse(s).success).toBe(true);
    });
  });
});

describe("paymentMethodSchema", () => {
  it("accepts all methods", () => {
    ["CASH", "BANK_TRANSFER", "CREDIT_CARD", "OTHER"].forEach(m => {
      expect(paymentMethodSchema.safeParse(m).success).toBe(true);
    });
  });
});

/* ── calculateTotals ──────────────────────── */

describe("calculateTotals", () => {
  it("calculates subtotal and total with no discount/tax", () => {
    const result = calculateTotals(
      [{ quantity: 2, unitPrice: 100 }],
      0, 0
    );
    expect(result.subtotal).toBe(200);
    expect(result.total).toBe(200);
  });

  it("applies discount", () => {
    const result = calculateTotals(
      [{ quantity: 1, unitPrice: 1000 }],
      200, 0
    );
    expect(result.subtotal).toBe(1000);
    expect(result.total).toBe(800);
  });

  it("applies tax percentage", () => {
    const result = calculateTotals(
      [{ quantity: 1, unitPrice: 1000 }],
      0, 15
    );
    expect(result.subtotal).toBe(1000);
    expect(result.total).toBe(1150);
  });

  it("applies discount then tax", () => {
    const result = calculateTotals(
      [{ quantity: 2, unitPrice: 500 }],
      200, 10
    );
    expect(result.subtotal).toBe(1000);
    // afterDiscount = 1000 - 200 = 800
    // taxAmount = 800 * 0.1 = 80
    // total = 880
    expect(result.total).toBe(880);
  });

  it("handles multiple items", () => {
    const result = calculateTotals(
      [
        { quantity: 2, unitPrice: 100 },
        { quantity: 3, unitPrice: 50 },
      ],
      0, 0
    );
    expect(result.subtotal).toBe(350);
    expect(result.total).toBe(350);
  });

  it("handles discount exceeding subtotal (clamps to 0)", () => {
    const result = calculateTotals(
      [{ quantity: 1, unitPrice: 100 }],
      200, 0
    );
    expect(result.subtotal).toBe(100);
    expect(result.total).toBe(0);
  });
});
