/* ============================================
   PDF Service Architecture
   Architecture only — no rendering implementation.
   Future: generate Quote/Invoice PDF documents.
   ============================================ */

/** Quote PDF generation interface. */
export interface QuotePdfService {
  /** Generate a PDF buffer for a quote. */
  generate(quoteId: string): Promise<Buffer>;
}

/** Invoice PDF generation interface. */
export interface InvoicePdfService {
  /** Generate a PDF buffer for an invoice. */
  generate(invoiceId: string): Promise<Buffer>;
}

/** Placeholder implementations — to be filled in a future sprint. */
export const quotePdfService: QuotePdfService = {
  async generate(_quoteId: string): Promise<Buffer> {
    throw new Error("QuotePdfService: لم يتم التنفيذ بعد — سيتم في إصدار قادم");
  },
};

export const invoicePdfService: InvoicePdfService = {
  async generate(_invoiceId: string): Promise<Buffer> {
    throw new Error("InvoicePdfService: لم يتم التنفيذ بعد — سيتم في إصدار قادم");
  },
};
