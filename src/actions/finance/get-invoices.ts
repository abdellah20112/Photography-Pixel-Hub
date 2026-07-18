"use server";

import { invoiceService } from "@/services/financial.service";
import { getCurrentUser } from "@/lib/auth/session";

/* ============================================
   Get Invoices Server Action
   ============================================ */

export async function getInvoicesAction(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  clientId?: string;
  projectId?: string;
  filter?: string;
  sort?: string;
}) {
  const user = await getCurrentUser();
  if (!user) return { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const skip = (page - 1) * pageSize;

  const { items, total } = await invoiceService.list({
    search: params?.search,
    clientId: params?.clientId,
    projectId: params?.projectId,
    filter: params?.filter,
    sort: params?.sort,
    skip,
    take: pageSize,
  });

  const totalPages = Math.ceil(total / pageSize);

  return {
    items: items.map((inv) => ({
      id: inv.id,
      invoiceCode: inv.invoiceCode,
      clientId: inv.clientId,
      projectId: inv.projectId,
      status: inv.status,
      total: inv.total,
      paidAmount: inv.paidAmount,
      remainingAmount: inv.remainingAmount,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      client: inv.client,
    })),
    total, page, pageSize, totalPages,
  };
}
