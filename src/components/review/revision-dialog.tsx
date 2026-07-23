"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { requestChangesAction } from "@/actions/public/request-changes";
import { transitionWorkflowAction } from "@/actions/workflow/transition";
import type { ProjectWorkflowStatus } from "@prisma/client";

/* ============================================
   RevisionDialog — Request revision flow
   ============================================ */

type RevisionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectToken?: string;
  onSuccess?: () => void;
};

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "منخفضة" },
  { value: "MEDIUM", label: "متوسطة" },
  { value: "HIGH", label: "عالية" },
  { value: "URGENT", label: "عاجلة" },
] as const;

export function RevisionDialog({
  open,
  onOpenChange,
  projectId,
  projectToken,
  onSuccess,
}: RevisionDialogProps) {
  const [reason, setReason] = useState(() => {
    try {
      return localStorage.getItem(`revision-draft:${projectId}`) ?? "";
    } catch {
      return "";
    }
  });
  const [priority, setPriority] = useState("MEDIUM");
  const [submitting, setSubmitting] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  // Auto-save draft (debounced)
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      try {
        if (reason.trim()) {
          localStorage.setItem(`revision-draft:${projectId}`, reason);
          setDraftSaved(true);
        }
      } catch {
        // Ignore
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [reason, projectId, open]);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("يرجى كتابة سبب التعديل");
      return;
    }

    setSubmitting(true);
    try {
      if (projectToken) {
        const result = await requestChangesAction(projectToken, `${reason} [أولوية: ${priority}]`);
        if (!result.success) {
          toast.error(result.error ?? "فشل في إرسال طلب التعديل");
          return;
        }
      } else {
        const result = await transitionWorkflowAction({
          projectId,
          toStatus: "REVISION" as ProjectWorkflowStatus,
        });
        if (!result.success) {
          toast.error(result.error ?? "فشل في تغيير حالة المشروع");
          return;
        }
      }

      toast.success("تم إرسال طلب التعديل");
      try { localStorage.removeItem(`revision-draft:${projectId}`); } catch { /* ignore */ }
      setReason("");
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            طلب تعديلات
          </DialogTitle>
          <DialogDescription>
            سيتم تحويل حالة المشروع إلى &quot;يلزم تعديلات&quot; وإنشاء سجل في Timeline
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="priority">الأولوية</Label>
            <select
              id="priority"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={submitting}
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason">
              سبب التعديل <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              placeholder="اكتب تفاصيل التعديل المطلوب..."
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              disabled={submitting}
            />
            {draftSaved && (
              <p className="text-[10px] text-muted-foreground">✓ تم الحفظ التلقائي</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !reason.trim()}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            إرسال طلب التعديل
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
