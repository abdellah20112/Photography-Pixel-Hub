import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/* ============================================
   Financial Repository
   Quote, Invoice, and Payment data access.
   ============================================ */

export const financialRepository = {
  // ── Quotes ──────────────────────────────

  findQuoteById(id: string) {
    return prisma.quote.findUnique({
      where: { id },
      include: {
        items: { orderBy: { order: "asc" } },
        client: { select: { id: true, name: true, clientCode: true } },
        project: { select: { id: true, name: true, projectCode: true } },
        invoice: true,
      },
    });
  },

  async findManyQuotes(params: {
    search?: string;
    clientId?: string;
    projectId?: string;
    filter?: string;
    sort?: string;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.QuoteWhereInput = {};

    if (params.filter && params.filter !== "all") {
      const map: Record<string, string> = {
        draft: "DRAFT", sent: "SENT", approved: "APPROVED",
        rejected: "REJECTED", expired: "EXPIRED",
      };
      if (map[params.filter]) where.status = map[params.filter] as never;
    }

    if (params.clientId) where.clientId = params.clientId;
    if (params.projectId) where.projectId = params.projectId;

    if (params.search) {
      where.OR = [
        { quoteCode: { contains: params.search, mode: "insensitive" } },
        { client: { name: { contains: params.search, mode: "insensitive" } } },
        { project: { name: { contains: params.search, mode: "insensitive" } } },
      ];
    }

    const orderBy: Prisma.QuoteOrderByWithRelationInput = params.sort === "oldest"
      ? { createdAt: "asc" }
      : params.sort === "amount_asc" ? { total: "asc" }
      : params.sort === "amount_desc" ? { total: "desc" }
      : { createdAt: "desc" };

    const [items, total] = await Promise.all([
      prisma.quote.findMany({
        where, skip: params.skip, take: params.take, orderBy,
        include: { client: { select: { id: true, name: true, clientCode: true } } },
      }),
      prisma.quote.count({ where }),
    ]);

    return { items, total };
  },

  findLatestQuoteCode() {
    return prisma.quote.findFirst({
      orderBy: { quoteCode: "desc" },
      select: { quoteCode: true },
    });
  },

  createQuote(data: Prisma.QuoteUncheckedCreateInput) {
    return prisma.quote.create({
      data,
      include: {
        items: { orderBy: { order: "asc" } },
        client: { select: { id: true, name: true, clientCode: true } },
      },
    });
  },

  updateQuote(id: string, data: Prisma.QuoteUncheckedUpdateInput) {
    return prisma.quote.update({
      where: { id },
      data,
      include: {
        items: { orderBy: { order: "asc" } },
        client: { select: { id: true, name: true, clientCode: true } },
      },
    });
  },

  async setQuoteItems(quoteId: string, items: Array<{ description: string; quantity: number; unitPrice: number; total: number; order: number }>) {
    await prisma.quoteItem.deleteMany({ where: { quoteId } });
    if (items.length > 0) {
      await prisma.quoteItem.createMany({
        data: items.map(item => ({ ...item, quoteId })),
      });
    }
  },

  // ── Invoices ──────────────────────────────

  findInvoiceById(id: string) {
    return prisma.invoice.findUnique({
      where: { id },
      include: {
        items: { orderBy: { order: "asc" } },
        client: { select: { id: true, name: true, clientCode: true } },
        project: { select: { id: true, name: true, projectCode: true } },
        quote: true,
        payments: { orderBy: { paidAt: "desc" } },
      },
    });
  },

  async findManyInvoices(params: {
    search?: string;
    clientId?: string;
    projectId?: string;
    filter?: string;
    sort?: string;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.InvoiceWhereInput = {};

    if (params.filter && params.filter !== "all") {
      const map: Record<string, string> = {
        draft: "DRAFT", sent: "SENT", partially_paid: "PARTIALLY_PAID",
        paid: "PAID", overdue: "OVERDUE", cancelled: "CANCELLED",
      };
      if (map[params.filter]) where.status = map[params.filter] as never;
    }

    if (params.clientId) where.clientId = params.clientId;
    if (params.projectId) where.projectId = params.projectId;

    if (params.search) {
      where.OR = [
        { invoiceCode: { contains: params.search, mode: "insensitive" } },
        { client: { name: { contains: params.search, mode: "insensitive" } } },
      ];
    }

    const orderBy: Prisma.InvoiceOrderByWithRelationInput = params.sort === "oldest"
      ? { createdAt: "asc" }
      : params.sort === "amount_asc" ? { total: "asc" }
      : params.sort === "amount_desc" ? { total: "desc" }
      : { createdAt: "desc" };

    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        where, skip: params.skip, take: params.take, orderBy,
        include: { client: { select: { id: true, name: true, clientCode: true } } },
      }),
      prisma.invoice.count({ where }),
    ]);

    return { items, total };
  },

  findLatestInvoiceCode() {
    return prisma.invoice.findFirst({
      orderBy: { invoiceCode: "desc" },
      select: { invoiceCode: true },
    });
  },

  createInvoice(data: Prisma.InvoiceUncheckedCreateInput) {
    return prisma.invoice.create({
      data,
      include: {
        items: { orderBy: { order: "asc" } },
        client: { select: { id: true, name: true, clientCode: true } },
      },
    });
  },

  updateInvoice(id: string, data: Prisma.InvoiceUncheckedUpdateInput) {
    return prisma.invoice.update({
      where: { id },
      data,
    });
  },

  async setInvoiceItems(invoiceId: string, items: Array<{ description: string; quantity: number; unitPrice: number; total: number; order: number }>) {
    await prisma.invoiceItem.deleteMany({ where: { invoiceId } });
    if (items.length > 0) {
      await prisma.invoiceItem.createMany({
        data: items.map(item => ({ ...item, invoiceId })),
      });
    }
  },

  // ── Payments ──────────────────────────────

  findPaymentById(id: string) {
    return prisma.payment.findUnique({
      where: { id },
      include: { invoice: { select: { id: true, invoiceCode: true, total: true, paidAmount: true, remainingAmount: true } } },
    });
  },

  findLatestPaymentCode() {
    return prisma.payment.findFirst({
      orderBy: { paymentCode: "desc" },
      select: { paymentCode: true },
    });
  },

  createPayment(data: Prisma.PaymentUncheckedCreateInput) {
    return prisma.payment.create({
      data,
      include: { invoice: { select: { id: true, invoiceCode: true, total: true, paidAmount: true, remainingAmount: true } } },
    });
  },

  async findManyPayments(params: {
    search?: string;
    clientId?: string;
    skip?: number;
    take?: number;
    sort?: string;
  }) {
    const where: Prisma.PaymentWhereInput = {};

    if (params.clientId) where.invoice = { clientId: params.clientId };

    if (params.search) {
      where.OR = [
        { paymentCode: { contains: params.search, mode: "insensitive" } },
        { invoice: { invoiceCode: { contains: params.search, mode: "insensitive" } } },
        { invoice: { client: { name: { contains: params.search, mode: "insensitive" } } } },
      ];
    }

    const orderBy: Prisma.PaymentOrderByWithRelationInput = params.sort === "oldest"
      ? { paidAt: "asc" }
      : params.sort === "amount_asc" ? { amount: "asc" }
      : params.sort === "amount_desc" ? { amount: "desc" }
      : { paidAt: "desc" };

    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where, skip: params.skip, take: params.take, orderBy,
        include: { invoice: { select: { invoiceCode: true, client: { select: { name: true } } } } },
      }),
      prisma.payment.count({ where }),
    ]);

    return { items, total };
  },

  // ── Statistics ────────────────────────────

  async getFinancialStats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [paymentsToday, paymentsThisMonth, outstandingInvoices, overdueInvoices, paidThisMonth, pendingQuotes] = await Promise.all([
      prisma.payment.aggregate({
        where: { paidAt: { gte: startOfToday } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.invoice.aggregate({
        where: { status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] } },
        _sum: { remainingAmount: true },
      }),
      prisma.invoice.count({ where: { status: "OVERDUE" } }),
      prisma.invoice.aggregate({
        where: { status: "PAID", updatedAt: { gte: startOfMonth } },
        _sum: { total: true },
      }),
      prisma.quote.count({ where: { status: { in: ["DRAFT", "SENT"] } } }),
    ]);

    return {
      revenueToday: paymentsToday._sum.amount ?? 0,
      revenueThisMonth: paymentsThisMonth._sum.amount ?? 0,
      outstandingAmount: outstandingInvoices._sum.remainingAmount ?? 0,
      overdueInvoices,
      paidThisMonth: paidThisMonth._sum.total ?? 0,
      pendingQuotes,
    };
  },

  async getClientFinancialSummary(clientId: string) {
    const [quotes, invoices, paidInvoices, outstandingInvoices] = await Promise.all([
      prisma.quote.count({ where: { clientId } }),
      prisma.invoice.count({ where: { clientId } }),
      prisma.invoice.aggregate({
        where: { clientId, status: "PAID" },
        _sum: { paidAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { clientId, status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] } },
        _sum: { remainingAmount: true },
      }),
    ]);

    return {
      totalQuotes: quotes,
      totalInvoices: invoices,
      totalPaid: paidInvoices._sum.paidAmount ?? 0,
      outstandingBalance: outstandingInvoices._sum.remainingAmount ?? 0,
    };
  },
};
