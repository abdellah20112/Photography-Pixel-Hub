import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── Mock dependencies ───────────────────── */

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quote: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    quoteItem: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    invoice: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    invoiceItem: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    payment: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

/* ── Imports ─────────────────────────────── */

import { prisma } from "@/lib/prisma";
import { financialRepository } from "@/repositories/financial.repository";

/* ============================================
   Financial Repository Tests
   ============================================ */

describe("financialRepository.findQuoteById", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls findUnique with includes", async () => {
    vi.mocked(prisma.quote.findUnique).mockResolvedValue({ id: "q1" } as never);

    await financialRepository.findQuoteById("q1");

    expect(prisma.quote.findUnique).toHaveBeenCalledWith({
      where: { id: "q1" },
      include: {
        items: { orderBy: { order: "asc" } },
        client: { select: { id: true, name: true, clientCode: true } },
        project: { select: { id: true, name: true, projectCode: true } },
        invoice: true,
      },
    });
  });
});

describe("financialRepository.findManyQuotes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls findMany and count in parallel", async () => {
    vi.mocked(prisma.quote.findMany).mockResolvedValue([{ id: "q1" }] as never);
    vi.mocked(prisma.quote.count).mockResolvedValue(1);

    const result = await financialRepository.findManyQuotes({ search: "test" });

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("searches by quoteCode, client name, and project name", async () => {
    vi.mocked(prisma.quote.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.quote.count).mockResolvedValue(0);

    await financialRepository.findManyQuotes({ search: "test" });

    const call = vi.mocked(prisma.quote.findMany).mock.calls[0]![0] as {
      where: { OR?: unknown[] };
    };
    expect(call.where.OR).toHaveLength(3);
  });
});

describe("financialRepository.createQuote", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls create with data", async () => {
    vi.mocked(prisma.quote.create).mockResolvedValue({ id: "q1" } as never);

    await financialRepository.createQuote({ quoteCode: "QT-000001", clientId: "c1" } as never);

    expect(prisma.quote.create).toHaveBeenCalledWith({
      data: { quoteCode: "QT-000001", clientId: "c1" },
      include: {
        items: { orderBy: { order: "asc" } },
        client: { select: { id: true, name: true, clientCode: true } },
      },
    });
  });
});

describe("financialRepository.createPayment", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls create with data and includes invoice", async () => {
    vi.mocked(prisma.payment.create).mockResolvedValue({ id: "p1" } as never);

    await financialRepository.createPayment({ paymentCode: "PAY-000001", invoiceId: "i1", amount: 500 } as never);

    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: { paymentCode: "PAY-000001", invoiceId: "i1", amount: 500 },
      include: { invoice: { select: expect.any(Object) } },
    });
  });
});

describe("financialRepository.getFinancialStats", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns aggregated financial statistics", async () => {
    vi.mocked(prisma.payment.aggregate)
      .mockResolvedValueOnce({ _sum: { amount: 500 } } as never)
      .mockResolvedValueOnce({ _sum: { amount: 5000 } } as never);
    vi.mocked(prisma.invoice.aggregate)
      .mockResolvedValueOnce({ _sum: { remainingAmount: 3000 } } as never)
      .mockResolvedValueOnce({ _sum: { total: 7000 } } as never);
    vi.mocked(prisma.invoice.count).mockResolvedValue(2);
    vi.mocked(prisma.quote.count).mockResolvedValue(3);

    const result = await financialRepository.getFinancialStats();

    expect(result.revenueToday).toBe(500);
    expect(result.revenueThisMonth).toBe(5000);
    expect(result.outstandingAmount).toBe(3000);
    expect(result.overdueInvoices).toBe(2);
    expect(result.paidThisMonth).toBe(7000);
    expect(result.pendingQuotes).toBe(3);
  });
});

describe("financialRepository.getClientFinancialSummary", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns client financial summary", async () => {
    vi.mocked(prisma.quote.count).mockResolvedValue(5);
    vi.mocked(prisma.invoice.count).mockResolvedValue(3);
    vi.mocked(prisma.invoice.aggregate)
      .mockResolvedValueOnce({ _sum: { paidAmount: 5000 } } as never)
      .mockResolvedValueOnce({ _sum: { remainingAmount: 2000 } } as never);

    const result = await financialRepository.getClientFinancialSummary("client-1");

    expect(result.totalQuotes).toBe(5);
    expect(result.totalInvoices).toBe(3);
    expect(result.totalPaid).toBe(5000);
    expect(result.outstandingBalance).toBe(2000);
  });
});
