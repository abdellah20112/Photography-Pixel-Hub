"use client";

import { useState, useCallback, useEffect, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Users,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatDate } from "@/lib/utils/format";
import { getTeamMembersAction } from "@/actions/team/get-team";
import { deleteTeamMemberAction } from "@/actions/team/delete-member";
import { restoreTeamMemberAction } from "@/actions/team/restore-member";
import { createTeamMemberAction } from "@/actions/team/create-member";
import { updateTeamMemberAction } from "@/actions/team/update-member";
import {
  createTeamMemberSchema,
  updateTeamMemberSchema,
} from "@/lib/validations/team";
import type { TeamMemberTableRow } from "@/types/team";
import type {
  TeamFilterValue,
  TeamSortValue,
  RoleFilterValue,
} from "@/lib/validations/team";

/* ============================================
   TeamTable — Full-featured team member list
   Search, filter, sort, pagination, CRUD
   ============================================ */

const FILTER_OPTIONS: { value: TeamFilterValue; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "active", label: "نشط" },
  { value: "inactive", label: "غير نشط" },
  { value: "on_leave", label: "إجازة" },
];

const SORT_OPTIONS: { value: TeamSortValue; label: string }[] = [
  { value: "newest", label: "الأحدث" },
  { value: "oldest", label: "الأقدم" },
  { value: "alphabetical", label: "أبجدي" },
];

const ROLE_FILTER_OPTIONS: { value: RoleFilterValue; label: string }[] = [
  { value: "all", label: "كل الأدوار" },
  { value: "OWNER", label: "مالك" },
  { value: "ADMIN", label: "مدير" },
  { value: "PROJECT_MANAGER", label: "مدير مشاريع" },
  { value: "PHOTOGRAPHER", label: "مصور" },
  { value: "VIDEOGRAPHER", label: "مصور فيديو" },
  { value: "EDITOR", label: "محرر" },
  { value: "DESIGNER", label: "مصمم" },
  { value: "MEDIA_BUYER", label: "مشتري إعلامي" },
  { value: "ACCOUNTANT", label: "محاسب" },
];

const ROLE_OPTIONS = [
  { value: "OWNER", label: "مالك" },
  { value: "ADMIN", label: "مدير" },
  { value: "PROJECT_MANAGER", label: "مدير مشاريع" },
  { value: "PHOTOGRAPHER", label: "مصور" },
  { value: "VIDEOGRAPHER", label: "مصور فيديو" },
  { value: "EDITOR", label: "محرر" },
  { value: "DESIGNER", label: "مصمم" },
  { value: "MEDIA_BUYER", label: "مشتري إعلامي" },
  { value: "ACCOUNTANT", label: "محاسب" },
] as const;

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "نشط" },
  { value: "INACTIVE", label: "غير نشط" },
  { value: "ON_LEAVE", label: "إجازة" },
] as const;

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const ROLE_LABELS: Record<string, string> = {
  OWNER: "مالك",
  ADMIN: "مدير",
  PROJECT_MANAGER: "مدير مشاريع",
  PHOTOGRAPHER: "مصور",
  VIDEOGRAPHER: "مصور فيديو",
  EDITOR: "محرر",
  DESIGNER: "مصمم",
  MEDIA_BUYER: "مشتري إعلامي",
  ACCOUNTANT: "محاسب",
};

function roleBadge(role: string) {
  return <Badge variant="outline">{ROLE_LABELS[role] ?? role}</Badge>;
}

function statusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return <Badge variant="default" className="bg-green-600 hover:bg-green-600">نشط</Badge>;
    case "INACTIVE":
      return <Badge variant="secondary">غير نشط</Badge>;
    case "ON_LEAVE":
      return <Badge variant="default" className="bg-amber-500 hover:bg-amber-500">إجازة</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function TeamTable() {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<{
    items: TeamMemberTableRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TeamFilterValue>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilterValue>("all");
  const [sort, setSort] = useState<TeamSortValue>("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMemberTableRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeamMemberTableRow | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<TeamMemberTableRow | null>(null);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");

  const fetchData = useCallback(async () => {
    startTransition(async () => {
      const result = await getTeamMembersAction({
        page,
        pageSize,
        search: search || undefined,
        filter,
        roleFilter: roleFilter !== "all" ? roleFilter : undefined,
        sort,
      });
      setData(result);
    });
  }, [page, pageSize, search, filter, roleFilter, sort]);

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
    setEditingMember(null);
    setFormOpen(true);
  };

  const handleEdit = (member: TeamMemberTableRow) => {
    setEditingMember(member);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteTeamMemberAction(deleteTarget.id);
    if (result.success) {
      toast.success("تم حذف الموظف");
      fetchData();
    } else {
      toast.error(result.error ?? "فشل في حذف الموظف");
    }
    setDeleteTarget(null);
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    const result = await restoreTeamMemberAction(restoreTarget.id);
    if (result.success) {
      toast.success("تم استعادة الموظف");
      fetchData();
    } else {
      toast.error(result.error ?? "فشل في استعادة الموظف");
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
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="بحث بالاسم، الكود، البريد، الهاتف..."
            className="ps-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="بحث عن الموظفين"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">إضافة موظف</span>
          </Button>
        </div>
      </div>

      {/* Filters + Sort */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Filter tabs */}
        <div
          className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1"
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

        {/* Role filter */}
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as RoleFilterValue);
            setPage(1);
          }}
          className="h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="تصفية حسب الدور"
        >
          {ROLE_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Sort */}
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as TeamSortValue);
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
            icon={Users}
            title={search ? "لا توجد نتائج" : "لا يوجد موظفون بعد"}
            description={
              search
                ? "جرّب تغيير كلمات البحث أو الفلاتر"
                : "ابدأ بإضافة فريقك لإدارة المشاريع"
            }
            action={
              !search ? (
                <Button size="sm" onClick={handleCreate}>
                  <Plus className="h-4 w-4" />
                  إضافة موظف
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
                  كود الموظف
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-start font-medium text-muted-foreground"
                >
                  الاسم
                </th>
                <th
                  scope="col"
                  className="hidden px-4 py-3 text-start font-medium text-muted-foreground md:table-cell"
                >
                  البريد
                </th>
                <th
                  scope="col"
                  className="hidden px-4 py-3 text-start font-medium text-muted-foreground md:table-cell"
                >
                  الهاتف
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-start font-medium text-muted-foreground"
                >
                  الدور
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-start font-medium text-muted-foreground"
                >
                  الحالة
                </th>
                <th
                  scope="col"
                  className="hidden px-4 py-3 text-center font-medium text-muted-foreground md:table-cell"
                >
                  المشاريع
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-start font-medium text-muted-foreground lg:hidden"
                >
                  تاريخ الانضمام
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
              {items.map((member) => (
                <tr
                  key={member.id}
                  className="group transition-colors hover:bg-muted/50"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-muted-foreground">
                      {member.employeeCode}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{member.fullName}</span>
                  </td>
                  <td
                    className="hidden px-4 py-3 text-muted-foreground md:table-cell"
                    dir="ltr"
                  >
                    {member.email}
                  </td>
                  <td
                    className="hidden px-4 py-3 text-muted-foreground md:table-cell"
                    dir="ltr"
                  >
                    {member.phone || "—"}
                  </td>
                  <td className="px-4 py-3">{roleBadge(member.role)}</td>
                  <td className="px-4 py-3">{statusBadge(member.status)}</td>
                  <td className="hidden px-4 py-3 text-center md:table-cell">
                    <span className="inline-flex min-w-[2rem] justify-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                      {member.activeProjectCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground lg:hidden">
                    {formatDate(member.joinDate)}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`إجراءات ${member.fullName}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(member)}>
                          <Pencil className="h-4 w-4" />
                          <span>تعديل</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {member.status === "INACTIVE" ? (
                          <DropdownMenuItem
                            onClick={() => setRestoreTarget(member)}
                          >
                            <RotateCcw className="h-4 w-4" />
                            <span>استعادة</span>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(member)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>حذف</span>
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
            <span>من {total} موظف</span>
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
      <TeamFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        member={editingMember}
        onSuccess={fetchData}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف الموظف"
        description={`هل أنت متأكد من حذف "${deleteTarget?.fullName}"؟ سيتم تعطيل الموظف وإخفائه من القوائم الافتراضية. يمكنك استعادته لاحقاً.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={!!restoreTarget}
        onOpenChange={(open) => !open && setRestoreTarget(null)}
        title="استعادة الموظف"
        description={`هل تريد استعادة "${restoreTarget?.fullName}"؟ سيصبح الموظف نشطاً مرة أخرى.`}
        confirmLabel="استعادة"
        variant="default"
        onConfirm={handleRestore}
      />
    </div>
  );
}

/* ============================================
   TeamFormModal — Create / Edit team member
   React Hook Form + Zod
   ============================================ */

type TeamFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: TeamMemberTableRow | null;
  onSuccess?: () => void;
};

/** Form values — joinDate is string for date input. */
type TeamFormValues = {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  joinDate: string;
  notes: string;
  photo?: string;
};

export function TeamFormModal({
  open,
  onOpenChange,
  member,
  onSuccess,
}: TeamFormModalProps) {
  const isEdit = !!member;
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeamFormValues>({
    resolver: zodResolver(
      isEdit ? updateTeamMemberSchema : createTeamMemberSchema
    ) as unknown as Resolver<TeamFormValues>,
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      role: "PHOTOGRAPHER",
      status: "ACTIVE",
      joinDate: "",
      notes: "",
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (member) {
      reset({
        fullName: member.fullName,
        email: member.email,
        phone: member.phone,
        role: member.role,
        status: member.status,
        joinDate: new Date(member.joinDate).toISOString().slice(0, 10),
        notes: member.notes ?? "",
      });
    } else {
      reset({
        fullName: "",
        email: "",
        phone: "",
        role: "PHOTOGRAPHER",
        status: "ACTIVE",
        joinDate: "",
        notes: "",
      });
    }
  }, [member, reset]);

  const onSubmit = async (data: TeamFormValues) => {
    setSubmitting(true);

    const formData = new FormData();
    formData.append("fullName", data.fullName);
    formData.append("email", data.email);
    formData.append("phone", data.phone);
    formData.append("photo", "");
    formData.append("role", data.role);
    formData.append("status", data.status);
    formData.append("joinDate", new Date(data.joinDate).toISOString());
    formData.append("notes", data.notes ?? "");

    try {
      if (isEdit && member) {
        const result = await updateTeamMemberAction(
          member.id,
          { success: false },
          formData
        );
        if (result.success) {
          toast.success("تم تحديث بيانات الموظف");
          onOpenChange(false);
          onSuccess?.();
        } else {
          toast.error(result.error ?? "فشل في تحديث الموظف");
        }
      } else {
        const result = await createTeamMemberAction(
          { success: false },
          formData
        );
        if (result.success) {
          toast.success("تم إضافة الموظف");
          onOpenChange(false);
          onSuccess?.();
        } else {
          toast.error(result.error ?? "فشل في إضافة الموظف");
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "تعديل الموظف" : "إضافة موظف جديد"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "قم بتحديث بيانات الموظف"
              : "أدخل بيانات الموظف الجديد"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName">
              الاسم الكامل <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fullName"
              placeholder="اسم الموظف"
              aria-invalid={!!errors.fullName}
              aria-describedby={
                errors.fullName ? "fullName-error" : undefined
              }
              {...register("fullName")}
            />
            {errors.fullName && (
              <p
                id="fullName-error"
                className="text-xs text-destructive"
                role="alert"
              >
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">
              البريد الإلكتروني <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              dir="ltr"
              className="text-end"
              placeholder="employee@example.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p
                id="email-error"
                className="text-xs text-destructive"
                role="alert"
              >
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="phone">
              رقم الهاتف <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              dir="ltr"
              className="text-end"
              placeholder="05xxxxxxxx"
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "phone-error" : undefined}
              {...register("phone")}
            />
            {errors.phone && (
              <p
                id="phone-error"
                className="text-xs text-destructive"
                role="alert"
              >
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label htmlFor="role">الدور</Label>
            <select
              id="role"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("role")}
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label htmlFor="status">الحالة</Label>
            <select
              id="status"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("status")}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Join Date */}
          <div className="space-y-1.5">
            <Label htmlFor="joinDate">
              تاريخ الانضمام <span className="text-destructive">*</span>
            </Label>
            <Input
              id="joinDate"
              type="date"
              dir="ltr"
              aria-invalid={!!errors.joinDate}
              aria-describedby={
                errors.joinDate ? "joinDate-error" : undefined
              }
              {...register("joinDate")}
            />
            {errors.joinDate && (
              <p
                id="joinDate-error"
                className="text-xs text-destructive"
                role="alert"
              >
                {errors.joinDate.message}
              </p>
            )}
          </div>

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
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "حفظ التغييرات" : "إضافة الموظف"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
