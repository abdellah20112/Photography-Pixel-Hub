"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createProjectSchema,
  updateProjectSchema,
} from "@/lib/validations/project";
import { createProjectAction, type CreateProjectState } from "@/actions/projects/create-project";
import { updateProjectAction, type UpdateProjectState } from "@/actions/projects/update-project";
import { getClientsAction } from "@/actions/clients/get-clients";
import type { ProjectTableRow } from "@/types/project";

/* ============================================
   ProjectFormModal — Create / Edit project
   React Hook Form + Zod
   ============================================ */

type ProjectFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: ProjectTableRow | null;
  onSuccess?: () => void;
};

/** Form values — deadline is string for datetime-local input. */
type ProjectFormValues = {
  clientId: string;
  name: string;
  description?: string;
  retentionPeriod: "TWENTY_FOUR_HOURS" | "FORTY_EIGHT_HOURS" | "SEVENTY_TWO_HOURS" | "SEVEN_DAYS" | "CUSTOM";
  deadline: string;
  status: "DRAFT" | "IN_PROGRESS" | "READY" | "DOWNLOAD_ENABLED" | "COMPLETED" | "ARCHIVED";
};

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "مسودة" },
  { value: "IN_PROGRESS", label: "قيد التنفيذ" },
  { value: "READY", label: "جاهز" },
  { value: "DOWNLOAD_ENABLED", label: "التحميل مفعّل" },
  { value: "COMPLETED", label: "مكتمل" },
] as const;

const RETENTION_OPTIONS = [
  { value: "TWENTY_FOUR_HOURS", label: "24 ساعة" },
  { value: "FORTY_EIGHT_HOURS", label: "48 ساعة" },
  { value: "SEVENTY_TWO_HOURS", label: "72 ساعة" },
  { value: "SEVEN_DAYS", label: "7 أيام" },
  { value: "CUSTOM", label: "مخصص" },
] as const;

type ClientOption = {
  id: string;
  name: string;
  clientCode: string;
};

export function ProjectFormModal({
  open,
  onOpenChange,
  project,
  onSuccess,
}: ProjectFormModalProps) {
  const isEdit = !!project;
  const [submitting, setSubmitting] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const hasFetched = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(isEdit ? updateProjectSchema : createProjectSchema) as never,
    defaultValues: {
      clientId: "",
      name: "",
      description: "",
      retentionPeriod: "TWENTY_FOUR_HOURS",
      deadline: "",
      status: "DRAFT",
    },
  });

  // Fetch active clients for dropdown (once on first open)
  useEffect(() => {
    if (!open || hasFetched.current) return;
    hasFetched.current = true;
    let active = true;
    (async () => {
      const result = await getClientsAction({ page: 1, pageSize: 100, filter: "active" });
      if (!active) return;
      setClients(
        result.items.map((c) => ({
          id: c.id,
          name: c.name,
          clientCode: c.clientCode,
        }))
      );
      setLoadingClients(false);
    })();
    return () => { active = false };
  }, [open]);

  // Populate form when editing
  useEffect(() => {
    if (project) {
      reset({
        clientId: project.clientId,
        name: project.name,
        description: project.description ?? "",
        retentionPeriod: project.retentionPeriod,
        deadline: project.deadline
          ? new Date(project.deadline).toISOString().slice(0, 16)
          : "",
        status: project.status === "ARCHIVED" ? "DRAFT" : project.status,
      });
    } else {
      reset({
        clientId: "",
        name: "",
        description: "",
        retentionPeriod: "TWENTY_FOUR_HOURS",
        deadline: "",
        status: "DRAFT",
      });
    }
  }, [project, reset]);

  const onSubmit = async (data: ProjectFormValues) => {
    setSubmitting(true);
    const formData = new FormData();
    formData.append("clientId", data.clientId);
    formData.append("name", data.name);
    formData.append("description", data.description ?? "");
    formData.append("retentionPeriod", data.retentionPeriod);
    formData.append("deadline", new Date(data.deadline).toISOString());
    formData.append("status", data.status);

    try {
      if (isEdit && project) {
        const result: UpdateProjectState = await updateProjectAction(
          project.id,
          { success: false },
          formData
        );
        if (result.success) {
          onOpenChange(false);
          onSuccess?.();
        }
      } else {
        const result: CreateProjectState = await createProjectAction(
          { success: false },
          formData
        );
        if (result.success) {
          onOpenChange(false);
          onSuccess?.();
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "تعديل المشروع" : "إضافة مشروع جديد"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "قم بتحديث بيانات المشروع"
              : "أدخل بيانات المشروع الجديد"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Client */}
          <div className="space-y-1.5">
            <Label htmlFor="clientId">
              العميل <span className="text-destructive">*</span>
            </Label>
            <select
              id="clientId"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              {...register("clientId")}
              aria-invalid={!!errors.clientId}
              aria-describedby={errors.clientId ? "clientId-error" : undefined}
              disabled={loadingClients}
            >
              <option value="">
                {loadingClients ? "جاري التحميل..." : "اختر العميل"}
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.clientCode})
                </option>
              ))}
            </select>
            {errors.clientId && (
              <p id="clientId-error" className="text-xs text-destructive" role="alert">
                {errors.clientId.message}
              </p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">
              اسم المشروع <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="اسم المشروع"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
              {...register("name")}
            />
            {errors.name && (
              <p id="name-error" className="text-xs text-destructive" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">الوصف</Label>
            <textarea
              id="description"
              rows={3}
              placeholder="وصف المشروع (اختياري)"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive" role="alert">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Retention Period */}
          <div className="space-y-1.5">
            <Label htmlFor="retentionPeriod">فترة الاحتفاظ</Label>
            <select
              id="retentionPeriod"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("retentionPeriod")}
            >
              {RETENTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Deadline */}
          <div className="space-y-1.5">
            <Label htmlFor="deadline">
              الموعد النهائي <span className="text-destructive">*</span>
            </Label>
            <Input
              id="deadline"
              type="datetime-local"
              aria-invalid={!!errors.deadline}
              aria-describedby={errors.deadline ? "deadline-error" : undefined}
              {...register("deadline")}
            />
            {errors.deadline && (
              <p id="deadline-error" className="text-xs text-destructive" role="alert">
                {errors.deadline.message}
              </p>
            )}
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
              {isEdit ? "حفظ التغييرات" : "إضافة المشروع"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
