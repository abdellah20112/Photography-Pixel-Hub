import { prisma } from "@/lib/prisma";
import { financialRepository } from "@/repositories/financial.repository";
import { activityService } from "@/services/activity.service";
import { timelineService } from "@/services/timeline.service";
import { calculateTotals } from "@/lib/validations/financial";
import type { QuoteStatus, InvoiceStatus, PaymentMethod } from "@prisma/client";

/* ============================================
   Financial Services
   QuoteService, InvoiceService, PaymentService,
   FinancialStatisticsService.
   ============================================ */

/** Format sequential codes: QT-000001, INV-000001, PAY-000001 */
function formatCode(prefix: string, sequence: number): string {
  return `${prefix}-${String(sequence).padStart(6, "0")}`;
}

async function generateUniqueCode(model: "quote" | "invoice" | "payment", prefix: string): Promise<string> {
  return prisma.$transaction(async (tx) => {
    let latestCode: string | undefined;

    if (model === "quote") {
      const latest = await tx.quote.findFirst({
        orderBy: { quoteCode: "desc" },
        select: { quoteCode: true },
      });
      latestCode = latest?.quoteCode;
    } else if (model === "invoice") {
      const latest = await tx.invoice.findFirst({
        orderBy: { invoiceCode: "desc" },
        select: { invoiceCode: true },
      });
      latestCode = latest?.invoiceCode;
    } else {
      const latest = await tx.payment.findFirst({
        orderBy: { paymentCode: "desc" },
        select: { paymentCode: true },
      });
      latestCode = latest?.paymentCode;
    }

    let sequence = 1;
    if (latestCode) {
      const match = latestCode.match(new RegExp(`^${prefix}-(\\d+)$`));
      if (match) sequence = parseInt(match[1]!, 10) + 1;
    }

    return formatCode(prefix, sequence);
  });
}

/** Determine invoice status from paid amount vs total. */
function determineInvoiceStatus(paidAmount: number, total: number): InvoiceStatus {
  if (paidAmount >= total) return "PAID" as InvoiceStatus;
  if (paidAmount > 0) return "PARTIALLY_PAID" as InvoiceStatus;
  return "SENT" as InvoiceStatus;
}

// ── QuoteService ───────────────────────────

export const quoteService = {
  async getById(id: string) {
    return financialRepository.findQuoteById(id);
  },

  async create(
    data: {
      clientId: string;
      projectId?: string;
      items: Array<{ description: string; quantity: number; unitPrice: number; order: number }>;
      discount: number;
      tax: number;
      notes?: string;
      validUntil: Date;
    },
    options?: { actorId?: string; actorName?: string }
  ) {
    const quoteCode = await generateUniqueCode("quote", "QT");
    const { subtotal, total } = calculateTotals(data.items, data.discount, data.tax);

    const quote = await financialRepository.createQuote({
      quoteCode,
      clientId: data.clientId,
      projectId: data.projectId || null,
      status: "DRAFT" as QuoteStatus,
      subtotal,
      discount: data.discount,
      tax: data.tax,
      total,
      notes: data.notes || null,
      validUntil: data.validUntil,
    });

    // Create items
    const items = data.items.map((item, i) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
      order: i,
    }));
    await financialRepository.setQuoteItems(quote.id, items);

    // Publish timeline if project linked
    if (data.projectId) {
      await timelineService.publish({
        projectId: data.projectId,
        eventType: "QUOTE_CREATED",
        title: "إنشاء عرض سعر",
        description: `${quoteCode} — الإجمالي: ${total.toFixed(0)}`,
        metadata: { quoteId: quote.id, quoteCode, total },
        actorId: options?.actorId,
        actorName: options?.actorName ?? "النظام",
      });
    }

    // Activity log
    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "CREATE",
        entity: "quote",
        entityId: quote.id,
        metadata: { quoteCode, total },
      });
    }

    return financialRepository.findQuoteById(quote.id);
  },

  async update(id: string, data: {
    items: Array<{ description: string; quantity: number; unitPrice: number; order: number }>;
    discount: number;
    tax: number;
    notes?: string;
    validUntil: Date;
    status?: QuoteStatus;
  }, options?: { actorId?: string; actorName?: string }) {
    const { subtotal, total } = calculateTotals(data.items, data.discount, data.tax);

    const quote = await financialRepository.updateQuote(id, {
      subtotal,
      discount: data.discount,
      tax: data.tax,
      total,
      notes: data.notes || null,
      validUntil: data.validUntil,
      ...(data.status ? { status: data.status } : {}),
    });

    const items = data.items.map((item, i) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
      order: i,
    }));
    await financialRepository.setQuoteItems(id, items);

    return financialRepository.findQuoteById(id);
  },

  async updateStatus(id: string, status: QuoteStatus, options?: { actorId?: string; actorName?: string }) {
    const quote = await financialRepository.updateQuote(id, { status });

    // If approved and has project, publish timeline
    if (status === "APPROVED" && quote.projectId) {
      await timelineService.publish({
        projectId: quote.projectId,
        eventType: "QUOTE_APPROVED",
        title: "اعتماد عرض السعر",
        description: `${quote.quoteCode} — الإجمالي: ${quote.total.toFixed(0)}`,
        metadata: { quoteId: id, quoteCode: quote.quoteCode },
        actorId: options?.actorId,
        actorName: options?.actorName ?? "النظام",
      });
    }

    return quote;
  },

  async list(params: {
    search?: string; clientId?: string; projectId?: string;
    filter?: string; sort?: string; skip?: number; take?: number;
  }) {
    return financialRepository.findManyQuotes(params);
  },

  /** Convert an approved quote into an invoice with all items copied. */
  async convertToInvoice(quoteId: string, options?: { actorId?: string; actorName?: string }) {
    const quote = await financialRepository.findQuoteById(quoteId);
    if (!quote) throw new Error("عرض السعر غير موجود");
    if (quote.status !== "APPROVED") throw new Error("يجب اعتماد عرض السعر أولاً");

    const invoiceCode = await generateUniqueCode("invoice", "INV");
    const invoice = await financialRepository.createInvoice({
      invoiceCode,
      clientId: quote.clientId,
      projectId: quote.projectId || null,
      quoteId: quote.id,
      status: "DRAFT" as InvoiceStatus,
      subtotal: quote.subtotal,
      discount: quote.discount,
      tax: quote.tax,
      total: quote.total,
      paidAmount: 0,
      remainingAmount: quote.total,
      issueDate: new Date(),
      dueDate: null,
      notes: quote.notes,
    });

    // Copy items
    const items = quote.items.map((item, i) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
      order: i,
    }));
    await financialRepository.setInvoiceItems(invoice.id, items);

    // Publish timeline if project linked
    if (quote.projectId) {
      await timelineService.publish({
        projectId: quote.projectId,
        eventType: "INVOICE_CREATED",
        title: "إنشاء فاتورة",
        description: `${invoiceCode} — من عرض السعر ${quote.quoteCode}`,
        metadata: { invoiceId: invoice.id, invoiceCode, quoteId },
        actorId: options?.actorId,
        actorName: options?.actorName ?? "النظام",
      });
    }

    return financialRepository.findInvoiceById(invoice.id);
  },
};

// ── InvoiceService ─────────────────────────

export const invoiceService = {
  async getById(id: string) {
    return financialRepository.findInvoiceById(id);
  },

  async create(
    data: {
      clientId: string;
      projectId?: string;
      quoteId?: string;
      items: Array<{ description: string; quantity: number; unitPrice: number; order: number }>;
      discount: number;
      tax: number;
      notes?: string;
      issueDate: Date;
      dueDate?: Date;
    },
    options?: { actorId?: string; actorName?: string }
  ) {
    const invoiceCode = await generateUniqueCode("invoice", "INV");
    const { subtotal, total } = calculateTotals(data.items, data.discount, data.tax);

    const invoice = await financialRepository.createInvoice({
      invoiceCode,
      clientId: data.clientId,
      projectId: data.projectId || null,
      quoteId: data.quoteId || null,
      status: "DRAFT" as InvoiceStatus,
      subtotal,
      discount: data.discount,
      tax: data.tax,
      total,
      paidAmount: 0,
      remainingAmount: total,
      issueDate: data.issueDate,
      dueDate: data.dueDate || null,
      notes: data.notes || null,
    });

    // Create items
    const items = data.items.map((item, i) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
      order: i,
    }));
    await financialRepository.setInvoiceItems(invoice.id, items);

    // Publish timeline if project linked
    if (data.projectId) {
      await timelineService.publish({
        projectId: data.projectId,
        eventType: "INVOICE_CREATED",
        title: "إنشاء فاتورة",
        description: `${invoiceCode} — الإجمالي: ${total.toFixed(0)}`,
        metadata: { invoiceId: invoice.id, invoiceCode, total },
        actorId: options?.actorId,
        actorName: options?.actorName ?? "النظام",
      });
    }

    return financialRepository.findInvoiceById(invoice.id);
  },

  async updateStatus(id: string, status: InvoiceStatus, options?: { actorId?: string; actorName?: string }) {
    const invoice = await financialRepository.updateInvoice(id, { status });

    if (status === "SENT" && invoice.projectId) {
      await timelineService.publish({
        projectId: invoice.projectId,
        eventType: "INVOICE_SENT",
        title: "إرسال فاتورة",
        description: `${invoice.invoiceCode}`,
        metadata: { invoiceId: id },
        actorId: options?.actorId,
        actorName: options?.actorName ?? "النظام",
      });
    }

    return invoice;
  },

  async list(params: {
    search?: string; clientId?: string; projectId?: string;
    filter?: string; sort?: string; skip?: number; take?: number;
  }) {
    return financialRepository.findManyInvoices(params);
  },
};

// ── PaymentService ─────────────────────────

export const paymentService = {
  async getById(id: string) {
    return financialRepository.findPaymentById(id);
  },

  async create(
    data: {
      invoiceId: string;
      amount: number;
      paymentMethod?: PaymentMethod;
      reference?: string;
      notes?: string;
      paidAt?: Date;
    },
    options?: { actorId?: string; actorName?: string }
  ) {
    // Fetch invoice to validate payment
    const invoice = await financialRepository.findInvoiceById(data.invoiceId);
    if (!invoice) throw new Error("الفاتورة غير موجودة");

    // Validate: payment cannot exceed remaining amount
    if (data.amount > invoice.remainingAmount) {
      throw new Error(`المبلغ يتجاوز المتبقي (${invoice.remainingAmount.toFixed(0)})`);
    }

    const paymentCode = await generateUniqueCode("payment", "PAY");
    const payment = await financialRepository.createPayment({
      paymentCode,
      invoiceId: data.invoiceId,
      amount: data.amount,
      paymentMethod: data.paymentMethod ?? ("CASH" as PaymentMethod),
      reference: data.reference || null,
      notes: data.notes || null,
      paidAt: data.paidAt ?? new Date(),
    });

    // Update invoice paid + remaining amounts
    const newPaidAmount = invoice.paidAmount + data.amount;
    const newRemaining = Math.max(0, invoice.total - newPaidAmount);
    const newStatus = determineInvoiceStatus(newPaidAmount, invoice.total);

    await financialRepository.updateInvoice(data.invoiceId, {
      paidAmount: newPaidAmount,
      remainingAmount: newRemaining,
      status: newStatus,
    });

    // Publish timeline if project linked
    if (invoice.projectId) {
      await timelineService.publish({
        projectId: invoice.projectId,
        eventType: "PAYMENT_RECEIVED",
        title: "استلام دفعة",
        description: `${paymentCode} — ${data.amount.toFixed(0)} لـ ${invoice.invoiceCode}`,
        metadata: { paymentId: payment.id, paymentCode, invoiceId: data.invoiceId, amount: data.amount },
        actorId: options?.actorId,
        actorName: options?.actorName ?? "النظام",
      });

      // If invoice fully paid, publish INVOICE_PAID
      if (newStatus === "PAID") {
        await timelineService.publish({
          projectId: invoice.projectId,
          eventType: "INVOICE_PAID",
          title: "سداد الفاتورة بالكامل",
          description: `${invoice.invoiceCode} — ${invoice.total.toFixed(0)}`,
          metadata: { invoiceId: data.invoiceId, invoiceCode: invoice.invoiceCode },
          actorId: options?.actorId,
          actorName: options?.actorName ?? "النظام",
        });
      }
    }

    // Activity log
    if (options?.actorId) {
      await activityService.log({
        userId: options.actorId,
        type: "DOWNLOAD",
        entity: "payment",
        entityId: payment.id,
        metadata: { paymentCode, invoiceId: data.invoiceId, amount: data.amount },
      });
    }

    return payment;
  },

  async list(params: {
    search?: string; clientId?: string;
    skip?: number; take?: number; sort?: string;
  }) {
    return financialRepository.findManyPayments(params);
  },
};

// ── FinancialStatisticsService ─────────────

export const financialStatisticsService = {
  async getStats() {
    return financialRepository.getFinancialStats();
  },

  async getClientSummary(clientId: string) {
    return financialRepository.getClientFinancialSummary(clientId);
  },
};
