import { z } from "zod";

/* ============================================
   Financial Validation Schemas
   Arabic validation messages.
   ============================================ */

/* ── Enums ─────────────────────────────────── */

export const quoteStatusSchema = z.enum(["DRAFT", "SENT", "APPROVED", "REJECTED", "EXPIRED"]);
export const invoiceStatusSchema = z.enum(["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"]);
export const paymentMethodSchema = z.enum(["CASH", "BANK_TRANSFER", "CREDIT_CARD", "OTHER"]);

export const quoteFilterSchema = z.enum(["all", "draft", "sent", "approved", "rejected", "expired"]);
export const invoiceFilterSchema = z.enum(["all", "draft", "sent", "partially_paid", "paid", "overdue", "cancelled"]);
export const financialSortSchema = z.enum(["newest", "oldest", "alphabetical", "amount_desc", "amount_asc"]);

/* ── Quote Item ────────────────────────────── */

export const quoteItemSchema = z.object({
  description: z.string().min(1, "الوصف مطلوب").max(500, "الوصف يجب أن يكون 500 حرف كحد أقصى"),
  quantity: z.coerce.number().int().min(1, "الكمية يجب أن تكون 1 على الأقل"),
  unitPrice: z.coerce.number().min(0, "السعر يجب أن يكون موجباً"),
  total: z.coerce.number().min(0, "الإجمالي يجب أن يكون موجباً"),
  order: z.coerce.number().int().default(0),
});

/* ── Create Quote ─────────────────────────── */

export const createQuoteSchema = z.object({
  clientId: z.string().min(1, "العميل مطلوب"),
  projectId: z.string().optional().or(z.literal("")),
  items: z.array(quoteItemSchema).min(1, "أضف بنداً واحداً على الأقل"),
  discount: z.coerce.number().min(0, "الخصم يجب أن يكون موجباً").default(0),
  tax: z.coerce.number().min(0, "الضريبة يجب أن تكون موجبة").default(0),
  notes: z.string().max(1000, "الملاحظات يجب أن تكون 1000 حرف كحد أقصى").optional().or(z.literal("")),
  validUntil: z.coerce.date({ message: "تاريخ الصلاحية غير صالح" }),
});

/* ── Update Quote ─────────────────────────── */

export const updateQuoteSchema = createQuoteSchema.extend({
  status: quoteStatusSchema.optional(),
});

/* ── Create Invoice ───────────────────────── */

export const createInvoiceSchema = z.object({
  clientId: z.string().min(1, "العميل مطلوب"),
  projectId: z.string().optional().or(z.literal("")),
  quoteId: z.string().optional().or(z.literal("")),
  items: z.array(quoteItemSchema).min(1, "أضف بنداً واحداً على الأقل"),
  discount: z.coerce.number().min(0, "الخصم يجب أن يكون موجباً").default(0),
  tax: z.coerce.number().min(0, "الضريبة يجب أن تكون موجبة").default(0),
  notes: z.string().max(1000).optional().or(z.literal("")),
  issueDate: z.coerce.date({ message: "تاريخ الإصدار غير صالح" }),
  dueDate: z.coerce.date({ message: "تاريخ الاستحقاق غير صالح" }).optional(),
});

/* ── Create Payment ───────────────────────── */

export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1, "الفاتورة مطلوبة"),
  amount: z.coerce.number().positive("المبلغ يجب أن يكون موجباً"),
  paymentMethod: paymentMethodSchema.default("CASH"),
  reference: z.string().max(200).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
  paidAt: z.coerce.date().optional(),
});

/* ── Query ────────────────────────────────── */

export const financialQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().refine(
    (val) => [10, 25, 50, 100].includes(val),
    "عدد العناصر في الصفحة غير صالح"
  ).default(10),
  search: z.string().optional(),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  filter: z.string().optional(),
  sort: financialSortSchema.optional(),
});

/* ── Calculation Helpers ──────────────────── */

/** Calculate quote/invoice totals from items. */
export function calculateTotals(
  items: Array<{ quantity: number; unitPrice: number }>,
  discount: number,
  tax: number
): { subtotal: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const afterDiscount = Math.max(0, subtotal - discount);
  const taxAmount = afterDiscount * (tax / 100);
  const total = afterDiscount + taxAmount;
  return { subtotal, total };
}

/* ── Types ────────────────────────────────── */

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type FinancialQueryInput = z.infer<typeof financialQuerySchema>;
export type QuoteStatusValue = z.infer<typeof quoteStatusSchema>;
export type InvoiceStatusValue = z.infer<typeof invoiceStatusSchema>;
export type PaymentMethodValue = z.infer<typeof paymentMethodSchema>;
