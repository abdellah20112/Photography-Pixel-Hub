"use client";

import { useState, useCallback, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  MessageCircle,
  UserCircle,
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
import { ModelFormModal } from "@/components/models/model-form";
import { ModelStatusBadge } from "@/components/models/model-status-badge";
import { ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/utils/format";
import { getWhatsAppUrl } from "@/lib/utils/whatsapp";
import { getModelsAction } from "@/actions/models/get-models";
import { deleteModelAction } from "@/actions/models/delete-model";
import { restoreModelAction } from "@/actions/models/restore-model";
import type { ModelTableRow } from "@/types/model";
import type { ModelFilterValue, ModelSortValue } from "@/lib/validations/model";

/* ============================================
   ModelTable — Full-featured model list
   ============================================ */

const FILTER_OPTIONS: { value: ModelFilterValue; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "active", label: "نشط" },
  { value: "inactive", label: "غير نشط" },
];

const SORT_OPTIONS: { value: ModelSortValue; label: string }[] = [
  { value: "newest", label: "الأحدث" },
  { value: "oldest", label: "الأقدم" },
  { value: "alphabetical", label: "أبجدي" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function ModelTable() {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<{
    items: ModelTableRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ModelFilterValue>("all");
  const [sort, setSort] = useState<ModelSortValue>("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelTableRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ModelTableRow | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<ModelTableRow | null>(null);

  const [searchInput, setSearchInput] = useState("");

  const fetchData = useCallback(async () => {
    startTransition(async () => {
      const result = await getModelsAction({
        page,
        pageSize,
        search: search || undefined,
        filter,
        sort,
      });
      setData(result);
    });
  }, [page, pageSize, search, filter, sort]);

  useMemo(() => { fetchData(); }, [fetchData]);

  useMemo(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleCreate = () => {
    setEditingModel(null);
    setFormOpen(true);
  };

  const handleEdit = (model: ModelTableRow) => {
    setEditingModel(model);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteModelAction(deleteTarget.id);
    if (result.success) {
      toast.success("تم حذف الموديل");
      fetchData();
    } else {
      toast.error(result.error ?? "فشل في حذف الموديل");
    }
    setDeleteTarget(null);
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    const result = await restoreModelAction(restoreTarget.id);
    if (result.success) {
      toast.success("تم استعادة الموديل");
      fetchData();
    } else {
      toast.error(result.error ?? "فشل في الاستعادة");
    }
    setRestoreTarget(null);
  };

  const handleWhatsApp = (model: ModelTableRow) => {
    const phone = model.whatsapp || model.phone;
    const url = getWhatsAppUrl(phone, `مرحباً ${model.fullName}`);
    window.open(url, "_blank");
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
            placeholder="بحث بالاسم، الهاتف، الكود..."
            className="ps-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="بحث عن الموديلات"
          />
        </div>
        <Button size="sm" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">إضافة موديل</span>
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
            onChange={(e) => { setSort(e.target.value as ModelSortValue); setPage(1); }}
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
            icon={UserCircle}
            title={search ? "لا توجد نتائج" : "لا توجد موديلات بعد"}
            description={search ? "جرّب تغيير كلمات البحث أو الفلاتر" : "أضف موديلاتك لإدارتهم"}
            action={!search ? (
              <Button size="sm" onClick={handleCreate}>
                <Plus className="h-4 w-4" />
                إضافة موديل
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
                <th scope="col" className="px-4 py-3 text-start font-medium text-muted-foreground">كود الموديل</th>
                <th scope="col" className="px-4 py-3 text-start font-medium text-muted-foreground">الاسم</th>
                <th scope="col" className="hidden px-4 py-3 text-start font-medium text-muted-foreground md:table-cell">الهاتف</th>
                <th scope="col" className="hidden px-4 py-3 text-center font-medium text-muted-foreground sm:table-cell">المشاريع</th>
                <th scope="col" className="px-4 py-3 text-start font-medium text-muted-foreground">الحالة</th>
                <th scope="col" className="hidden px-4 py-3 text-start font-medium text-muted-foreground xl:table-cell">تاريخ الإنشاء</th>
                <th scope="col" className="px-4 py-3 text-end font-medium text-muted-foreground">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((model) => (
                <tr key={model.id} className="group transition-colors hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/models/${model.id}`} className="font-mono text-xs text-primary hover:underline">
                      {model.modelCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/models/${model.id}`} className="font-medium hover:underline">
                      {model.fullName}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell" dir="ltr">{model.phone}</td>
                  <td className="hidden px-4 py-3 text-center sm:table-cell">
                    <span className="inline-flex min-w-[2rem] justify-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{model.projectCount}</span>
                  </td>
                  <td className="px-4 py-3"><ModelStatusBadge status={model.status} /></td>
                  <td className="hidden px-4 py-3 text-muted-foreground xl:table-cell">{formatDate(model.createdAt)}</td>
                  <td className="px-4 py-3 text-end">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => handleWhatsApp(model)} aria-label="واتساب">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`إجراءات ${model.fullName}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(model)} disabled={model.status === "INACTIVE"}>
                            <Pencil className="h-4 w-4" />
                            <span>تعديل</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {model.status === "INACTIVE" ? (
                            <DropdownMenuItem onClick={() => setRestoreTarget(model)}>
                              <RotateCcw className="h-4 w-4" />
                              <span>استعادة</span>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => setDeleteTarget(model)} className="text-destructive focus:text-destructive">
                              <Trash2 className="h-4 w-4" />
                              <span>حذف</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
              {PAGE_SIZE_OPTIONS.map((size) => (<option key={size} value={size}>{size}</option>))}
            </select>
            <span>من {total} موديل</span>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} aria-label="السابق">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="px-2 text-xs text-muted-foreground">{page} / {totalPages}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} aria-label="التالي">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <ModelFormModal open={formOpen} onOpenChange={setFormOpen} model={editingModel} onSuccess={fetchData} />
      <ConfirmDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)} title="حذف الموديل" description={`هل أنت متأكد من حذف "${deleteTarget?.fullName}"؟`} confirmLabel="حذف" onConfirm={handleDelete} />
      <ConfirmDialog open={!!restoreTarget} onOpenChange={(open) => !open && setRestoreTarget(null)} title="استعادة الموديل" description={`هل تريد استعادة "${restoreTarget?.fullName}"؟`} confirmLabel="استعادة" variant="default" onConfirm={handleRestore} />
    </div>
  );
}
