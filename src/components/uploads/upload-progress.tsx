"use client";

import { Loader2, X, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils/format";
import { formatDuration } from "@/lib/video/metadata";
import type { UploadQueueItem } from "@/types/video";

/* ============================================
   UploadProgressItem — Single queue item
   Shows status, progress, and actions.
   ============================================ */

type UploadProgressItemProps = {
  item: UploadQueueItem;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onCancel: (id: string) => void;
};

function StatusIcon({ status }: { status: UploadQueueItem["status"] }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "failed":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case "uploading":
    case "processing":
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    default:
      return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />;
  }
}

const STATUS_LABELS: Record<UploadQueueItem["status"], string> = {
  waiting: "في الانتظار",
  uploading: "جاري الرفع",
  processing: "قيد المعالجة",
  completed: "اكتمل",
  failed: "فشل",
};

export function UploadProgressItem({
  item,
  onRemove,
  onRetry,
  onCancel,
}: UploadProgressItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <StatusIcon status={item.status} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium">{item.file.name}</p>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatBytes(item.file.size)}
          </span>
        </div>

        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${item.progress}%` }}
            />
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {STATUS_LABELS[item.status]}
            {item.status === "uploading" && ` ${item.progress}%`}
          </span>
        </div>

        {item.error && (
          <p className="mt-1 text-xs text-destructive">{item.error}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {(item.status === "uploading" || item.status === "processing") && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onCancel(item.id)}
            aria-label="إلغاء"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
        {item.status === "failed" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onRetry(item.id)}
            aria-label="إعادة"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}
        {item.status !== "uploading" && item.status !== "processing" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onRemove(item.id)}
            aria-label="إزالة"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
