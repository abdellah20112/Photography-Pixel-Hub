"use client";

import { useState, useEffect, useRef } from "react";
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
  createModelSchema,
  updateModelSchema,
} from "@/lib/validations/model";
import { createModelAction, type CreateModelState } from "@/actions/models/create-model";
import { updateModelAction, type UpdateModelState } from "@/actions/models/update-model";
import type { ModelTableRow } from "@/types/model";

/* ============================================
   ModelFormModal — Create / Edit model
   React Hook Form + Zod
   ============================================ */

type ModelFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model?: ModelTableRow | null;
  onSuccess?: () => void;
};

type FormValues = {
  fullName: string;
  phone: string;
  whatsapp: string;
  email: string;
  notes: string;
  status: "ACTIVE" | "INACTIVE";
};

export function ModelFormModal({ open, onOpenChange, model, onSuccess }: ModelFormModalProps) {
  const isEdit = !!model;
  const [submitting, setSubmitting] = useState(false);
  const hasFetched = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? updateModelSchema : createModelSchema) as never,
    defaultValues: {
      fullName: "",
      phone: "",
      whatsapp: "",
      email: "",
      notes: "",
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    if (model) {
      reset({
        fullName: model.fullName,
        phone: model.phone,
        whatsapp: model.whatsapp ?? "",
        email: model.email ?? "",
        notes: model.notes ?? "",
        status: model.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      });
    } else {
      reset({
        fullName: "",
        phone: "",
        whatsapp: "",
        email: "",
        notes: "",
        status: "ACTIVE",
      });
    }
  }, [model, reset]);

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    const formData = new FormData();
    formData.append("fullName", data.fullName);
    formData.append("phone", data.phone);
    formData.append("whatsapp", data.whatsapp);
    formData.append("email", data.email);
    formData.append("notes", data.notes);
    formData.append("status", data.status);

    try {
      if (isEdit && model) {
        const result: UpdateModelState = await updateModelAction(model.id, { success: false }, formData);
        if (result.success) {
          onOpenChange(false);
          onSuccess?.();
        }
      } else {
        const result: CreateModelState = await createModelAction({ success: false }, formData);
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "تعديل الموديل" : "إضافة موديل جديد"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "قم بتحديث بيانات الموديل" : "أدخل بيانات الموديل الجديد"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="fullName">الاسم الكامل <span className="text-destructive">*</span></Label>
            <Input id="fullName" placeholder="الاسم الكامل" {...register("fullName")} />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">الهاتف <span className="text-destructive">*</span></Label>
            <Input id="phone" dir="ltr" className="text-end" placeholder="05xxxxxxxx" {...register("phone")} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="whatsapp">واتساب</Label>
            <Input id="whatsapp" dir="ltr" className="text-end" placeholder="05xxxxxxxx" {...register("whatsapp")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="email" dir="ltr" className="text-end" placeholder="model@example.com" {...register("email")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="status">الحالة</Label>
            <select
              id="status"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("status")}
            >
              <option value="ACTIVE">نشط</option>
              <option value="INACTIVE">غير نشط</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">ملاحظات</Label>
            <textarea
              id="notes"
              rows={2}
              placeholder="ملاحظات إضافية (اختياري)"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("notes")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              إلغاء
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "حفظ التغييرات" : "إضافة الموديل"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
