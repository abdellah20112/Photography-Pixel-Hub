import { describe, it, expect, vi, beforeEach } from "vitest";

/* ── Mock dependencies ───────────────────── */

vi.mock("@/repositories/financial.repository", () => ({
  financialRepository: {
    findQuoteById: vi.fn(),
    findManyQuotes: vi.fn(),
    findLatestQuoteCode: vi.fn(),
    createQuote: vi.fn(),
    updateQuote: vi.fn(),
    setQuoteItems: vi.fn().mockResolvedValue(undefined),
    findInvoiceById: vi.fn(),
    findManyInvoices: vi.fn(),
    findLatestInvoiceCode: vi.fn(),
    createInvoice: vi.fn(),
    updateInvoice: vi.fn(),
    setInvoiceItems: vi.fn().mockResolvedValue(undefined),
    findPaymentById: vi.fn(),
    findLatestPaymentCode: vi.fn(),
    createPayment: vi.fn(),
    findManyPayments: vi.fn(),
    getFinancialStats: vi.fn(),
    getClientFinancialSummary: vi.fn(),
  },
}));

vi.mock("@/services/activity.service", () => ({
  activityService: {
    log: vi.fn().mockResolvedValue(undefined),
    list: vi.fn().mockResolvedValue([]),
    count: vi.fn(),
  },
}));

vi.mock("@/services/timeline.service", () => ({
  timelineService: {
    publish: vi.fn().mockResolvedValue(undefined),
    getByProject: vi.fn().mockResolvedValue([]),
    list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    getWorkflowStats: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => {
  const mockTx = {
    quote: { findFirst: vi.fn() },
    invoice: { findFirst: vi.fn() },
    payment: { findFirst: vi.fn() },
  };
  return {
    prisma: {
      ...mockTx,
      $transaction: vi.fn(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)),
    },
  };
});

/* ── Imports ─────────────────────────────── */

import { quoteService, invoiceService, paymentService, financialStatisticsService } from "@/services/financial.service";
import { financialRepository } from "@/repositories/financial.repository";

/* ============================================
   Financial Service Tests
   ============================================ */

const mockQuote = {
  id: "quote-1",
  quoteCode: "QT-000001",
  clientId: "client-1",
  projectId: "project-1",
  status: "DRAFT",
  subtotal: 1000,
  discount: 0,
  tax: 0,
  total: 1000,
  notes: null,
  validUntil: new Date("2026-12-31"),
  createdAt: new Date(),
  updatedAt: new Date(),
  items: [{ id: "qi1", description: "Test", quantity: 1, unitPrice: 1000, total: 1000, order: 0 }],
  client: { id: "client-1", name: "Test Client", clientCode: "CL-000001" },
  project: null,
  invoice: null,
};

const mockInvoice = {
  id: "invoice-1",
  invoiceCode: "INV-000001",
  clientId: "client-1",
  projectId: "project-1",
  quoteId: null,
  status: "DRAFT",
  subtotal: 1000,
  discount: 0,
  tax: 0,
  total: 1000,
  paidAmount: 0,
  remainingAmount: 1000,
  issueDate: new Date(),
  dueDate: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  items: [{ id: "ii1", description: "Test", quantity: 1, unitPrice: 1000, total: 1000, order: 0 }],
  client: { id: "client-1", name: "Test Client", clientCode: "CL-000001" },
  project: null,
  quote: null,
  payments: [],
};

describe("quoteService.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a quote with generated code", async () => {
    vi.mocked(financialRepository.createQuote).mockResolvedValue(mockQuote as never);
    vi.mocked(financialRepository.findQuoteById).mockResolvedValue(mockQuote as never);

    const result = await quoteService.create({
      clientId: "client-1",
      projectId: "project-1",
      items: [{ description: "Test", quantity: 1, unitPrice: 1000, order: 0 }],
      discount: 0,
      tax: 0,
      validUntil: new Date("2026-12-31"),
    });

    expect(result).toEqual(mockQuote);
    expect(financialRepository.createQuote).toHaveBeenCalledWith(
      expect.objectContaining({
        quoteCode: expect.any(String),
        clientId: "client-1",
        total: 1000,
      })
    );
  });

  it("publishes QUOTE_CREATED timeline event when project linked", async () => {
    vi.mocked(financialRepository.createQuote).mockResolvedValue(mockQuote as never);
    vi.mocked(financialRepository.findQuoteById).mockResolvedValue(mockQuote as never);
    const { timelineService } = await import("@/services/timeline.service");

    await quoteService.create({
      clientId: "client-1",
      projectId: "project-1",
      items: [{ description: "Test", quantity: 1, unitPrice: 100, order: 0 }],
      discount: 0, tax: 0,
      validUntil: new Date("2026-12-31"),
    });

    expect(timelineService.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "QUOTE_CREATED",
        projectId: "project-1",
      })
    );
  });
});

describe("quoteService.convertToInvoice", () => {
  beforeEach(() => vi.clearAllMocks());

  it("converts approved quote to invoice with copied items", async () => {
    vi.mocked(financialRepository.findQuoteById).mockResolvedValue({
      ...mockQuote,
      status: "APPROVED",
    } as never);
    vi.mocked(financialRepository.createInvoice).mockResolvedValue(mockInvoice as never);
    vi.mocked(financialRepository.findInvoiceById).mockResolvedValue(mockInvoice as never);

    const result = await quoteService.convertToInvoice("quote-1");

    expect(result).toEqual(mockInvoice);
    expect(financialRepository.createInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "client-1",
        quoteId: "quote-1",
        total: 1000,
        remainingAmount: 1000,
        paidAmount: 0,
      })
    );
    expect(financialRepository.setInvoiceItems).toHaveBeenCalled();
  });

  it("throws if quote not approved", async () => {
    vi.mocked(financialRepository.findQuoteById).mockResolvedValue({
      ...mockQuote,
      status: "DRAFT",
    } as never);

    await expect(quoteService.convertToInvoice("quote-1")).rejects.toThrow("اعتماد");
  });
});

describe("invoiceService.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an invoice with calculated totals", async () => {
    vi.mocked(financialRepository.createInvoice).mockResolvedValue(mockInvoice as never);
    vi.mocked(financialRepository.findInvoiceById).mockResolvedValue(mockInvoice as never);

    const result = await invoiceService.create({
      clientId: "client-1",
      items: [{ description: "Test", quantity: 2, unitPrice: 500, order: 0 }],
      discount: 0,
      tax: 0,
      issueDate: new Date(),
    });

    expect(result).toEqual(mockInvoice);
    expect(financialRepository.createInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        subtotal: 1000,
        total: 1000,
        remainingAmount: 1000,
        paidAmount: 0,
      })
    );
  });
});

describe("paymentService.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates payment and updates invoice", async () => {
    vi.mocked(financialRepository.findInvoiceById).mockResolvedValue({
      ...mockInvoice,
      total: 1000,
      paidAmount: 0,
      remainingAmount: 1000,
    } as never);
    vi.mocked(financialRepository.createPayment).mockResolvedValue({
      id: "pay-1",
      paymentCode: "PAY-000001",
      invoiceId: "invoice-1",
      amount: 500,
      paymentMethod: "CASH",
      reference: null,
      notes: null,
      paidAt: new Date(),
      createdAt: new Date(),
      invoice: { invoiceCode: "INV-000001" },
    } as never);
    vi.mocked(financialRepository.updateInvoice).mockResolvedValue(mockInvoice as never);

    const result = await paymentService.create({
      invoiceId: "invoice-1",
      amount: 500,
    });

    expect(result).toBeDefined();
    expect(financialRepository.createPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 500,
        invoiceId: "invoice-1",
      })
    );

    // Invoice should be updated with new paid/remaining/status
    expect(financialRepository.updateInvoice).toHaveBeenCalledWith(
      "invoice-1",
      expect.objectContaining({
        paidAmount: 500,
        remainingAmount: 500,
        status: "PARTIALLY_PAID",
      })
    );
  });

  it("sets invoice to PAID when fully paid", async () => {
    vi.mocked(financialRepository.findInvoiceById).mockResolvedValue({
      ...mockInvoice,
      total: 1000,
      paidAmount: 500,
      remainingAmount: 500,
    } as never);
    vi.mocked(financialRepository.createPayment).mockResolvedValue({
      id: "pay-2",
      paymentCode: "PAY-000002",
      amount: 500,
      invoiceId: "invoice-1",
      paymentMethod: "CASH",
      reference: null,
      notes: null,
      paidAt: new Date(),
      createdAt: new Date(),
      invoice: { invoiceCode: "INV-000001" },
    } as never);
    vi.mocked(financialRepository.updateInvoice).mockResolvedValue(mockInvoice as never);

    await paymentService.create({
      invoiceId: "invoice-1",
      amount: 500,
    });

    expect(financialRepository.updateInvoice).toHaveBeenCalledWith(
      "invoice-1",
      expect.objectContaining({
        paidAmount: 1000,
        remainingAmount: 0,
        status: "PAID",
      })
    );
  });

  it("throws when payment exceeds remaining amount", async () => {
    vi.mocked(financialRepository.findInvoiceById).mockResolvedValue({
      ...mockInvoice,
      total: 1000,
      paidAmount: 800,
      remainingAmount: 200,
    } as never);

    await expect(
      paymentService.create({
        invoiceId: "invoice-1",
        amount: 500,
      })
    ).rejects.toThrow("يتجاوز");
  });

  it("publishes PAYMENT_RECEIVED timeline event", async () => {
    vi.mocked(financialRepository.findInvoiceById).mockResolvedValue({
      ...mockInvoice,
      projectId: "project-1",
      total: 1000,
      paidAmount: 0,
      remainingAmount: 1000,
    } as never);
    vi.mocked(financialRepository.createPayment).mockResolvedValue({
      id: "pay-1",
      paymentCode: "PAY-000001",
      amount: 500,
      invoiceId: "invoice-1",
      paymentMethod: "CASH",
      reference: null,
      notes: null,
      paidAt: new Date(),
      createdAt: new Date(),
      invoice: { invoiceCode: "INV-000001" },
    } as never);
    vi.mocked(financialRepository.updateInvoice).mockResolvedValue(mockInvoice as never);
    const { timelineService } = await import("@/services/timeline.service");

    await paymentService.create({
      invoiceId: "invoice-1",
      amount: 500,
    });

    expect(timelineService.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "PAYMENT_RECEIVED",
        projectId: "project-1",
      })
    );
  });
});

describe("financialStatisticsService.getStats", () => {
  beforeEach(() => vi.clearAllMocks());

  it("delegates to repository", async () => {
    const stats = {
      revenueToday: 500,
      revenueThisMonth: 5000,
      outstandingAmount: 3000,
      overdueInvoices: 2,
      paidThisMonth: 7000,
      pendingQuotes: 3,
    };
    vi.mocked(financialRepository.getFinancialStats).mockResolvedValue(stats);

    const result = await financialStatisticsService.getStats();

    expect(result).toEqual(stats);
  });
});

describe("financialStatisticsService.getClientSummary", () => {
  it("delegates to repository", async () => {
    const summary = {
      totalQuotes: 5,
      totalInvoices: 3,
      totalPaid: 5000,
      outstandingBalance: 2000,
    };
    vi.mocked(financialRepository.getClientFinancialSummary).mockResolvedValue(summary);

    const result = await financialStatisticsService.getClientSummary("client-1");

    expect(result).toEqual(summary);
  });
});
