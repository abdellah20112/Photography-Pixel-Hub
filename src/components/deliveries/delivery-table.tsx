"use client";

import { useState, useCallback, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  Package,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { DeliveryFormModal } from "@/components/deliveries/delivery-form";
import { DeliveryStatusBadge } from "@/components/deliveries/delivery-status-badge";
import { ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/utils/format";
import { getDeliveriesAction } from "@/actions/deliveries/get-deliveries";
import { deleteDeliveryAction } from "@/actions/deliveries/delete-delivery";
import { restoreDeliveryAction } from "@/actions/deliveries/restore-delivery";
import type { DeliveryTableRow } from "@/types/delivery";
import type { DeliveryFilterValue, DeliverySortValue } from "@/lib/validations/delivery";

/* ============================================
   DeliveryTable — Full-featured delivery list
   ============================================ */

const FILTER_OPTIONS: { value: DeliveryFilterValue; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "active", label: "نشط" },
  { value: "expired", label: "منتهي" },
  { value: "disabled", label: "معطّل" },
];

const SORT_OPTIONS: { value: DeliverySortValue; label: string }[] = [
  { value: "newest", label: "الأحدث" },
  { value: "oldest", label: "الأقدم" },
  { value: "alphabetical", label: "أبجدي" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

type DeliveryTableProps = {
  projectId?: string;
};

export function DeliveryTable({ projectId }: DeliveryTableProps) {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<{
    items: DeliveryTableRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<DeliveryFilterValue>("all");
  const [sort, setSort] = useState<DeliverySortValue>("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<DeliveryTableRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeliveryTableRow | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<DeliveryTableRow | null>(null);

  const [searchInput, setSearchInput] = useState("");

  const fetchData = useCallback(async () => {
    startTransition(async () => {
      const result = await getDeliveriesAction({
        page,
        pageSize,
        projectId,
        search: search || undefined,
        filter,
        sort,
      });
      setData(result);
    });
  }, [page, pageSize, projectId, search, filter, sort]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleCreate = () => {
    setEditingDelivery(null);
    setFormOpen(true);
  };

  const handleEdit = (delivery: DeliveryTableRow) => {
    setEditingDelivery(delivery);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteDeliveryAction(deleteTarget.id);
    if (result.success) {
      toast.success("تم حذف التسليم");
      fetchData();
    } else {
      toast.error(result.error ?? "فشل في حذف التسليم");
    }
    setDeleteTarget(null);
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    const result = await restoreDeliveryAction(restoreTarget.id);
    if (result.success) {
      toast.success("تم استعادة التسليم");
      fetchData();
    } else {
      toast.error(result.error ?? "فشل في الاستعادة");
    }
    setRestoreTarget(null);
  };

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const isLoading = isPending && !data;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="بحث بالكود، العنوان، المشروع..."
            className="ps-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="بحث عن التسليمات"
          />
        </div>
        <Button size="sm" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">إنشاء تسليم</span>
        </Button>
      </div>

      {/* Filters + Sort */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1" role="tablist" aria-label="تصفية الحالة">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              role="tab"
              aria-selected={filter === opt.value}
              onClick={() => { setFilter(opt.value); setPage(1); }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                filter === opt.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
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
            onChange={(e) => { setSort(e.target.value as DeliverySortValue); setPage(1); }}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="ترتيب حسب"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="rounded-xl border">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b p-4 last:border-0">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border bg-card">
          <EmptyState
            icon={Package}
            title={search ? "لا توجد نتائج" : "لا توجد تسليمات بعد"}
            description={search ? "جرّب تغيير كلمات البحث أو الفلاتر" : "أنشئ أول تسليم للعميل"}
            action={!search ? (
              <Button size="sm" onClick={handleCreate}>
                <Plus className="h-4 w-4" />
                إنشاء تسليم
              </Button>
            ) : undefined}
            className="py-20"
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
              <tr className="border-b">
                <th scope="col" className="px-4 py-3 text-start font-medium text-muted-foreground">كود التسليم</th>
                <th scope="col" className="px-4 py-3 text-start font-medium text-muted-foreground">العنوان</th>
                <th scope="col" className="hidden px-4 py-3 text-start font-medium text-muted-foreground md:table-cell">المشروع</th>
                <th scope="col" className="px-4 py-3 text-start font-medium text-muted-foreground">الحالة</th>
                <th scope="col" className="hidden px-4 py-3 text-center font-medium text-muted-foreground sm:table-cell">الفيديوهات</th>
                <th scope="col" className="hidden px-4 py-3 text-center font-medium text-muted-foreground lg:table-cell">المشاهدات</th>
                <th scope="col" className="hidden px-4 py-3 text-center font-medium text-muted-foreground lg:table-cell">التحميلات</th>
                <th scope="col" className="hidden px-4 py-3 text-start font-medium text-muted-foreground xl:table-cell">تاريخ الانتهاء</th>
                <th scope="col" className="px-4 py-3 text-end font-medium text-muted-foreground">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((delivery) => (
                <tr key={delivery.id} className="group transition-colors hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-primary">{delivery.deliveryCode}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{delivery.title}</span>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{delivery.project.name}</td>
                  <td className="px-4 py-3"><DeliveryStatusBadge status={delivery.status} /></td>
                  <td className="hidden px-4 py-3 text-center sm:table-cell">
                    <span className="inline-flex min-w-[2rem] justify-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{delivery.videoCount}</span>
                  </td>
                  <td className="hidden px-4 py-3 text-center text-muted-foreground lg:table-cell">{delivery.viewCount}</td>
                  <td className="hidden px-4 py-3 text-center text-muted-foreground lg:table-cell">{delivery.downloadCount}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground xl:table-cell">
                    {delivery.expiresAt ? formatDate(delivery.expiresAt) : "—"}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`إجراءات ${delivery.title}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={ROUTES.PUBLIC_DELIVERY(delivery.slug)} target="_blank">
                            <ExternalLink className="h-4 w-4" />
                            <span>عرض البوابة</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(delivery)} disabled={delivery.status === "DISABLED"}>
                          <Pencil className="h-4 w-4" />
                          <span>تعديل</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {delivery.status === "DISABLED" ? (
                          <DropdownMenuItem onClick={() => setRestoreTarget(delivery)}>
                            <RotateCcw className="h-4 w-4" />
                            <span>استعادة</span>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => setDeleteTarget(delivery)} className="text-destructive focus:text-destructive">
                            <Trash2 className="h-4 w-4" />
                            <span>تعطيل</span>
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
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="h-7 rounded-md border border-input bg-transparent px-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="عدد العناصر في الصفحة"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span>من {total} تسليم</span>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} aria-label="الصفحة السابقة">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="px-2 text-xs text-muted-foreground">{page} / {totalPages}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} aria-label="الصفحة التالية">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <DeliveryFormModal open={formOpen} onOpenChange={setFormOpen} delivery={editingDelivery} onSuccess={fetchData} />
      <ConfirmDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)} title="تعطيل التسليم" description={`هل أنت متأكد من تعطيل "${deleteTarget?.title}"؟`} confirmLabel="تعطيل" onConfirm={handleDelete} />
      <ConfirmDialog open={!!restoreTarget} onOpenChange={(open) => !open && setRestoreTarget(null)} title="استعادة التسليم" description={`هل تريد استعادة "${restoreTarget?.title}"؟`} confirmLabel="استعادة" variant="default" onConfirm={handleRestore} />
    </div>
  );
}
