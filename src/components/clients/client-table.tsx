"use client";

import { useState, useCallback, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Download,
  MoreHorizontal,
  Pencil,
  Trash2,
  RotateCcw,
  Eye,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ClientFormModal } from "@/components/forms/client-form";
import { ProjectWizard } from "@/components/wizard/project-wizard";
import { ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/utils/format";
import { getClientsAction } from "@/actions/clients/get-clients";
import { deleteClientAction } from "@/actions/clients/delete-client";
import { restoreClientAction } from "@/actions/clients/restore-client";
import { exportClientsAction } from "@/actions/clients/export-clients";
import type { ClientTableRow } from "@/types/client";
import type { ClientFilterValue, ClientSortValue } from "@/lib/validations/client";

/* ============================================
   ClientTable — Full-featured client list
   Search, filter, sort, pagination, CSV export
   ============================================ */

const FILTER_OPTIONS: { value: ClientFilterValue; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "active", label: "نشط" },
  { value: "archived", label: "مؤرشف" },
  { value: "blocked", label: "محظور" },
];

const SORT_OPTIONS: { value: ClientSortValue; label: string }[] = [
  { value: "newest", label: "الأحدث" },
  { value: "oldest", label: "الأقدم" },
  { value: "alphabetical", label: "أبجدي" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function statusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return <Badge variant="default" className="bg-green-600 hover:bg-green-600">نشط</Badge>;
    case "ARCHIVED":
      return <Badge variant="secondary">مؤرشف</Badge>;
    case "BLOCKED":
      return <Badge variant="destructive">محظور</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function ClientTable() {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<{
    items: ClientTableRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ClientFilterValue>("all");
  const [sort, setSort] = useState<ClientSortValue>("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientTableRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClientTableRow | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<ClientTableRow | null>(null);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");

  const fetchData = useCallback(async () => {
    startTransition(async () => {
      const result = await getClientsAction({
        page,
        pageSize,
        search: search || undefined,
        filter,
        sort,
      });
      setData(result);
    });
  }, [page, pageSize, search, filter, sort]);

  // Fetch on mount and when params change
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
    setWizardOpen(true);
  };

  const handleEdit = (client: ClientTableRow) => {
    setEditingClient(client);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteClientAction(deleteTarget.id);
    if (result.success) {
      toast.success("تم أرشفة العميل");
      fetchData();
    } else {
      toast.error(result.error ?? "فشل في أرشفة العميل");
    }
    setDeleteTarget(null);
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    const result = await restoreClientAction(restoreTarget.id);
    if (result.success) {
      toast.success("تم استعادة العميل");
      fetchData();
    } else {
      toast.error(result.error ?? "فشل في استعادة العميل");
    }
    setRestoreTarget(null);
  };

  const handleExport = async () => {
    const result = await exportClientsAction();
    if (result.success && result.csv) {
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `clients-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("تم تصدير العملاء");
    } else {
      toast.error(result.error ?? "فشل في التصدير");
    }
  };

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const isLoading = isPending && !data;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="بحث بالاسم، الكود، الشركة، الهاتف، البريد..."
            className="ps-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="بحث عن العملاء"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isPending}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">تصدير CSV</span>
          </Button>
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">إضافة عميل</span>
          </Button>
        </div>
      </div>

      {/* Filters + Sort */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1" role="tablist" aria-label="تصفية الحالة">
          {FILTER_OPTIONS.map((opt) => (
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

        {/* Sort */}
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as ClientSortValue);
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
              <div key={i} className="flex items-center gap-4 border-b p-4 last:border-0">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border bg-card">
          <EmptyState
            icon={Users}
            title={search ? "لا توجد نتائج" : "لا يوجد عملاء بعد"}
            description={search ? "جرّب تغيير كلمات البحث أو الفلاتر" : "ابدأ بإضافة عملائك لإدارة مشاريعهم"}
            action={
              !search ? (
                <Button size="sm" onClick={handleCreate}>
                  <Plus className="h-4 w-4" />
                  إضافة عميل
                </Button>
              ) : undefined
            }
            className="py-20"
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            {/* Sticky header */}
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
              <tr className="border-b">
                <th scope="col" className="px-4 py-3 text-start font-medium text-muted-foreground">
                  كود العميل
                </th>
                <th scope="col" className="px-4 py-3 text-start font-medium text-muted-foreground">
                  الاسم
                </th>
                <th scope="col" className="hidden px-4 py-3 text-start font-medium text-muted-foreground md:table-cell">
                  الشركة
                </th>
                <th scope="col" className="hidden px-4 py-3 text-start font-medium text-muted-foreground lg:table-cell">
                  الهاتف
                </th>
                <th scope="col" className="hidden px-4 py-3 text-start font-medium text-muted-foreground lg:table-cell">
                  البريد
                </th>
                <th scope="col" className="hidden px-4 py-3 text-center font-medium text-muted-foreground sm:table-cell">
                  المشاريع
                </th>
                <th scope="col" className="hidden px-4 py-3 text-start font-medium text-muted-foreground xl:table-cell">
                  تاريخ الإنشاء
                </th>
                <th scope="col" className="px-4 py-3 text-start font-medium text-muted-foreground">
                  الحالة
                </th>
                <th scope="col" className="px-4 py-3 text-end font-medium text-muted-foreground">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((client) => (
                <tr
                  key={client.id}
                  className="group transition-colors hover:bg-muted/50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`${ROUTES.DASHBOARD_CLIENTS}/${client.id}`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {client.clientCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`${ROUTES.DASHBOARD_CLIENTS}/${client.id}`}
                      className="font-medium hover:underline"
                    >
                      {client.name}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {client.company ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell" dir="ltr">
                    {client.phone ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell" dir="ltr">
                    {client.email}
                  </td>
                  <td className="hidden px-4 py-3 text-center sm:table-cell">
                    <span className="inline-flex min-w-[2rem] justify-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                      {client.projectCount}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground xl:table-cell">
                    {formatDate(client.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {statusBadge(client.status)}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`إجراءات ${client.name}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`${ROUTES.DASHBOARD_CLIENTS}/${client.id}`}>
                            <Eye className="h-4 w-4" />
                            <span>عرض التفاصيل</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEdit(client)}
                          disabled={client.status === "ARCHIVED"}
                        >
                          <Pencil className="h-4 w-4" />
                          <span>تعديل</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {client.status === "ARCHIVED" ? (
                          <DropdownMenuItem onClick={() => setRestoreTarget(client)}>
                            <RotateCcw className="h-4 w-4" />
                            <span>استعادة</span>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(client)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>أرشفة</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>
              من {total} عميل
            </span>
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

      {/* Modals */}
      <ProjectWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSuccess={fetchData}
      />

      <ClientFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        client={editingClient}
        onSuccess={fetchData}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="أرشفة العميل"
        description={`هل أنت متأكد من أرشفة "${deleteTarget?.name}"؟ سيتم إخفاء العميل من القوائم الافتراضية. يمكنك استعادته لاحقاً.`}
        confirmLabel="أرشفة"
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={!!restoreTarget}
        onOpenChange={(open) => !open && setRestoreTarget(null)}
        title="استعادة العميل"
        description={`هل تريد استعادة "${restoreTarget?.name}"؟ سيصبح العميل نشطاً مرة أخرى.`}
        confirmLabel="استعادة"
        variant="default"
        onConfirm={handleRestore}
      />
    </div>
  );
}
