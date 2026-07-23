"use client";

import { useState, useCallback, useEffect, useTransition } from "react";
import { useRef } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  CalendarDays,
  CalendarCheck,
  CalendarRange,
  Users,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/utils/format";
import { getShootsAction } from "@/actions/schedule/get-shoots";
import { getShootDashboardStatsAction } from "@/actions/schedule/get-calendar";
import { createShootAction } from "@/actions/schedule/create-shoot";
import { updateShootAction } from "@/actions/schedule/update-shoot";
import { deleteShootAction } from "@/actions/schedule/delete-shoot";
import { getProjectsAction } from "@/actions/projects/get-projects";
import {
  createShootSchema,
  updateShootSchema,
} from "@/lib/validations/schedule";
import type { ShootTableRow, ShootDashboardStats } from "@/types/schedule";
import type { ShootFilterValue, ShootSortValue } from "@/lib/validations/schedule";

/* ============================================
   CalendarView — Shoot scheduling table
   Search, filter, sort, pagination, CRUD
   ============================================ */

const FILTER_OPTIONS: { value: ShootFilterValue; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "scheduled", label: "مجدول" },
  { value: "confirmed", label: "مؤكد" },
  { value: "in_progress", label: "قيد التنفيذ" },
  { value: "completed", label: "مكتمل" },
  { value: "cancelled", label: "ملغى" },
];

const SORT_OPTIONS: { value: ShootSortValue; label: string }[] = [
  { value: "newest", label: "الأحدث" },
  { value: "oldest", label: "الأقدم" },
  { value: "date_asc", label: "تاريخ تصاعدي" },
  { value: "date_desc", label: "تاريخ تنازلي" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const SHOOT_STATUS_OPTIONS = [
  { value: "SCHEDULED", label: "مجدول" },
  { value: "CONFIRMED", label: "مؤكد" },
  { value: "IN_PROGRESS", label: "قيد التنفيذ" },
  { value: "COMPLETED", label: "مكتمل" },
  { value: "CANCELLED", label: "ملغى" },
] as const;

function statusBadge(status: string) {
  switch (status) {
    case "SCHEDULED":
      return <Badge variant="default" className="bg-blue-600 hover:bg-blue-600">مجدول</Badge>;
    case "CONFIRMED":
      return <Badge variant="default">مؤكد</Badge>;
    case "IN_PROGRESS":
      return <Badge variant="default" className="bg-amber-500 hover:bg-amber-500">قيد التنفيذ</Badge>;
    case "COMPLETED":
      return <Badge variant="default" className="bg-green-600 hover:bg-green-600">مكتمل</Badge>;
    case "CANCELLED":
      return <Badge variant="destructive">ملغى</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

/** Format a Date as YYYY-MM-DD using local components (for <input type="date">). */
function toDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Format a Date as YYYY-MM-DDTHH:mm using local components (for <input type="datetime-local">). */
function toDateTimeInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

/** Format a start–end time range for table display. */
function formatTimeRange(start: Date | string, end: Date | string): string {
  const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
  const s = new Intl.DateTimeFormat("ar-SA", opts).format(new Date(start));
  const e = new Intl.DateTimeFormat("ar-SA", opts).format(new Date(end));
  return `${s} - ${e}`;
}

/* ============================================
   ShootFormModal — Create / Edit shoot
   React Hook Form + Zod (same file)
   ============================================ */

type ShootFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shoot?: ShootTableRow | null;
  onSuccess?: () => void;
};

type FormValues = {
  projectId: string;
  title: string;
  description: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string;
};

type ProjectOption = { id: string; name: string; projectCode: string };

export function ShootFormModal({
  open,
  onOpenChange,
  shoot,
  onSuccess,
}: ShootFormModalProps) {
  const isEdit = !!shoot;
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const hasFetched = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? updateShootSchema : createShootSchema) as never,
    defaultValues: {
      projectId: "",
      title: "",
      description: "",
      location: "",
      date: "",
      startTime: "",
      endTime: "",
      status: "SCHEDULED",
      notes: "",
    },
  });

  // Reactive status value for the live badge preview (useWatch, not watch()).
  const watchStatus = useWatch({ control, name: "status" });

  // Fetch projects once on mount.
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    let active = true;
    (async () => {
      const result = await getProjectsAction({ page: 1, pageSize: 100 });
      if (!active) return;
      setProjects(
        result.items.map((p) => ({ id: p.id, name: p.name, projectCode: p.projectCode }))
      );
      setLoadingProjects(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Populate form when editing.
  useEffect(() => {
    if (shoot) {
      reset({
        projectId: shoot.projectId,
        title: shoot.title,
        description: shoot.description ?? "",
        location: shoot.location ?? "",
        date: toDateInput(shoot.date),
        startTime: toDateTimeInput(shoot.startTime),
        endTime: toDateTimeInput(shoot.endTime),
        status: shoot.status,
        notes: shoot.notes ?? "",
      });
    }
  }, [shoot, reset]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      reset({
        projectId: "",
        title: "",
        description: "",
        location: "",
        date: "",
        startTime: "",
        endTime: "",
        status: "SCHEDULED",
        notes: "",
      });
    }
    onOpenChange(next);
  };

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    const formData = new FormData();
    if (!isEdit) {
      formData.append("projectId", data.projectId);
    }
    formData.append("title", data.title);
    formData.append("description", data.description ?? "");
    formData.append("location", data.location ?? "");
    formData.append("date", data.date);
    formData.append("startTime", data.startTime);
    formData.append("endTime", data.endTime);
    if (isEdit) {
      formData.append("status", data.status);
    }
    formData.append("notes", data.notes ?? "");

    try {
      if (isEdit && shoot) {
        const result = await updateShootAction(shoot.id, { success: false }, formData);
        if (result.success) {
          toast.success("تم تحديث جلسة التصوير");
          handleOpenChange(false);
          onSuccess?.();
        } else {
          toast.error(result.error ?? "فشل في التحديث");
        }
      } else {
        const result = await createShootAction({ success: false }, formData);
        if (result.success) {
          toast.success("تم إنشاء جلسة التصوير");
          handleOpenChange(false);
          onSuccess?.();
        } else {
          toast.error(result.error ?? "فشل في الإنشاء");
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "تعديل جلسة التصوير" : "إضافة جلسة تصوير جديدة"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "قم بتحديث بيانات جلسة التصوير"
              : "أدخل بيانات جلسة التصوير الجديدة"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Project */}
          <div className="space-y-1.5">
            <Label htmlFor="projectId">
              المشروع <span className="text-destructive">*</span>
            </Label>
            <select
              id="projectId"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              {...register("projectId")}
              disabled={loadingProjects || isEdit}
            >
              <option value="">{loadingProjects ? "جاري التحميل..." : "اختر المشروع"}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.projectCode})
                </option>
              ))}
            </select>
            {errors.projectId && (
              <p className="text-xs text-destructive" role="alert">
                {errors.projectId.message}
              </p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">
              العنوان <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="عنوان جلسة التصوير"
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "title-error" : undefined}
              {...register("title")}
            />
            {errors.title && (
              <p id="title-error" className="text-xs text-destructive" role="alert">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">الوصف</Label>
            <textarea
              id="description"
              rows={2}
              placeholder="وصف مختصر (اختياري)"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              {...register("description")}
            />
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label htmlFor="location">الموقع</Label>
            <Input
              id="location"
              placeholder="مكان التصوير (اختياري)"
              aria-invalid={!!errors.location}
              aria-describedby={errors.location ? "location-error" : undefined}
              {...register("location")}
            />
            {errors.location && (
              <p id="location-error" className="text-xs text-destructive" role="alert">
                {errors.location.message}
              </p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="date">
              التاريخ <span className="text-destructive">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              aria-invalid={!!errors.date}
              aria-describedby={errors.date ? "date-error" : undefined}
              {...register("date")}
            />
            {errors.date && (
              <p id="date-error" className="text-xs text-destructive" role="alert">
                {errors.date.message}
              </p>
            )}
          </div>

          {/* Start / End time */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="startTime">
                وقت البداية <span className="text-destructive">*</span>
              </Label>
              <Input
                id="startTime"
                type="datetime-local"
                aria-invalid={!!errors.startTime}
                aria-describedby={errors.startTime ? "startTime-error" : undefined}
                {...register("startTime")}
              />
              {errors.startTime && (
                <p id="startTime-error" className="text-xs text-destructive" role="alert">
                  {errors.startTime.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endTime">
                وقت النهاية <span className="text-destructive">*</span>
              </Label>
              <Input
                id="endTime"
                type="datetime-local"
                aria-invalid={!!errors.endTime}
                aria-describedby={errors.endTime ? "endTime-error" : undefined}
                {...register("endTime")}
              />
              {errors.endTime && (
                <p id="endTime-error" className="text-xs text-destructive" role="alert">
                  {errors.endTime.message}
                </p>
              )}
            </div>
          </div>

          {/* Status (edit only) */}
          {isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="status">الحالة</Label>
              <div className="flex items-center gap-2">
                <select
                  id="status"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  {...register("status")}
                >
                  {SHOOT_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {watchStatus ? (
                  <div className="shrink-0">{statusBadge(watchStatus)}</div>
                ) : null}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">ملاحظات</Label>
            <textarea
              id="notes"
              rows={3}
              placeholder="ملاحظات إضافية (اختياري)"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              {...register("notes")}
            />
            {errors.notes && (
              <p className="text-xs text-destructive" role="alert">
                {errors.notes.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "حفظ التغييرات" : "إضافة الجلسة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================
   CalendarView — Main component
   ============================================ */

export function CalendarView() {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<{
    items: ShootTableRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null>(null);
  const [stats, setStats] = useState<ShootDashboardStats | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ShootFilterValue>("all");
  const [sort, setSort] = useState<ShootSortValue>("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [editingShoot, setEditingShoot] = useState<ShootTableRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ShootTableRow | null>(null);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");

  const fetchData = useCallback(async () => {
    startTransition(async () => {
      const result = await getShootsAction({
        page,
        pageSize,
        search: search || undefined,
        filter,
        sort,
      });
      setData(result);
    });
  }, [page, pageSize, search, filter, sort]);

  const fetchStats = useCallback(async () => {
    const result = await getShootDashboardStatsAction();
    setStats(result);
  }, []);

  // Fetch shoots on mount and when params change.
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch dashboard stats on mount.
  useEffect(() => {
    let active = true;
    getShootDashboardStatsAction().then((result) => {
      if (active) setStats(result);
    });
    return () => { active = false };
  }, []);

  // Debounce search input.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleMutated = useCallback(() => {
    fetchData();
    fetchStats();
  }, [fetchData, fetchStats]);

  const handleCreate = () => {
    setEditingShoot(null);
    setFormOpen(true);
  };

  const handleEdit = (shoot: ShootTableRow) => {
    setEditingShoot(shoot);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteShootAction(deleteTarget.id);
    if (result.success) {
      toast.success("تم حذف جلسة التصوير");
      handleMutated();
    } else {
      toast.error(result.error ?? "فشل في الحذف");
    }
    setDeleteTarget(null);
  };

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const isLoading = isPending && !data;

  const statItems = [
    { label: "تصوير اليوم", value: stats?.todayShoots ?? 0, icon: CalendarCheck },
    { label: "تصوير الغد", value: stats?.tomorrowShoots ?? 0, icon: CalendarDays },
    { label: "الأسبوع القادم", value: stats?.upcomingWeek ?? 0, icon: CalendarRange },
    { label: "فريق مشغول", value: stats?.busyTeam ?? 0, icon: Users },
  ];

  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statItems.map((card) => {
          const Icon = card.icon;
          return (
            <DashboardCard key={card.label} className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  {stats === null ? (
                    <Skeleton className="h-6 w-8" />
                  ) : (
                    <p className="text-2xl font-bold tabular-nums">{card.value}</p>
                  )}
                </div>
              </div>
            </DashboardCard>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="بحث بالعنوان، الكود، الموقع، المشروع..."
            className="ps-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="البحث عن جلسات التصوير"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">إضافة جلسة</span>
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
              setSort(e.target.value as ShootSortValue);
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
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border bg-card">
          <EmptyState
            icon={CalendarDays}
            title={search ? "لا توجد نتائج" : "لا توجد جلسات تصوير بعد"}
            description={
              search
                ? "جرّب تغيير كلمات البحث أو الفلاتر"
                : "ابدأ بجدولة جلسات التصوير الخاصة بمشاريعك"
            }
            action={
              !search ? (
                <Button size="sm" onClick={handleCreate}>
                  <Plus className="h-4 w-4" />
                  إضافة جلسة
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
                <th
                  scope="col"
                  className="px-4 py-3 text-start font-medium text-muted-foreground"
                >
                  كود الجلسة
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-start font-medium text-muted-foreground"
                >
                  العنوان
                </th>
                <th
                  scope="col"
                  className="hidden px-4 py-3 text-start font-medium text-muted-foreground md:table-cell"
                >
                  المشروع
                </th>
                <th
                  scope="col"
                  className="hidden px-4 py-3 text-start font-medium text-muted-foreground md:table-cell"
                >
                  الموقع
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-start font-medium text-muted-foreground"
                >
                  التاريخ
                </th>
                <th
                  scope="col"
                  className="hidden px-4 py-3 text-start font-medium text-muted-foreground sm:table-cell"
                >
                  الوقت
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-start font-medium text-muted-foreground"
                >
                  الحالة
                </th>
                <th
                  scope="col"
                  className="hidden px-4 py-3 text-center font-medium text-muted-foreground xl:table-cell"
                >
                  الفريق
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
              {items.map((shoot) => (
                <tr
                  key={shoot.id}
                  className="group transition-colors hover:bg-muted/50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={ROUTES.DASHBOARD_PROJECT_DETAILS(shoot.project.id)}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {shoot.shootCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{shoot.title}</span>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <Link
                      href={ROUTES.DASHBOARD_PROJECT_DETAILS(shoot.project.id)}
                      className="text-muted-foreground hover:text-foreground hover:underline"
                    >
                      {shoot.project.name}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {shoot.location ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(shoot.date)}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell" dir="ltr">
                    {formatTimeRange(shoot.startTime, shoot.endTime)}
                  </td>
                  <td className="px-4 py-3">{statusBadge(shoot.status)}</td>
                  <td className="hidden px-4 py-3 text-center xl:table-cell">
                    <span className="inline-flex min-w-[2rem] justify-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                      {shoot.assignmentCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`إجراءات ${shoot.title}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={ROUTES.DASHBOARD_PROJECT_DETAILS(shoot.project.id)}
                          >
                            <Eye className="h-4 w-4" />
                            <span>عرض المشروع</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(shoot)}>
                          <Pencil className="h-4 w-4" />
                          <span>تعديل</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(shoot)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>حذف</span>
                        </DropdownMenuItem>
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
            <span>من {total} جلسة</span>
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
      <ShootFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        shoot={editingShoot}
        onSuccess={handleMutated}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف جلسة التصوير"
        description={`هل أنت متأكد من حذف "${deleteTarget?.title}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
      />
    </div>
  );
}
