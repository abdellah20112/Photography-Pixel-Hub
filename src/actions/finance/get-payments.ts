"use server";

import { paymentService } from "@/services/financial.service";
import { getCurrentUser } from "@/lib/auth/session";

/* ============================================
   Get Payments Server Action
   ============================================ */

export async function getPaymentsAction(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  clientId?: string;
  sort?: string;
}) {
  const user = await getCurrentUser();
  if (!user) return { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const skip = (page - 1) * pageSize;

  const { items, total } = await paymentService.list({
    search: params?.search,
    clientId: params?.clientId,
    skip,
    take: pageSize,
    sort: params?.sort,
  });

  const totalPages = Math.ceil(total / pageSize);

  return {
    items: items.map((p) => ({
      id: p.id,
      paymentCode: p.paymentCode,
      invoiceId: p.invoiceId,
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      reference: p.reference,
      paidAt: p.paidAt,
      invoice: p.invoice
        ? { invoiceCode: p.invoice.invoiceCode }
        : { invoiceCode: "" },
    })),
    total, page, pageSize, totalPages,
  };
}
