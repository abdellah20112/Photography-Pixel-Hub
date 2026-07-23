"use client";

import { useEffect, useState } from "react";
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
  createClientSchema,
  updateClientSchema,
  type CreateClientInput,
} from "@/lib/validations/client";
import { createClientAction, type CreateClientState } from "@/actions/clients/create-client";
import { updateClientAction, type UpdateClientState } from "@/actions/clients/update-client";
import type { ClientTableRow } from "@/types/client";

/* ============================================
   ClientFormModal — Create / Edit client
   React Hook Form + Zod
   Email optional, phone required (Moroccan)
   ============================================ */

type ClientFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: ClientTableRow | null;
  onSuccess?: () => void;
};

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "نشط" },
  { value: "BLOCKED", label: "محظور" },
] as const;

export function ClientFormModal({
  open,
  onOpenChange,
  client,
  onSuccess,
}: ClientFormModalProps) {
  const isEdit = !!client;
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateClientInput>({
    resolver: zodResolver(isEdit ? updateClientSchema : createClientSchema) as never,
    defaultValues: {
      name: "",
      company: "",
      email: "",
      phone: "",
      notes: "",
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    if (client) {
      reset({
        name: client.name,
        company: client.company ?? "",
        email: client.email ?? "",
        phone: client.phone ?? "",
        notes: client.notes ?? "",
        status: client.status === "ARCHIVED" ? "ACTIVE" : client.status,
      });
    } else {
      reset({
        name: "",
        company: "",
        email: "",
        phone: "",
        notes: "",
        status: "ACTIVE",
      });
    }
  }, [client, reset]);

  const onSubmit = async (data: CreateClientInput) => {
    setSubmitting(true);
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("company", data.company ?? "");
    formData.append("email", data.email ?? "");
    formData.append("phone", data.phone);
    formData.append("notes", data.notes ?? "");
    formData.append("status", data.status);

    try {
      if (isEdit && client) {
        const result: UpdateClientState = await updateClientAction(
          client.id,
          { success: false },
          formData
        );
        if (result.success) {
          onOpenChange(false);
          onSuccess?.();
        }
      } else {
        const result: CreateClientState = await createClientAction(
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "تعديل العميل" : "إضافة عميل جديد"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "قم بتحديث بيانات العميل"
              : "أدخل بيانات العميل الجديد"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">
              الاسم <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="اسم العميل"
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

          {/* Phone — required, Moroccan format */}
          <div className="space-y-1.5">
            <Label htmlFor="phone">
              رقم الهاتف <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              dir="ltr"
              className="text-end"
              placeholder="06xxxxxxxx أو 07xxxxxxxx"
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "phone-error" : undefined}
              {...register("phone")}
            />
            {errors.phone && (
              <p id="phone-error" className="text-xs text-destructive" role="alert">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Email — optional */}
          <div className="space-y-1.5">
            <Label htmlFor="email">البريد الإلكتروني (اختياري)</Label>
            <Input
              id="email"
              type="email"
              dir="ltr"
              className="text-end"
              placeholder="client@example.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p id="email-error" className="text-xs text-destructive" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Company */}
          <div className="space-y-1.5">
            <Label htmlFor="company">الشركة</Label>
            <Input
              id="company"
              placeholder="اسم الشركة (اختياري)"
              {...register("company")}
            />
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
              {isEdit ? "حفظ التغييرات" : "إضافة العميل"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
