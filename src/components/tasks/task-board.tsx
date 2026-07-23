"use client";

import { useState, useCallback, useEffect, useTransition, useMemo } from "react";
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
  ListTodo,
  AlertTriangle,
  CheckCircle,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/utils/format";
import { getTasksAction, getTaskDashboardStatsAction } from "@/actions/tasks/get-tasks";
import { createTaskAction } from "@/actions/tasks/create-task";
import { updateTaskAction } from "@/actions/tasks/update-task";
import { deleteTaskAction } from "@/actions/tasks/delete-task";
import { getProjectsAction } from "@/actions/projects/get-projects";
import type { TaskTableRow, TaskDashboardStats } from "@/types/task";
import {
  createTaskSchema,
  updateTaskSchema,
  type TaskFilterValue,
  type TaskSortValue,
  type TaskPriorityValue,
} from "@/lib/validations/task";

/* ============================================
   TaskBoard â€” Full-featured task management
   Stats, search, filter, sort, table, CRUD
   ============================================ */

const FILTER_OPTIONS: { value: TaskFilterValue; label: string }[] = [
  { value: "all", label: "Ø§Ù„ÙƒÙ„" },
  { value: "todo", label: "Ù…Ø·Ù„ÙˆØ¨" },
  { value: "in_progress", label: "Ù‚ÙŠØ¯ Ø§Ù„ØªÙ†ÙÙŠØ°" },
  { value: "in_review", label: "Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©" },
  { value: "blocked", label: "Ù…Ø­Ø¸ÙˆØ±Ø©" },
  { value: "done", label: "Ù…ÙƒØªÙ…Ù„" },
];

const SORT_OPTIONS: { value: TaskSortValue; label: string }[] = [
  { value: "newest", label: "Ø§Ù„Ø£Ø­Ø¯Ø«" },
  { value: "oldest", label: "Ø§Ù„Ø£Ù‚Ø¯Ù…" },
  { value: "due_date", label: "ØªØ§Ø±ÙŠØ® Ø§Ù„Ø§Ø³ØªØ­Ù‚Ø§Ù‚" },
  { value: "priority", label: "Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©" },
  { value: "alphabetical", label: "Ø£Ø¨Ø¬Ø¯ÙŠ" },
];

const PRIORITY_OPTIONS: { value: TaskPriorityValue; label: string }[] = [
  { value: "LOW", label: "Ù…Ù†Ø®ÙØ¶" },
  { value: "MEDIUM", label: "Ù…ØªÙˆØ³Ø·" },
  { value: "HIGH", label: "Ø¹Ø§Ù„ÙŠ" },
  { value: "URGENT", label: "Ø¹Ø§Ø¬Ù„" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/** Convert a Date to a `yyyy-MM-dd` string for `<input type="date">`. */
function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function statusBadge(status: string) {
  switch (status) {
    case "TODO":
      return <Badge variant="secondary">Ù…Ø·Ù„ÙˆØ¨</Badge>;
    case "IN_PROGRESS":
      return <Badge variant="default" className="bg-blue-600 hover:bg-blue-600">Ù‚ÙŠØ¯ Ø§Ù„ØªÙ†ÙÙŠØ°</Badge>;
    case "IN_REVIEW":
      return <Badge variant="default" className="bg-amber-600 hover:bg-amber-600">Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©</Badge>;
    case "BLOCKED":
      return <Badge variant="destructive">Ù…Ø­Ø¸ÙˆØ±Ø©</Badge>;
    case "DONE":
      return <Badge variant="default" className="bg-green-600 hover:bg-green-600">Ù…ÙƒØªÙ…Ù„</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function priorityBadge(priority: string) {
  switch (priority) {
    case "LOW":
      return <Badge variant="secondary">Ù…Ù†Ø®ÙØ¶</Badge>;
    case "MEDIUM":
      return <Badge variant="default">Ù…ØªÙˆØ³Ø·</Badge>;
    case "HIGH":
      return <Badge variant="default" className="bg-amber-600 hover:bg-amber-600">Ø¹Ø§Ù„ÙŠ</Badge>;
    case "URGENT":
      return <Badge variant="destructive">Ø¹Ø§Ø¬Ù„</Badge>;
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
}

/* â”€â”€ StatCard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <DashboardCard className="p-4">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
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

/* â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

type ProjectOption = { id: string; name: string; projectCode: string };

type TaskFormValues = {
  projectId: string;
  title: string;
  description: string;
  priority: TaskPriorityValue;
  dueDate: string;
  estimatedHours: number;
};

/* ============================================
   TaskFormModal â€” Create / Edit task
   React Hook Form + Zod
   ============================================ */

type TaskFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TaskTableRow | null;
  projects: ProjectOption[];
  onSuccess?: () => void;
};

function TaskFormModal({
  open,
  onOpenChange,
  task,
  projects,
  onSuccess,
}: TaskFormModalProps) {
  const isEdit = !!task;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(isEdit ? updateTaskSchema : createTaskSchema) as never,
    defaultValues: {
      projectId: "",
      title: "",
      description: "",
      priority: "MEDIUM",
      dueDate: "",
      estimatedHours: 0,
    },
  });

  // Watch priority for a live badge preview (useWatch avoids React Compiler warnings)
  const watchedPriority = useWatch<TaskFormValues>({ control, name: "priority" });

  // Populate form when editing / reset when creating
  useEffect(() => {
    if (task) {
      reset({
        projectId: task.projectId,
        title: task.title,
        description: task.description ?? "",
        priority: task.priority,
        dueDate: toDateInputValue(task.dueDate),
        estimatedHours: task.estimatedHours,
      });
    } else {
      reset({
        projectId: "",
        title: "",
        description: "",
        priority: "MEDIUM",
        dueDate: "",
        estimatedHours: 0,
      });
    }
  }, [task, reset]);

  const onSubmit = async (data: TaskFormValues) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (!isEdit) {
        formData.append("projectId", data.projectId);
      }
      formData.append("title", data.title);
      formData.append("description", data.description ?? "");
      formData.append("priority", data.priority);
      formData.append("dueDate", data.dueDate);
      formData.append("estimatedHours", String(data.estimatedHours ?? 0));

      if (isEdit && task) {
        const result = await updateTaskAction(task.id, { success: false }, formData);
        if (result.success) {
          toast.success("ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ù…Ù‡Ù…Ø©");
          onOpenChange(false);
          onSuccess?.();
        } else {
          toast.error(result.error ?? "ÙØ´Ù„ ÙÙŠ ØªØ­Ø¯ÙŠØ« Ø§Ù„Ù…Ù‡Ù…Ø©");
        }
      } else {
        const result = await createTaskAction({ success: false }, formData);
        if (result.success) {
          toast.success("ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ù‡Ù…Ø©");
          onOpenChange(false);
          onSuccess?.();
        } else {
          toast.error(result.error ?? "ÙØ´Ù„ ÙÙŠ Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ù‡Ù…Ø©");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ù…Ù‡Ù…Ø©" : "Ø¥Ø¶Ø§ÙØ© Ù…Ù‡Ù…Ø© Ø¬Ø¯ÙŠØ¯Ø©"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Ù‚Ù… Ø¨ØªØ­Ø¯ÙŠØ« Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ù‡Ù…Ø©" : "Ø£Ø¯Ø®Ù„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ù‡Ù…Ø© Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Project */}
          <div className="space-y-1.5">
            <Label htmlFor="projectId">
              Ø§Ù„Ù…Ø´Ø±ÙˆØ¹ <span className="text-destructive">*</span>
            </Label>
            <select
              id="projectId"
              disabled={isEdit}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              aria-invalid={!!errors.projectId}
              aria-describedby={errors.projectId ? "projectId-error" : undefined}
              {...register("projectId")}
            >
              <option value="" disabled>
                Ø§Ø®ØªØ± Ø§Ù„Ù…Ø´Ø±ÙˆØ¹
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.projectCode})
                </option>
              ))}
            </select>
            {errors.projectId && (
              <p id="projectId-error" className="text-xs text-destructive" role="alert">
                {errors.projectId.message}
              </p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">
              Ø§Ù„Ø¹Ù†ÙˆØ§Ù† <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ù…Ù‡Ù…Ø©"
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
            <Label htmlFor="description">Ø§Ù„ÙˆØµÙ</Label>
            <textarea
              id="description"
              rows={3}
              placeholder="ÙˆØµÙ Ø§Ù„Ù…Ù‡Ù…Ø© (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive" role="alert">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <Label htmlFor="priority">Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©</Label>
            <div className="flex items-center gap-2">
              <select
                id="priority"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register("priority")}
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {watchedPriority ? (
                <span className="shrink-0">{priorityBadge(String(watchedPriority))}</span>
              ) : null}
            </div>
          </div>

          {/* Due Date + Estimated Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">
                ØªØ§Ø±ÙŠØ® Ø§Ù„Ø§Ø³ØªØ­Ù‚Ø§Ù‚ <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dueDate"
                type="date"
                aria-invalid={!!errors.dueDate}
                aria-describedby={errors.dueDate ? "dueDate-error" : undefined}
                {...register("dueDate")}
              />
              {errors.dueDate && (
                <p id="dueDate-error" className="text-xs text-destructive" role="alert">
                  {errors.dueDate.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="estimatedHours">Ø§Ù„Ø³Ø§Ø¹Ø§Øª Ø§Ù„Ù…Ù‚Ø¯Ø±Ø©</Label>
              <Input
                id="estimatedHours"
                type="number"
                min="0"
                step="0.5"
                placeholder="0"
                aria-invalid={!!errors.estimatedHours}
                aria-describedby={errors.estimatedHours ? "estimatedHours-error" : undefined}
                {...register("estimatedHours")}
              />
              {errors.estimatedHours && (
                <p id="estimatedHours-error" className="text-xs text-destructive" role="alert">
                  {errors.estimatedHours.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Ø¥Ù„ØºØ§Ø¡
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Ø­ÙØ¸ Ø§Ù„ØªØºÙŠÙŠØ±Ø§Øª" : "Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ù…Ù‡Ù…Ø©"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================
   TaskBoard â€” Main component
   ============================================ */

export function TaskBoard() {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<{
    items: TaskTableRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null>(null);

  const [stats, setStats] = useState<TaskDashboardStats>({
    tasksToday: 0,
    overdueTasks: 0,
    reviewTasks: 0,
    completedToday: 0,
  });

  const [projects, setProjects] = useState<ProjectOption[]>([]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TaskFilterValue>("all");
  const [sort, setSort] = useState<TaskSortValue>("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskTableRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaskTableRow | null>(null);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");

  // â”€â”€ Fetch tasks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fetchData = useCallback(async () => {
    startTransition(async () => {
      const result = await getTasksAction({
        page,
        pageSize,
        search: search || undefined,
        status: filter,
        sort,
      });
      setData(result);
    });
  }, [page, pageSize, search, filter, sort]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // â”€â”€ Fetch dashboard stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fetchStats = useCallback(async () => {
    const result = await getTaskDashboardStatsAction();
    setStats(result);
  }, []);

  useEffect(() => {
    let active = true;
    getTaskDashboardStatsAction().then((result) => {
      if (active) setStats(result);
    });
    return () => { active = false };
  }, []);

  // â”€â”€ Fetch projects (form select + table lookup) â”€â”€
  const fetchProjects = useCallback(async () => {
    const result = await getProjectsAction({ page: 1, pageSize: 100 });
    setProjects(result.items);
  }, []);

  useEffect(() => {
    let active = true;
    getProjectsAction({ page: 1, pageSize: 100 }).then((result) => {
      if (active) setProjects(result.items);
    });
    return () => { active = false };
  }, []);

  // â”€â”€ Debounce search input â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // â”€â”€ Project lookup map â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const projectMap = useMemo(() => {
    const map = new Map<string, ProjectOption>();
    projects.forEach((p) => map.set(p.id, p));
    return map;
  }, [projects]);

  // â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleCreate = () => {
    setEditingTask(null);
    setFormOpen(true);
  };

  const handleEdit = (task: TaskTableRow) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteTaskAction(deleteTarget.id);
    if (result.success) {
      toast.success("ØªÙ… Ø­Ø°Ù Ø§Ù„Ù…Ù‡Ù…Ø©");
      fetchData();
      fetchStats();
    } else {
      toast.error(result.error ?? "ÙØ´Ù„ ÙÙŠ Ø­Ø°Ù Ø§Ù„Ù…Ù‡Ù…Ø©");
    }
    setDeleteTarget(null);
  };

  const handleSuccess = () => {
    fetchData();
    fetchStats();
  };

  // â”€â”€ Derived â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const isLoading = isPending && !data;

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={ListTodo}
          label="Ù…Ù‡Ø§Ù… Ø§Ù„ÙŠÙˆÙ…"
          value={stats.tasksToday}
          color="bg-blue-500/10 text-blue-500"
        />
        <StatCard
          icon={AlertTriangle}
          label="Ù…ØªØ£Ø®Ø±Ø©"
          value={stats.overdueTasks}
          color="bg-red-500/10 text-red-500"
        />
        <StatCard
          icon={CheckCircle}
          label="Ù…ÙƒØªÙ…Ù„Ø© Ø§Ù„ÙŠÙˆÙ…"
          value={stats.completedToday}
          color="bg-green-500/10 text-green-500"
        />
        <StatCard
          icon={Eye}
          label="Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©"
          value={stats.reviewTasks}
          color="bg-amber-500/10 text-amber-500"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Ø¨Ø­Ø« Ø¨Ø§Ù„Ø¹Ù†ÙˆØ§Ù†ØŒ Ø§Ù„ÙƒÙˆØ¯ØŒ Ø§Ù„Ù…Ø³Ø¤ÙˆÙ„..."
            className="ps-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Ø¨Ø­Ø« Ø¹Ù† Ø§Ù„Ù…Ù‡Ø§Ù…"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Ø¥Ø¶Ø§ÙØ© Ù…Ù‡Ù…Ø©</span>
          </Button>
        </div>
      </div>

      {/* Filters + Sort */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1" role="tablist" aria-label="ØªØµÙÙŠØ© Ø§Ù„Ø­Ø§Ù„Ø©">
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
              setSort(e.target.value as TaskSortValue);
              setPage(1);
            }}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="ØªØ±ØªÙŠØ¨ Ø­Ø³Ø¨"
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
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border bg-card">
          <EmptyState
            icon={ListTodo}
            title={search ? "Ù„Ø§ ØªÙˆØ¬Ø¯ Ù†ØªØ§Ø¦Ø¬" : "Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ù‡Ø§Ù… Ø¨Ø¹Ø¯"}
            description={search ? "Ø¬Ø±Ù‘Ø¨ ØªØºÙŠÙŠØ± ÙƒÙ„Ù…Ø§Øª Ø§Ù„Ø¨Ø­Ø« Ø£Ùˆ Ø§Ù„ÙÙ„Ø§ØªØ±" : "Ø§Ø¨Ø¯Ø£ Ø¨Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ù…Ù‡Ø§Ù… Ù„Ø¥Ø¯Ø§Ø±Ø© Ù…Ø´Ø§Ø±ÙŠØ¹Ùƒ"}
            action={
              !search ? (
                <Button size="sm" onClick={handleCreate}>
                  <Plus className="h-4 w-4" />
                  Ø¥Ø¶Ø§ÙØ© Ù…Ù‡Ù…Ø©
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
                  ÙƒÙˆØ¯ Ø§Ù„Ù…Ù‡Ù…Ø©
                </th>
                <th scope="col" className="px-4 py-3 text-start font-medium text-muted-foreground">
                  Ø§Ù„Ø¹Ù†ÙˆØ§Ù†
                </th>
                <th scope="col" className="hidden px-4 py-3 text-start font-medium text-muted-foreground md:table-cell">
                  Ø§Ù„Ù…Ø´Ø±ÙˆØ¹
                </th>
                <th scope="col" className="px-4 py-3 text-start font-medium text-muted-foreground">
                  Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©
                </th>
                <th scope="col" className="px-4 py-3 text-start font-medium text-muted-foreground">
                  Ø§Ù„Ø­Ø§Ù„Ø©
                </th>
                <th scope="col" className="hidden px-4 py-3 text-start font-medium text-muted-foreground md:table-cell">
                  Ø§Ù„Ù…Ø³Ø¤ÙˆÙ„
                </th>
                <th scope="col" className="px-4 py-3 text-start font-medium text-muted-foreground">
                  ØªØ§Ø±ÙŠØ® Ø§Ù„Ø§Ø³ØªØ­Ù‚Ø§Ù‚
                </th>
                <th scope="col" className="px-4 py-3 text-end font-medium text-muted-foreground">
                  Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((task) => (
                <tr key={task.id} className="group transition-colors hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`${ROUTES.DASHBOARD_TASKS}/${task.id}`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {task.taskCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`${ROUTES.DASHBOARD_TASKS}/${task.id}`}
                      className="font-medium hover:underline"
                    >
                      {task.title}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {projectMap.get(task.projectId)?.name ?? "â€”"}
                  </td>
                  <td className="px-4 py-3">
                    {priorityBadge(task.priority)}
                  </td>
                  <td className="px-4 py-3">
                    {statusBadge(task.status)}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {task.assignee?.fullName ?? "â€”"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(task.dueDate)}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª ${task.title}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`${ROUTES.DASHBOARD_TASKS}/${task.id}`}>
                            <Eye className="h-4 w-4" />
                            <span>Ø¹Ø±Ø¶ Ø§Ù„ØªÙØ§ØµÙŠÙ„</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(task)}>
                          <Pencil className="h-4 w-4" />
                          <span>ØªØ¹Ø¯ÙŠÙ„</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(task)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Ø­Ø°Ù</span>
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
            <span>Ø¹Ø±Ø¶</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-7 rounded-md border border-input bg-transparent px-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Ø¹Ø¯Ø¯ Ø§Ù„Ø¹Ù†Ø§ØµØ± ÙÙŠ Ø§Ù„ØµÙØ­Ø©"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>
              Ù…Ù† {total} Ù…Ù‡Ù…Ø©
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
                aria-label="Ø§Ù„ØµÙØ­Ø© Ø§Ù„Ø³Ø§Ø¨Ù‚Ø©"
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
                aria-label="Ø§Ù„ØµÙØ­Ø© Ø§Ù„ØªØ§Ù„ÙŠØ©"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <TaskFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        task={editingTask}
        projects={projects}
        onSuccess={handleSuccess}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Ø­Ø°Ù Ø§Ù„Ù…Ù‡Ù…Ø©"
        description={`Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø­Ø°Ù "${deleteTarget?.title}"ØŸ Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø§Ù„ØªØ±Ø§Ø¬Ø¹ Ø¹Ù† Ù‡Ø°Ø§ Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡.`}
        confirmLabel="Ø­Ø°Ù"
        onConfirm={handleDelete}
      />
    </div>
  );
}
