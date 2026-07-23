"use client";

import { useEffect, useState, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff, Video } from "lucide-react";

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
  createDeliverySchema,
  updateDeliverySchema,
} from "@/lib/validations/delivery";
import { createDeliveryAction, type CreateDeliveryState } from "@/actions/deliveries/create-delivery";
import { updateDeliveryAction, type UpdateDeliveryState } from "@/actions/deliveries/update-delivery";
import { getProjectsAction } from "@/actions/projects/get-projects";
import { getUploadsAction } from "@/actions/uploads/get-uploads";
import type { DeliveryTableRow } from "@/types/delivery";

/* ============================================
   DeliveryFormModal — Create / Edit delivery
   React Hook Form + Zod
   ============================================ */

type DeliveryFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  delivery?: DeliveryTableRow | null;
  onSuccess?: () => void;
};

type FormValues = {
  projectId: string;
  title: string;
  expiresAt: string;
  downloadEnabled: boolean;
  allowStreaming: boolean;
  allowComments: boolean;
  passwordProtected: boolean;
  password: string;
  videoIds: string[];
};

type ProjectOption = { id: string; name: string; projectCode: string };
type VideoOption = {
  id: string;
  title: string;
  videoCode: string;
  duration: number | null;
};

export function DeliveryFormModal({
  open,
  onOpenChange,
  delivery,
  onSuccess,
}: DeliveryFormModalProps) {
  const isEdit = !!delivery;
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [videos, setVideos] = useState<VideoOption[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const hasFetched = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? updateDeliverySchema : createDeliverySchema) as never,
    defaultValues: {
      projectId: "",
      title: "",
      expiresAt: "",
      downloadEnabled: true,
      allowStreaming: true,
      allowComments: false,
      passwordProtected: false,
      password: "",
      videoIds: [],
    },
  });

  const watchProjectId = useWatch({ control, name: "projectId" });
  const watchPasswordProtected = useWatch({ control, name: "passwordProtected" });

  // Fetch projects
  useEffect(() => {
    if (!open || hasFetched.current) return;
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
    return () => { active = false };
  }, [open]);

  // Fetch videos when project changes
  useEffect(() => {
    if (!watchProjectId) return;
    let active = true;
    (async () => {
      const result = await getUploadsAction({
        page: 1,
        pageSize: 100,
        projectId: watchProjectId,
        filter: "ready",
      });
      if (!active) return;
      setVideos(
        result.items.map((v) => ({
          id: v.id,
          title: v.title,
          videoCode: v.videoCode,
          duration: v.duration,
        }))
      );
    })();
    return () => { active = false };
  }, [watchProjectId]);

  // Populate form when editing
  useEffect(() => {
    if (delivery) {
      reset({
        projectId: delivery.projectId,
        title: delivery.title,
        expiresAt: delivery.expiresAt
          ? new Date(delivery.expiresAt).toISOString().slice(0, 16)
          : "",
        downloadEnabled: delivery.downloadEnabled,
        allowStreaming: delivery.allowStreaming,
        allowComments: false,
        passwordProtected: delivery.passwordProtected,
        password: "",
        videoIds: [],
      });
    }
  }, [delivery, reset]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSelectedVideos([]);
      hasFetched.current = false;
      reset({
        projectId: "",
        title: "",
        expiresAt: "",
        downloadEnabled: true,
        allowStreaming: true,
        allowComments: false,
        passwordProtected: false,
        password: "",
        videoIds: [],
      });
    }
    onOpenChange(next);
  };

  const toggleVideo = (videoId: string) => {
    setSelectedVideos((prev) =>
      prev.includes(videoId)
        ? prev.filter((v) => v !== videoId)
        : [...prev, videoId]
    );
  };

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    const formData = new FormData();
    formData.append("projectId", data.projectId);
    formData.append("title", data.title);
    formData.append("expiresAt", new Date(data.expiresAt).toISOString());
    formData.append("downloadEnabled", String(data.downloadEnabled));
    formData.append("allowStreaming", String(data.allowStreaming));
    formData.append("allowComments", String(data.allowComments));
    formData.append("passwordProtected", String(data.passwordProtected));
    formData.append("password", data.password || "");
    for (const vid of selectedVideos) {
      formData.append("videoIds", vid);
    }

    try {
      if (isEdit && delivery) {
        const result: UpdateDeliveryState = await updateDeliveryAction(
          delivery.id,
          { success: false },
          formData
        );
        if (result.success) {
          handleOpenChange(false);
          onSuccess?.();
        }
      } else {
        const result: CreateDeliveryState = await createDeliveryAction(
          { success: false },
          formData
        );
        if (result.success) {
          handleOpenChange(false);
          onSuccess?.();
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "تعديل التسليم" : "إنشاء تسليم جديد"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "قم بتحديث بيانات التسليم" : "أنشئ تسليماً جديداً للعميل"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Project */}
          <div className="space-y-1.5">
            <Label htmlFor="projectId">المشروع <span className="text-destructive">*</span></Label>
            <select
              id="projectId"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              {...register("projectId")}
              disabled={loadingProjects || isEdit}
            >
              <option value="">{loadingProjects ? "جاري التحميل..." : "اختر المشروع"}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.projectCode})</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">عنوان التسليم <span className="text-destructive">*</span></Label>
            <Input id="title" placeholder="عنوان التسليم" {...register("title")} />
          </div>

          {/* Expiration */}
          <div className="space-y-1.5">
            <Label htmlFor="expiresAt">تاريخ الانتهاء <span className="text-destructive">*</span></Label>
            <Input id="expiresAt" type="datetime-local" {...register("expiresAt")} />
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded" {...register("downloadEnabled")} />
              تفعيل التحميل
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded" {...register("allowStreaming")} />
              السماح بالبث
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded" {...register("allowComments")} />
              السماح بالتعليقات
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded" {...register("passwordProtected")} />
              حماية بكلمة مرور
            </label>
          </div>

          {/* Password */}
          {watchPasswordProtected && (
            <div className="space-y-1.5">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="أدخل كلمة المرور"
                  className="pe-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Video Selection */}
          {watchProjectId && (
            <div className="space-y-2">
              <Label>الفيديوهات <span className="text-destructive">*</span></Label>
              {videos.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  لا توجد فيديوهات جاهزة في هذا المشروع
                </p>
              ) : (
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
                  {videos.map((v) => (
                    <label
                      key={v.id}
                      className="flex cursor-pointer items-center gap-2 rounded p-1.5 text-sm hover:bg-muted/50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedVideos.includes(v.id)}
                        onChange={() => toggleVideo(v.id)}
                        className="rounded"
                      />
                      <Video className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate">{v.title}</span>
                      <span className="ms-auto font-mono text-xs text-muted-foreground">{v.videoCode}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
              إلغاء
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "حفظ التغييرات" : "إنشاء التسليم"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
