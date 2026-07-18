import type { Quote, QuoteItem, Invoice, InvoiceItem, Payment, Client, Project } from "@prisma/client";

/* ============================================
   Financial Types
   ============================================ */

export type QuoteWithItems = Quote & { items: QuoteItem[]; client: Pick<Client, "id" | "name" | "clientCode"> };
export type InvoiceWithItems = Invoice & { items: InvoiceItem[]; client: Pick<Client, "id" | "name" | "clientCode">; payments: Payment[]; quote?: Quote | null };
export type PaymentWithInvoice = Payment & { invoice: Pick<Invoice, "id" | "invoiceCode" | "total" | "paidAmount" | "remainingAmount"> };

export type QuoteTableRow = {
  id: string;
  quoteCode: string;
  clientId: string;
  projectId: string | null;
  status: Quote["status"];
  total: number;
  client: { id: string; name: string; clientCode: string };
  validUntil: Date | null;
  createdAt: Date;
};

export type InvoiceTableRow = {
  id: string;
  invoiceCode: string;
  clientId: string;
  projectId: string | null;
  status: Invoice["status"];
  total: number;
  paidAmount: number;
  remainingAmount: number;
  client: { id: string; name: string; clientCode: string };
  issueDate: Date;
  dueDate: Date | null;
};

export type PaymentTableRow = {
  id: string;
  paymentCode: string;
  invoiceId: string;
  amount: number;
  paymentMethod: Payment["paymentMethod"];
  reference: string | null;
  paidAt: Date;
  invoice: { invoiceCode: string };
};

export type FinancialStats = {
  revenueToday: number;
  revenueThisMonth: number;
  outstandingAmount: number;
  overdueInvoices: number;
  paidThisMonth: number;
  pendingQuotes: number;
};

export type ClientFinancialSummary = {
  totalQuotes: number;
  totalInvoices: number;
  totalPaid: number;
  outstandingBalance: number;
};
