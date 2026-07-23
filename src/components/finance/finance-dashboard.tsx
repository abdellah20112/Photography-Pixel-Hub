"use client";

import { useState, useCallback, useEffect, useTransition } from "react";
import {
  Wallet,
  FileText,
  Receipt,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Search,
  Plus,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { SectionTitle } from "@/components/shared/section-title";
import { formatNumber, formatDate } from "@/lib/utils/format";
import { PAGINATION } from "@/lib/constants";
import { getFinancialStatsAction } from "@/actions/finance/get-financial-stats";
import { getQuotesAction } from "@/actions/finance/get-quotes";
import { getInvoicesAction } from "@/actions/finance/get-invoices";
import { getPaymentsAction } from "@/actions/finance/get-payments";
import type {
  QuoteTableRow,
  InvoiceTableRow,
  PaymentTableRow,
  FinancialStats,
} from "@/types/financial";

/* ============================================
   FinanceDashboard — Quotes, Invoices, Payments
   Stats · Search · Filter · Sort · Pagination
   ============================================ */

/* ── Types ────────────────────────────────── */

type TabKey = "quotes" | "invoices" | "payments";
type QuoteFilterValue =
  | "all"
  | "draft"
  | "sent"
  | "approved"
  | "rejected"
  | "expired";
type InvoiceFilterValue =
  | "all"
  | "draft"
  | "sent"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled";
type FinanceSortValue = "newest" | "oldest" | "amount_desc" | "amount_asc";

type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/* ── Constants ─────────────────────────────── */

const TAB_OPTIONS: { value: TabKey; label: string }[] = [
  { value: "quotes", label: "عروض الأسعار" },
  { value: "invoices", label: "الفواتير" },
  { value: "payments", label: "المدفوعات" },
];

const QUOTE_FILTER_OPTIONS: { value: QuoteFilterValue; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "draft", label: "مسودة" },
  { value: "sent", label: "مرسلة" },
  { value: "approved", label: "معتمدة" },
  { value: "rejected", label: "مرفوضة" },
  { value: "expired", label: "منتهية" },
];

const INVOICE_FILTER_OPTIONS: { value: InvoiceFilterValue; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "draft", label: "مسودة" },
  { value: "sent", label: "مرسلة" },
  { value: "partially_paid", label: "مدفوعة جزئياً" },
  { value: "paid", label: "مدفوعة" },
  { value: "overdue", label: "متأخرة" },
  { value: "cancelled", label: "ملغاة" },
];

const SORT_OPTIONS: { value: FinanceSortValue; label: string }[] = [
  { value: "newest", label: "الأحدث" },
  { value: "oldest", label: "الأقدم" },
  { value: "amount_desc", label: "المبلغ: الأعلى" },
  { value: "amount_asc", label: "المبلغ: الأقل" },
];

/* ── StatCard (from executive-dashboard pattern) ── */

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <DashboardCard className="p-4">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </DashboardCard>
  );
}

/* ── Status Badge Helpers ─────────────────── */

function quoteStatusBadge(status: QuoteTableRow["status"]) {
  switch (status) {
    case "DRAFT":
      return <Badge variant="secondary">مسودة</Badge>;
    case "SENT":
      return (
        <Badge variant="default" className="bg-blue-600 hover:bg-blue-600">
          مرسلة
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge variant="default" className="bg-green-600 hover:bg-green-600">
          معتمدة
        </Badge>
      );
    case "REJECTED":
      return <Badge variant="destructive">مرفوضة</Badge>;
    case "EXPIRED":
      return <Badge variant="secondary">منتهية</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function invoiceStatusBadge(status: InvoiceTableRow["status"]) {
  switch (status) {
    case "DRAFT":
      return <Badge variant="secondary">مسودة</Badge>;
    case "SENT":
      return <Badge variant="default">مرسلة</Badge>;
    case "PARTIALLY_PAID":
      return (
        <Badge variant="default" className="bg-amber-600 hover:bg-amber-600">
          مدفوعة جزئياً
        </Badge>
      );
    case "PAID":
      return (
        <Badge variant="default" className="bg-green-600 hover:bg-green-600">
          مدفوعة
        </Badge>
      );
    case "OVERDUE":
      return <Badge variant="destructive">متأخرة</Badge>;
    case "CANCELLED":
      return <Badge variant="secondary">ملغاة</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function paymentMethodLabel(method: PaymentTableRow["paymentMethod"]): string {
  switch (method) {
    case "CASH":
      return "نقدي";
    case "BANK_TRANSFER":
      return "تحويل بنكي";
    case "CREDIT_CARD":
      return "بطاقة ائتمان";
    case "OTHER":
      return "أخرى";
    default:
      return method;
  }
}

/* ============================================
   QuotesTable — Full-featured quote list
   ============================================ */

function QuotesTable() {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<PaginatedResult<QuoteTableRow> | null>(
    null
  );

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filter, setFilter] = useState<QuoteFilterValue>("all");
  const [sort, setSort] = useState<FinanceSortValue>("newest");
  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const [pageSize, setPageSize] = useState<number>(PAGINATION.DEFAULT_PAGE_SIZE);

  const fetchData = useCallback(async () => {
    startTransition(async () => {
      try {
        const result = await getQuotesAction({
          page,
          pageSize,
          search: search || undefined,
          filter,
          sort,
        });
        setData(result);
      } catch {
        toast.error("فشل في تحميل عروض الأسعار");
      }
    });
  }, [page, pageSize, search, filter, sort]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleCreate = () => {
    toast.info("سيتم توفير نموذج إنشاء عرض السعر قريباً");
  };

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const isLoading = isPending && !data;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="بحث بالكود أو العميل..."
            className="ps-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="بحث عن عروض الأسعار"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">عرض سعر جديد</span>
          </Button>
        </div>
      </div>

      {/* Filters + Sort */}
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1"
          role="tablist"
          aria-label="تصفية حالة العرض"
        >
          {QUOTE_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              role="tab"
              aria-selected={filter === opt.value}
              onClick={() => {
                setFilter(opt.value);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === opt.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as FinanceSortValue);
              setPage(1);
            }}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="ترتيب حسب"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="rounded-xl border">
          <div className="space-y-0">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 border-b p-4 last:border-0"
              >
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border bg-card">
          <EmptyState
            icon={FileText}
            title={search ? "لا توجد نتائج" : "لا توجد عروض أسعار بعد"}
            description={
              search
                ? "جرّب تغيير كلمات البحث أو الفلاتر"
                : "ابدأ بإنشاء عروض الأسعار للعملاء"
            }
            action={
              !search ? (
                <Button size="sm" onClick={handleCreate}>
                  <Plus className="h-4 w-4" />
                  عرض سعر جديد
                </Button>
              ) : undefined
            }
            className="py-20"
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
              <tr className="border-b">
                <th
                  scope="col"
                  className="px-4 py-3 text-start font-medium text-muted-foreground"
                >
                  كود العرض
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-start font-medium text-muted-foreground"
                >
                  العميل
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-start font-medium text-muted-foreground"
                >
                  الإجمالي
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-start font-medium text-muted-foreground"
                >
                  الحالة
                </th>
                <th
                  scope="col"
                  className="hidden px-4 py-3 text-start font-medium text-muted-foreground md:table-cell"
                >
                  صالح حتى
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-end font-medium text-muted-foreground"
                >
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((quote) => (
                <tr
                  key={quote.id}
                  className="group transition-colors hover:bg-muted/50"
                >
                  <td className="px-4 py-3 font-mono text-xs text-primary">
                    {quote.quoteCode}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {quote.client.name}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {formatNumber(quote.total)}
                  </td>
                  <td className="px-4 py-3">{quoteStatusBadge(quote.status)}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {quote.validUntil ? formatDate(quote.validUntil) : "—"}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        toast.info("سيتم توفير صفحة التفاصيل قريباً")
                      }
                    >
                      عرض
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>عرض</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-7 rounded-md border border-input bg-transparent px-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="عدد العناصر في الصفحة"
            >
              {PAGINATION.PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>من {formatNumber(total)} عرض</span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="الصفحة السابقة"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="px-2 text-xs text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                aria-label="الصفحة التالية"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================
   InvoicesTable — Full-featured invoice list
   ============================================ */

function InvoicesTable() {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<PaginatedResult<InvoiceTableRow> | null>(
    null
  );

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filter, setFilter] = useState<InvoiceFilterValue>("all");
  const [sort, setSort] = useState<FinanceSortValue>("newest");
  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const [pageSize, setPageSize] = useState<number>(PAGINATION.DEFAULT_PAGE_SIZE);

  const fetchData = useCallback(async () => {
    startTransition(async () => {
      try {
        const result = await getInvoicesAction({
          page,
          pageSize,
          search: search || undefined,
          filter,
          sort,
        });
        setData(result);
      } catch {
        toast.error("فشل في تحميل الفواتير");
      }
    });
  }, [page, pageSize, search, filter, sort]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleCreate = () => {
    toast.info("سيتم توفير نموذج إنشاء فاتورة قريباً");
  };

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const isLoading = isPending && !data;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="بحث بالكود أو العميل..."
            className="ps-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="بحث عن الفواتير"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">فاتورة جديدة</span>
          </Button>
        </div>
      </div>

      {/* Filters + Sort */}
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="flex flex-wrap items-center gap-1 rounded-lg border bg-muted/50 p-1"
          role="tablist"
          aria-label="تصفية حالة الفاتورة"
        >
          {INVOICE_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              role="tab"
              aria-selected={filter === opt.value}
              onClick={() => {
                setFilter(opt.value);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === opt.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as FinanceSortValue);
              setPage(1);
            }}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="ترتيب حسب"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="rounded-xl border">
          <div className="space-y-0">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 border-b p-4 last:border-0"
              >
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border bg-card">
          <EmptyState
            icon={Receipt}
            title={search ? "لا توجد نتائج" : "لا توجد فواتير بعد"}
            description={
              search
                ? "جرّب تغيير كلمات البحث أو الفلاتر"
                : "ابدأ بإنشاء الفواتير للعملاء"
            }
            action={
              !search ? (
                <Button size="sm" onClick={handleCreate}>
                  <Plus className="h-4 w-4" />
                  فاتورة جديدة
                </Button>
              ) : undefined
            }
            className="py-20"
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
              <tr className="border-b">
                <th
                  scope="col"
                  className="px-4 py-3 text-start font-medium text-muted-foreground"
                >
                  كود الفاتورة
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-start font-medium text-muted-foreground"
                >
                  العميل
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-start font-medium text-muted-foreground"
                >
                  الإجمالي
                </th>
                <th
                  scope="col"
                  className="hidden px-4 py-3 text-start font-medium text-muted-foreground sm:table-cell"
                >
                  المدفوع
                </th>
                <th
                  scope="col"
                  className="hidden px-4 py-3 text-start font-medium text-muted-foreground md:table-cell"
                >
                  المتبقي
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-start font-medium text-muted-foreground"
                >
                  الحالة
                </th>
                <th
                  scope="col"
                  className="hidden px-4 py-3 text-start font-medium text-muted-foreground lg:table-cell"
                >
                  تاريخ الإصدار
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-end font-medium text-muted-foreground"
                >
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="group transition-colors hover:bg-muted/50"
                >
                  <td className="px-4 py-3 font-mono text-xs text-primary">
                    {invoice.invoiceCode}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {invoice.client.name}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {formatNumber(invoice.total)}
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-muted-foreground sm:table-cell">
                    {formatNumber(invoice.paidAmount)}
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-muted-foreground md:table-cell">
                    {formatNumber(invoice.remainingAmount)}
                  </td>
                  <td className="px-4 py-3">
                    {invoiceStatusBadge(invoice.status)}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {formatDate(invoice.issueDate)}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        toast.info("سيتم توفير صفحة التفاصيل قريباً")
                      }
                    >
                      عرض
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>عرض</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-7 rounded-md border border-input bg-transparent px-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="عدد العناصر في الصفحة"
            >
              {PAGINATION.PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>من {formatNumber(total)} فاتورة</span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="الصفحة السابقة"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="px-2 text-xs text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                aria-label="الصفحة التالية"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================
   PaymentsTable — Full-featured payment list
   ============================================ */

function PaymentsTable() {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<PaginatedResult<PaymentTableRow> | null>(
    null
  );

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sort, setSort] = useState<FinanceSortValue>("newest");
  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const [pageSize, setPageSize] = useState<number>(PAGINATION.DEFAULT_PAGE_SIZE);

  const fetchData = useCallback(async () => {
    startTransition(async () => {
      try {
        const result = await getPaymentsAction({
          page,
          pageSize,
          search: search || undefined,
          sort,
        });
        setData(result);
      } catch {
        toast.error("فشل في تحميل المدفوعات");
      }
    });
  }, [page, pageSize, search, sort]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleCreate = () => {
    toast.info("سيتم توفير نموذج تسجيل دفعة قريباً");
  };

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const isLoading = isPending && !data;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="بحث بالكود أو الفاتورة..."
            className="ps-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="بحث عن المدفوعات"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">تسجيل دفعة</span>
          </Button>
        </div>
      </div>

      {/* Sort */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as FinanceSortValue);
              setPage(1);
            }}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="ترتيب حسب"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="rounded-xl border">
          <div className="space-y-0">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 border-b p-4 last:border-0"
              >
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border bg-card">
          <EmptyState
            icon={DollarSign}
            title={search ? "لا توجد نتائج" : "لا توجد مدفوعات بعد"}
            description={
              search
                ? "جرّب تغيير كلمات البحث"
                : "ابدأ بتسجيل المدفوعات للفواتير"
            }
            action={
              !search ? (
                <Button size="sm" onClick={handleCreate}>
                  <Plus className="h-4 w-4" />
                  تسجيل دفعة
                </Button>
              ) : undefined
            }
            className="py-20"
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
              <tr className="border-b">
                <th
                  scope="col"
                  className="px-4 py-3 text-start font-medium text-muted-foreground"
                >
                  كود الدفعة
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-start font-medium text-muted-foreground"
                >
                  الفاتورة
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-start font-medium text-muted-foreground"
                >
                  المبلغ
                </th>
                <th
                  scope="col"
                  className="hidden px-4 py-3 text-start font-medium text-muted-foreground sm:table-cell"
                >
                  طريقة الدفع
                </th>
                <th
                  scope="col"
                  className="hidden px-4 py-3 text-start font-medium text-muted-foreground md:table-cell"
                >
                  تاريخ الدفع
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((payment) => (
                <tr
                  key={payment.id}
                  className="group transition-colors hover:bg-muted/50"
                >
                  <td className="px-4 py-3 font-mono text-xs text-primary">
                    {payment.paymentCode}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {payment.invoice.invoiceCode || "—"}
                  </td>
                  <td className="px-4 py-3 font-mono font-medium">
                    {formatNumber(payment.amount)}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {paymentMethodLabel(payment.paymentMethod)}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {formatDate(payment.paidAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>عرض</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-7 rounded-md border border-input bg-transparent px-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="عدد العناصر في الصفحة"
            >
              {PAGINATION.PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>من {formatNumber(total)} دفعة</span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="الصفحة السابقة"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="px-2 text-xs text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                aria-label="الصفحة التالية"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================
   FinanceDashboard — Main exported component
   ============================================ */

export function FinanceDashboard() {
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [statsPending, startStatsTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TabKey>("quotes");

  const fetchStats = useCallback(async () => {
    startStatsTransition(async () => {
      try {
        const result = await getFinancialStatsAction();
        setStats(result);
      } catch {
        toast.error("فشل في تحميل الإحصائيات المالية");
      }
    });
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statsLoading = statsPending && !stats;

  return (
    <div className="space-y-8">
      {/* Financial Stats */}
      <div className="space-y-4">
        <SectionTitle title="الإحصائيات المالية" />
        {statsLoading || !stats ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard
              icon={DollarSign}
              label="إيراد اليوم"
              value={formatNumber(stats.revenueToday)}
              color="bg-green-500/10 text-green-500"
            />
            <StatCard
              icon={TrendingUp}
              label="إيراد الشهر"
              value={formatNumber(stats.revenueThisMonth)}
              color="bg-blue-500/10 text-blue-500"
            />
            <StatCard
              icon={Wallet}
              label="رصيد مستحق"
              value={formatNumber(stats.outstandingAmount)}
              color="bg-amber-500/10 text-amber-500"
            />
            <StatCard
              icon={AlertCircle}
              label="فواتير متأخرة"
              value={formatNumber(stats.overdueInvoices)}
              color="bg-red-500/10 text-red-500"
            />
            <StatCard
              icon={CheckCircle2}
              label="مدفوع الشهر"
              value={formatNumber(stats.paidThisMonth)}
              color="bg-teal-500/10 text-teal-500"
            />
            <StatCard
              icon={FileText}
              label="عروض معلقة"
              value={formatNumber(stats.pendingQuotes)}
              color="bg-purple-500/10 text-purple-500"
            />
          </div>
        )}
      </div>

      {/* Tabs + Tables */}
      <div className="space-y-4">
        <SectionTitle title="إدارة المعاملات المالية" />

        {/* Tab buttons */}
        <div
          className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1"
          role="tablist"
          aria-label="تبويبات المالية"
        >
          {TAB_OPTIONS.map((tab) => (
            <button
              key={tab.value}
              role="tab"
              aria-selected={activeTab === tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active table */}
        {activeTab === "quotes" && <QuotesTable />}
        {activeTab === "invoices" && <InvoicesTable />}
        {activeTab === "payments" && <PaymentsTable />}
      </div>
    </div>
  );
}
