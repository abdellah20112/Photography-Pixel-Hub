"use client";

import { useState, useCallback, useEffect } from "react";
import {
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  File as FileIcon,
  Download,
  Trash2,
  Loader2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { formatBytes, formatDate } from "@/lib/utils/format";
import { getProjectFilesAction } from "@/actions/project-files/get-files";
import { deleteProjectFileAction } from "@/actions/project-files/delete-file";
import { getFileDownloadUrlAction } from "@/actions/project-files/replace-file";
import type { ProjectFileType } from "@prisma/client";

/* ============================================
   FileGrid — Displays project files
   Shows file type icon, name, size, date.
   Supports download and delete.
   ============================================ */

type FileRow = {
  id: string;
  fileType: ProjectFileType;
  storageKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: Date;
  projectId: string;
};

const FILE_TYPE_CONFIG: Record<ProjectFileType, { icon: typeof Film; label: string; color: string }> = {
  PREVIEW_VIDEO: { icon: Film, label: "معاينة", color: "bg-blue-500/10 text-blue-500" },
  FINAL_VIDEO: { icon: Film, label: "نهائي", color: "bg-green-500/10 text-green-500" },
  THUMBNAIL: { icon: ImageIcon, label: "صورة مصغرة", color: "bg-purple-500/10 text-purple-500" },
  ASSET: { icon: FileIcon, label: "أصل", color: "bg-amber-500/10 text-amber-500" },
  MUSIC: { icon: Music, label: "موسيقى", color: "bg-pink-500/10 text-pink-500" },
  LOGO: { icon: ImageIcon, label: "شعار", color: "bg-indigo-500/10 text-indigo-500" },
  DOCUMENT: { icon: FileText, label: "مستند", color: "bg-gray-500/10 text-gray-500" },
  INVOICE: { icon: FileText, label: "فاتورة", color: "bg-red-500/10 text-red-500" },
  CONTRACT: { icon: FileText, label: "عقد", color: "bg-teal-500/10 text-teal-500" },
};

type FileGridProps = {
  projectId: string;
  onRefresh?: () => void;
};

export function FileGrid({ projectId, onRefresh }: FileGridProps) {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<FileRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    const result = await getProjectFilesAction(projectId);
    setFiles(result as FileRow[]);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    let active = true;
    getProjectFilesAction(projectId).then((result) => {
      if (!active) return;
      setFiles(result as FileRow[]);
      setLoading(false);
    });
    return () => { active = false };
  }, [projectId]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteProjectFileAction(deleteTarget.id);
    if (result.success) {
      toast.success("تم حذف الملف");
      fetchFiles();
      onRefresh?.();
    } else {
      toast.error(result.error ?? "فشل في الحذف");
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const handleDownload = async (file: FileRow) => {
    setDownloadingId(file.id);
    const result = await getFileDownloadUrlAction(file.id);
    if (result.success && result.url) {
      window.open(result.url, "_blank");
    } else {
      toast.error(result.error ?? "فشل في توليد رابط التحميل");
    }
    setDownloadingId(null);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <EmptyState
        icon={FileIcon}
        title="لا توجد ملفات"
        description="ارفع ملفات المشروع هنا"
        className="py-8"
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {files.map((file) => {
          const config = FILE_TYPE_CONFIG[file.fileType] ?? FILE_TYPE_CONFIG.ASSET;
          const Icon = config.icon;

          return (
            <div
              key={file.id}
              className="group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${config.color}`}>
                <Icon className="h-5 w-5" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.fileName}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                    {config.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatBytes(file.fileSize)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    · {formatDate(file.createdAt)}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleDownload(file)}
                  disabled={downloadingId === file.id}
                  aria-label="تحميل"
                >
                  {downloadingId === file.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(file)}
                  aria-label="حذف"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف الملف"
        description={`هل أنت متأكد من حذف "${deleteTarget?.fileName}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
      />
    </>
  );
}
