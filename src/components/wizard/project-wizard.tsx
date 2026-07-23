"use client";

import { useState, useEffect, useCallback } from "react";
import {
  User,
  FolderKanban,
  UserCircle,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  MessageCircle,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getModelsAction } from "@/actions/models/get-models";
import {
  createProjectWizardAction,
  getModelVideoCountAction,
  type WizardData,
} from "@/actions/wizard/create-project-wizard";
import { formatDate, formatNumber } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

/* ============================================
   ProjectWizard — 4-step creation flow
   Client → Project → Model → Review & Save
   ============================================ */

type ModelOption = {
  id: string;
  modelCode: string;
  fullName: string;
  phone: string;
  photo: string | null;
  status: string;
};

type ProjectWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

const STEPS = [
  { num: 1, label: "العميل", icon: User },
  { num: 2, label: "المشروع", icon: FolderKanban },
  { num: 3, label: "الموديل", icon: UserCircle },
  { num: 4, label: "مراجعة", icon: CheckCircle2 },
] as const;

export function ProjectWizard({ open, onOpenChange, onSuccess }: ProjectWizardProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 — Client
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientCompany, setClientCompany] = useState("");

  // Step 2 — Project
  const [projectName, setProjectName] = useState("");
  const [shootingDate, setShootingDate] = useState("");
  const [price, setPrice] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  // Step 3 — Model
  const [models, setModels] = useState<ModelOption[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [videosCount, setVideosCount] = useState("1");
  const [script, setScript] = useState("");
  const [modelNotes, setModelNotes] = useState("");
  const [modelStats, setModelStats] = useState<{ currentVideos: number; currentProjects: number } | null>(null);

  // Result
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  // Reset on close
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setStep(1);
      setClientName("");
      setClientPhone("");
      setClientEmail("");
      setClientCompany("");
      setProjectName("");
      setShootingDate("");
      setPrice("");
      setInternalNotes("");
      setSelectedModelId("");
      setVideosCount("1");
      setScript("");
      setModelNotes("");
      setWhatsappUrl(null);
      setModelStats(null);
    }
    onOpenChange(next);
  };

  // Fetch models when entering step 3
  useEffect(() => {
    if (step !== 3 || models.length > 0) return;
    let active = true;
    getModelsAction({ page: 1, pageSize: 100, filter: "active" }).then((result) => {
      if (!active) return;
      setModels(
        result.items.map((m) => ({
          id: m.id,
          modelCode: m.modelCode,
          fullName: m.fullName,
          phone: m.phone,
          photo: m.photo,
          status: m.status,
        }))
      );
      setLoadingModels(false);
    });
    return () => { active = false };
  }, [step, models.length]);

  // Fetch model stats when model is selected
  useEffect(() => {
    if (!selectedModelId) return;
    let active = true;
    getModelVideoCountAction(selectedModelId).then((stats) => {
      if (active) setModelStats(stats);
    });
    return () => { active = false };
  }, [selectedModelId]);

  // Validation per step
  const step1Valid = clientName.trim().length >= 2 && /^0[67]\d{8}$/.test(clientPhone);
  const step2Valid = projectName.trim().length >= 2 && shootingDate && parseFloat(price) > 0;
  const step3Valid = selectedModelId && parseInt(videosCount) >= 1;

  const canProceed = step === 1 ? step1Valid : step === 2 ? step2Valid : step === 3 ? step3Valid : true;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const data: WizardData = {
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim() || undefined,
        clientCompany: clientCompany.trim() || undefined,
        projectName: projectName.trim(),
        shootingDate,
        price: parseFloat(price),
        internalNotes: internalNotes.trim() || undefined,
        modelId: selectedModelId,
        videosCount: parseInt(videosCount),
        script: script.trim() || undefined,
        modelNotes: modelNotes.trim() || undefined,
      };

      const result = await createProjectWizardAction(data);

      if (result.success) {
        toast.success("تم إنشاء المشروع بنجاح");
        setWhatsappUrl(result.whatsappUrl ?? null);
        setStep(4);
        // Don't close — show review step with WhatsApp button
      } else {
        toast.error(result.error ?? "فشل في إنشاء المشروع");
      }
    } catch {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = () => {
    handleOpenChange(false);
    onSuccess?.();
  };

  const handleSendWhatsApp = () => {
    if (whatsappUrl) {
      window.open(whatsappUrl, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5" />
            مشروع جديد
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-between gap-1 rounded-lg border bg-muted/50 p-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <div key={s.num} className="flex flex-1 items-center gap-1">
                <div
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                    isActive ? "bg-background text-foreground shadow-sm" : isDone ? "text-green-600" : "text-muted-foreground"
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Icon className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{s.num}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("h-px flex-1", isDone ? "bg-green-500/50" : "bg-border")} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step 1 — Client */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="w-name">الاسم <span className="text-destructive">*</span></Label>
              <Input
                id="w-name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="اسم العميل"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="w-phone">رقم الهاتف <span className="text-destructive">*</span></Label>
              <Input
                id="w-phone"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="06xxxxxxxx أو 07xxxxxxxx"
                dir="ltr"
                className="text-right"
              />
              {clientPhone && !/^0[67]\d{8}$/.test(clientPhone) && (
                <p className="text-xs text-destructive">رقم الهاتف يجب أن يبدأ بـ 06 أو 07 ويتكون من 10 أرقام</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="w-email">البريد الإلكتروني (اختياري)</Label>
              <Input
                id="w-email"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="example@email.com"
                dir="ltr"
                className="text-right"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="w-company">الشركة (اختياري)</Label>
              <Input
                id="w-company"
                value={clientCompany}
                onChange={(e) => setClientCompany(e.target.value)}
                placeholder="اسم الشركة"
              />
            </div>
          </div>
        )}

        {/* Step 2 — Project */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="w-pname">اسم المشروع <span className="text-destructive">*</span></Label>
              <Input
                id="w-pname"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="اسم المشروع"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="w-date">تاريخ التصوير <span className="text-destructive">*</span></Label>
              <Input
                id="w-date"
                type="date"
                value={shootingDate}
                onChange={(e) => setShootingDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="w-price">سعر المشروع (درهم) <span className="text-destructive">*</span></Label>
              <Input
                id="w-price"
                type="number"
                min="0"
                step="50"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                dir="ltr"
                className="text-right"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="w-notes">ملاحظات داخلية (اختياري)</Label>
              <textarea
                id="w-notes"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="ملاحظات داخلية للفريق"
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
        )}

        {/* Step 3 — Model Assignment */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="w-model">الموديل <span className="text-destructive">*</span></Label>
              {loadingModels ? (
                <Skeleton className="h-9 w-full" />
              ) : models.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">لا توجد موديلات نشطة. أضف موديلاً أولاً.</p>
              ) : (
                <select
                  id="w-model"
                  value={selectedModelId}
                  onChange={(e) => {
                    setSelectedModelId(e.target.value);
                    if (!e.target.value) setModelStats(null);
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">اختر الموديل</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.modelCode})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Model stats */}
            {selectedModelId && modelStats && (
              <div className="flex flex-wrap gap-2 rounded-lg border bg-muted/50 p-3">
                <Badge variant="outline" className="px-3 py-1">
                  الفيديوهات الحالية: {modelStats.currentVideos}
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  المشاريع الحالية: {modelStats.currentProjects}
                </Badge>
                <Badge variant="default" className="bg-green-600 px-3 py-1">
                  الإجمالي بعد التعيين: {modelStats.currentVideos + parseInt(videosCount || "0")}
                </Badge>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="w-videos">عدد الفيديوهات <span className="text-destructive">*</span></Label>
              <Input
                id="w-videos"
                type="number"
                min="1"
                value={videosCount}
                onChange={(e) => setVideosCount(e.target.value)}
                dir="ltr"
                className="text-right"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="w-script">السكريبت</Label>
              <textarea
                id="w-script"
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="اكتب السكريبت هنا..."
                rows={6}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
        )}

        {/* Step 4 — Review & Save (post-submission) */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">تم إنشاء المشروع بنجاح</span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">العميل</span>
                  <span className="font-medium">{clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الهاتف</span>
                  <span className="font-medium" dir="ltr">{clientPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المشروع</span>
                  <span className="font-medium">{projectName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">تاريخ التصوير</span>
                  <span className="font-medium">{formatDate(shootingDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">عدد الفيديوهات</span>
                  <span className="font-medium">{videosCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">السعر</span>
                  <span className="font-medium">{formatNumber(parseFloat(price))} درهم</span>
                </div>
                {script && (
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground text-xs">السكريبت:</span>
                    <p className="mt-1 text-xs whitespace-pre-wrap">{script}</p>
                  </div>
                )}
              </div>
            </div>

            {whatsappUrl && (
              <Button
                onClick={handleSendWhatsApp}
                className="w-full"
                size="lg"
              >
                <MessageCircle className="h-4 w-4" />
                إرسال عبر واتساب
              </Button>
            )}
          </div>
        )}

        {/* Navigation */}
        {step < 4 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => step === 1 ? handleOpenChange(false) : setStep(step - 1)}
              disabled={submitting}
            >
              <ChevronLeft className="h-4 w-4 rtl-flip" />
              {step === 1 ? "إلغاء" : "السابق"}
            </Button>

            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed}
              >
                التالي
                <ChevronLeft className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed || submitting}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                حفظ المشروع
              </Button>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleFinish}>
              <X className="h-4 w-4" />
              إغلاق
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
