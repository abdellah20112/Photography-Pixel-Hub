"use client";

import { useState, useCallback, useRef } from "react";
import { UploadCloud, FolderOpen, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UploadProgressItem } from "@/components/uploads/upload-progress";
import { useUploadQueue } from "@/hooks/use-upload";
import { validateVideoFile } from "@/lib/video/metadata";
import { getProjectsAction } from "@/actions/projects/get-projects";
import { useEffect } from "react";

/* ============================================
   UploadZone — Drag & drop + click upload
   Requires project selection.
   ============================================ */

type ProjectOption = {
  id: string;
  name: string;
  projectCode: string;
};

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasFetched = useRef(false);

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
  } = useUploadQueue(projectId);

  // Fetch projects for dropdown
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    let active = true;
    (async () => {
      const result = await getProjectsAction({ page: 1, pageSize: 100 });
      if (!active) return;
      setProjects(
        result.items.map((p) => ({
          id: p.id,
          name: p.name,
          projectCode: p.projectCode,
        }))
      );
      setLoadingProjects(false);
    })();
    return () => { active = false };
  }, []);

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      const valid: File[] = [];
      const errors: Record<string, string> = {};

      for (const file of files) {
        const validation = validateVideoFile(file);
        if (!validation.valid) {
          errors[file.name] = validation.error ?? "ملف غير صالح";
        } else {
          valid.push(file);
        }
      }

      setValidationErrors(errors);
      if (valid.length > 0) {
        addFiles(valid);
      }
    },
    [addFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!projectId) return;
      handleFiles(e.dataTransfer.files);
    },
    [projectId, handleFiles]
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
    [handleFiles]
  );

  const hasItems = items.length > 0;
  const hasPending = items.some(
    (f) => f.status === "waiting" || f.status === "failed"
  );

  return (
    <div className="space-y-4">
      {/* Project Selector */}
      <div className="space-y-1.5">
        <Label htmlFor="projectId">
          المشروع <span className="text-destructive">*</span>
        </Label>
        <select
          id="projectId"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          value={projectId ?? ""}
          onChange={(e) => setProjectId(e.target.value || null)}
          disabled={loadingProjects}
        >
          <option value="">
            {loadingProjects ? "جاري التحميل..." : "اختر المشروع"}
          </option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.projectCode})
            </option>
          ))}
        </select>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => projectId && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="منطقة رفع الملفات"
        onKeyDown={(e) => {
          if (e.key === "Enter" && projectId) fileInputRef.current?.click();
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        } ${!projectId ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <UploadCloud className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">
            {projectId ? "اسحب وأفلت الملفات هنا أو اضغط للاختيار" : "اختر مشروعاً أولاً"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            MP4, MOV, WEBM — بحد أقصى 500 ميجابايت
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
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
            <h3 className="text-sm font-medium">
              قائمة الرفع ({items.length})
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCompleted}
                disabled={isUploading}
              >
                مسح المكتمل
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                disabled={isUploading}
              >
                <Trash2 className="h-3.5 w-3.5" />
                مسح الكل
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {items.map((item) => (
              <UploadProgressItem
                key={item.id}
                item={item}
                onRemove={removeItem}
                onRetry={retryItem}
                onCancel={cancelUpload}
              />
            ))}
          </div>

          {hasPending && (
            <Button
              onClick={startUpload}
              disabled={isUploading || !projectId}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الرفع...
                </>
              ) : (
                <>
                  <FolderOpen className="h-4 w-4" />
                  بدء الرفع
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
