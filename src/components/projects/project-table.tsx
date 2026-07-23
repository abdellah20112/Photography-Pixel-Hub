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
  FolderKanban,
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
import { ProjectFormModal } from "@/components/forms/project-form";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { RetentionBadge } from "@/components/projects/retention-badge";
import { ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/utils/format";
import { getProjectsAction } from "@/actions/projects/get-projects";
import { archiveProjectAction } from "@/actions/projects/delete-project";
import { restoreProjectAction } from "@/actions/projects/restore-project";
import { exportProjectsAction } from "@/actions/projects/export-projects";
import type { ProjectTableRow } from "@/types/project";
import type { ProjectFilterValue, ProjectSortValue } from "@/lib/validations/project";

/* ============================================
   ProjectTable — Full-featured project list
   Search, filter, sort, pagination, CSV export
   ============================================ */

const FILTER_OPTIONS: { value: ProjectFilterValue; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "draft", label: "مسودة" },
  { value: "in_progress", label: "قيد التنفيذ" },
  { value: "ready", label: "جاهز" },
  { value: "download_enabled", label: "التحميل مفعّل" },
  { value: "completed", label: "مكتمل" },
  { value: "archived", label: "مؤرشف" },
];

const SORT_OPTIONS: { value: ProjectSortValue; label: string }[] = [
  { value: "newest", label: "الأحدث" },
  { value: "oldest", label: "الأقدم" },
  { value: "deadline", label: "الموعد النهائي" },
  { value: "alphabetical", label: "أبجدي" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function ProjectTable() {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<{
    items: ProjectTableRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ProjectFilterValue>("all");
  const [sort, setSort] = useState<ProjectSortValue>("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectTableRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectTableRow | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<ProjectTableRow | null>(null);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");

  const fetchData = useCallback(async () => {
    startTransition(async () => {
      const result = await getProjectsAction({
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
    setEditingProject(null);
    setFormOpen(true);
  };

  const handleEdit = (project: ProjectTableRow) => {
    setEditingProject(project);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await archiveProjectAction(deleteTarget.id);
    if (result.success) {
      toast.success("تم أرشفة المشروع");
      fetchData();
    } else {
      toast.error(result.error ?? "فشل في أرشفة المشروع");
    }
    setDeleteTarget(null);
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    const result = await restoreProjectAction(restoreTarget.id);
    if (result.success) {
      toast.success("تم استعادة المشروع");
      fetchData();
    } else {
      toast.error(result.error ?? "فشل في استعادة المشروع");
    }
    setRestoreTarget(null);
  };

  const handleExport = async () => {
    const result = await exportProjectsAction();
    if (result.success && result.csv) {
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `projects-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("تم تصدير المشاريع");
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
            placeholder="بحث بالكود، الاسم، العميل..."
            className="ps-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="بحث عن المشاريع"
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
            <span className="hidden sm:inline">إضافة مشروع</span>
          </Button>
        </div>
      </div>

      {/* Filters + Sort */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Filter tabs */}
        <div
          className="flex flex-wrap items-center gap-1 rounded-lg border bg-muted/50 p-1"
          role="tablist"
          aria-label="تصفية الحالة"
        >
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              role="tab"
              aria-selected={filter === opt.value}
              onClick={() => {
                setFilter(opt.value);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
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
              setSort(e.target.value as ProjectSortValue);
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
            icon={FolderKanban}
            title={search ? "لا توجد نتائج" : "لا توجد مشاريع بعد"}
            description={search ? "جرّب تغيير كلمات البحث أو الفلاتر" : "أنشئ مشروعك الأول لبدء تنظيم صورك وفيديوهاتك"}
            action={
              !search ? (
                <Button size="sm" onClick={handleCreate}>
                  <Plus className="h-4 w-4" />
                  إضافة مشروع
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
                  كود المشروع
                </th>
                <th scope="col" className="px-4 py-3 text-start font-medium text-muted-foreground">
                  اسم المشروع
                </th>
                <th scope="col" className="hidden px-4 py-3 text-start font-medium text-muted-foreground md:table-cell">
                  العميل
                </th>
                <th scope="col" className="px-4 py-3 text-start font-medium text-muted-foreground">
                  الحالة
                </th>
                <th scope="col" className="hidden px-4 py-3 text-start font-medium text-muted-foreground lg:table-cell">
                  الاحتفاظ
                </th>
                <th scope="col" className="hidden px-4 py-3 text-start font-medium text-muted-foreground lg:table-cell">
                  الموعد النهائي
                </th>
                <th scope="col" className="hidden px-4 py-3 text-center font-medium text-muted-foreground sm:table-cell">
                  الفيديوهات
                </th>
                <th scope="col" className="hidden px-4 py-3 text-start font-medium text-muted-foreground xl:table-cell">
                  تاريخ الإنشاء
                </th>
                <th scope="col" className="px-4 py-3 text-end font-medium text-muted-foreground">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((project) => (
                <tr
                  key={project.id}
                  className="group transition-colors hover:bg-muted/50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={ROUTES.DASHBOARD_PROJECT_DETAILS(project.id)}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {project.projectCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={ROUTES.DASHBOARD_PROJECT_DETAILS(project.id)}
                      className="font-medium hover:underline"
                    >
                      {project.name}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {project.client.name}
                  </td>
                  <td className="px-4 py-3">
                    <ProjectStatusBadge status={project.status} />
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <RetentionBadge period={project.retentionPeriod} />
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {project.deadline ? formatDate(project.deadline) : "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-center sm:table-cell">
                    <span className="inline-flex min-w-[2rem] justify-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                      {project.videoCount}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground xl:table-cell">
                    {formatDate(project.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`إجراءات ${project.name}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={ROUTES.DASHBOARD_PROJECT_DETAILS(project.id)}>
                            <Eye className="h-4 w-4" />
                            <span>عرض التفاصيل</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEdit(project)}
                          disabled={project.status === "ARCHIVED"}
                        >
                          <Pencil className="h-4 w-4" />
                          <span>تعديل</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {project.status === "ARCHIVED" ? (
                          <DropdownMenuItem onClick={() => setRestoreTarget(project)}>
                            <RotateCcw className="h-4 w-4" />
                            <span>استعادة</span>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(project)}
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
              من {total} مشروع
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
      <ProjectFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        project={editingProject}
        onSuccess={fetchData}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="أرشفة المشروع"
        description={`هل أنت متأكد من أرشفة "${deleteTarget?.name}"؟ سيتم إخفاء المشروع من القوائم الافتراضية. يمكنك استعادته لاحقاً.`}
        confirmLabel="أرشفة"
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={!!restoreTarget}
        onOpenChange={(open) => !open && setRestoreTarget(null)}
        title="استعادة المشروع"
        description={`هل تريد استعادة "${restoreTarget?.name}"؟ سيصبح المشروع متاحاً مرة أخرى.`}
        confirmLabel="استعادة"
        variant="default"
        onConfirm={handleRestore}
      />
    </div>
  );
}
