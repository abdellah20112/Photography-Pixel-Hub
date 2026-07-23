"use client";

import { useState, useCallback, useRef } from "react";
import { UploadCloud, Loader2, X, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileGrid } from "@/components/uploads/file-grid";
import { usePresignedUpload, type UploadItem } from "@/hooks/use-presigned-upload";
import { validateFile } from "@/lib/storage/validation";
import type { ProjectFileType } from "@prisma/client";
import { formatBytes } from "@/lib/utils/format";

/* ============================================
   ProjectFiles — Combined upload + file list
   Drag & drop upload directly to R2 via presigned URLs.
   Shows uploaded files with download/delete actions.
   ============================================ */

type ProjectFilesProps = {
  projectId: string;
};

const FILE_TYPE_OPTIONS: { value: ProjectFileType; label: string }[] = [
  { value: "PREVIEW_VIDEO", label: "فيديو معاينة" },
  { value: "FINAL_VIDEO", label: "فيديو نهائي" },
  { value: "THUMBNAIL", label: "صورة مصغرة" },
  { value: "ASSET", label: "أصل" },
  { value: "MUSIC", label: "موسيقى" },
  { value: "LOGO", label: "شعار" },
  { value: "DOCUMENT", label: "مستند" },
  { value: "INVOICE", label: "فاتورة" },
  { value: "CONTRACT", label: "عقد" },
];

function StatusIcon({ status }: { status: UploadItem["status"] }) {
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

const STATUS_LABELS: Record<UploadItem["status"], string> = {
  waiting: "في الانتظار",
  uploading: "جاري الرفع",
  processing: "قيد المعالجة",
  completed: "اكتمل",
  failed: "فشل",
};

export function ProjectFiles({ projectId }: ProjectFilesProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileType, setFileType] = useState<ProjectFileType>("ASSET");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    items,
    isUploading,
    addFiles,
    removeItem,
    retryItem,
    cancelUpload,
    startUpload,
    clearCompleted,
    clearAll,
  } = usePresignedUpload(projectId);

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      const valid: File[] = [];
      const errors: Record<string, string> = {};

      for (const file of files) {
        const validation = validateFile(file, ["VIDEO", "IMAGE", "AUDIO", "DOCUMENT", "SPREADSHEET"]);
        if (!validation.valid) {
          errors[file.name] = validation.error ?? "ملف غير صالح";
        } else {
          valid.push(file);
        }
      }

      setValidationErrors(errors);
      if (valid.length > 0) {
        addFiles(valid, fileType);
      }
    },
    [addFiles, fileType],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
        e.target.value = "";
      }
    },
    [handleFiles],
  );

  const handleStartUpload = async () => {
    await startUpload(fileType);
    setRefreshKey((k) => k + 1);
  };

  const hasItems = items.length > 0;
  const hasPending = items.some((f) => f.status === "waiting" || f.status === "failed");

  return (
    <div className="space-y-4">
      {/* File type selector */}
      <div className="space-y-1.5">
        <Label htmlFor="fileType">نوع الملف</Label>
        <select
          id="fileType"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={fileType}
          onChange={(e) => setFileType(e.target.value as ProjectFileType)}
          disabled={isUploading}
        >
          {FILE_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="منطقة رفع الملفات"
        onKeyDown={(e) => {
          if (e.key === "Enter") fileInputRef.current?.click();
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <UploadCloud className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">اسحب وأفلت الملفات هنا أو اضغط للاختيار</p>
          <p className="mt-1 text-xs text-muted-foreground">
            فيديو، صور، مستندات، صوت — بحد أقصى 500 ميجابايت
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/*,image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Validation Errors */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="space-y-1 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          {Object.entries(validationErrors).map(([name, error]) => (
            <p key={name} className="text-xs text-destructive">
              <span className="font-medium">{name}:</span> {error}
            </p>
          ))}
        </div>
      )}

      {/* Upload Queue */}
      {hasItems && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">قائمة الرفع ({items.length})</h3>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={clearCompleted} disabled={isUploading}>
                مسح المكتمل
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAll} disabled={isUploading}>
                <X className="h-3.5 w-3.5" />
                مسح الكل
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
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
                      onClick={() => cancelUpload(item.id)}
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
                      onClick={() => retryItem(item.id, fileType)}
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
                      onClick={() => removeItem(item.id)}
                      aria-label="إزالة"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {hasPending && (
            <Button onClick={handleStartUpload} disabled={isUploading} className="w-full">
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الرفع...
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  بدء الرفع
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Uploaded Files */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">الملفات</h3>
        <FileGrid key={refreshKey} projectId={projectId} />
      </div>
    </div>
  );
}
