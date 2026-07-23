"use client";

import { useState, useCallback, useEffect, useTransition } from "react";
import {
  Search,
  ArrowUpDown,
  Video,
  Trash2,
  RotateCcw,
  Eye,
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { VideoStatusBadge } from "@/components/uploads/video-status-badge";
import { VideoPlayer } from "@/components/player/video-player";
import { formatDate } from "@/lib/utils/format";
import { formatBytes } from "@/lib/utils/format";
import { formatDuration, formatResolution } from "@/lib/video/metadata";
import { getUploadsAction } from "@/actions/uploads/get-uploads";
import { deleteUploadAction } from "@/actions/uploads/delete-upload";
import { restoreUploadAction } from "@/actions/uploads/restore-upload";
import { getVideoDetailsAction } from "@/actions/uploads/get-video-details";
import type { VideoTableRow } from "@/types/video";
import type { VideoFilterValue, VideoSortValue } from "@/lib/validations/video";

/* ============================================
   VideoGrid — Video library grid
   Search, filter, sort, pagination
   ============================================ */

const FILTER_OPTIONS: { value: VideoFilterValue; label: string }[] = [
  { value: "ready", label: "جاهز" },
  { value: "processing", label: "قيد المعالجة" },
  { value: "uploading", label: "جاري الرفع" },
  { value: "failed", label: "فشل" },
  { value: "deleted", label: "محذوف" },
];

const SORT_OPTIONS: { value: VideoSortValue; label: string }[] = [
  { value: "newest", label: "الأحدث" },
  { value: "oldest", label: "الأقدم" },
  { value: "duration", label: "المدة" },
  { value: "size", label: "الحجم" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

type VideoGridProps = {
  projectId?: string;
  showProjectColumn?: boolean;
};

export function VideoGrid({ projectId, showProjectColumn = false }: VideoGridProps) {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<{
    items: VideoTableRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<VideoFilterValue>("ready");
  const [sort, setSort] = useState<VideoSortValue>("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const [deleteTarget, setDeleteTarget] = useState<VideoTableRow | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<VideoTableRow | null>(null);
  const [playerTarget, setPlayerTarget] = useState<{ url: string; title: string } | null>(null);

  const [searchInput, setSearchInput] = useState("");

  const fetchData = useCallback(async () => {
    startTransition(async () => {
      const result = await getUploadsAction({
        page,
        pageSize,
        projectId,
        search: search || undefined,
        filter,
        sort,
      });
      setData(result);
    });
  }, [page, pageSize, projectId, search, filter, sort]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteUploadAction(deleteTarget.id);
    if (result.success) {
      toast.success("تم حذف الفيديو");
      fetchData();
    } else {
      toast.error(result.error ?? "فشل في حذف الفيديو");
    }
    setDeleteTarget(null);
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    const result = await restoreUploadAction(restoreTarget.id);
    if (result.success) {
      toast.success("تم استعادة الفيديو");
      fetchData();
    } else {
      toast.error(result.error ?? "فشل في استعادة الفيديو");
    }
    setRestoreTarget(null);
  };

  const handlePlay = async (video: VideoTableRow) => {
    const details = await getVideoDetailsAction(video.id);
    if (details?.signedUrls) {
      setPlayerTarget({
        url: details.signedUrls.streamUrl,
        title: video.title,
      });
    } else {
      toast.error("لا يمكن تشغيل الفيديو");
    }
  };

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const isLoading = isPending && !data;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="بحث بالكود أو العنوان..."
            className="ps-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="بحث عن الفيديوهات"
          />
        </div>
      </div>

      {/* Filters + Sort */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-muted/50 p-1" role="tablist" aria-label="تصفية الحالة">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              role="tab"
              aria-selected={filter === opt.value}
              onClick={() => {
                setFilter(opt.value);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                filter === opt.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as VideoSortValue);
              setPage(1);
            }}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="ترتيب حسب"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border bg-card">
          <EmptyState
            icon={Video}
            title={search ? "لا توجد نتائج" : "لا توجد فيديوهات بعد"}
            description={search ? "جرّب تغيير كلمات البحث أو الفلاتر" : "ارفع فيديوهاتك الأولى"}
            className="py-20"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((video) => (
            <div
              key={video.id}
              className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
            >
              {/* Thumbnail */}
              <div
                className="relative aspect-video cursor-pointer bg-muted"
                onClick={() => video.status === "READY" && handlePlay(video)}
                role={video.status === "READY" ? "button" : undefined}
                aria-label={`تشغيل ${video.title}`}
              >
                {video.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Video className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                )}
                {video.duration && (
                  <span className="absolute bottom-2 end-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
                    {formatDuration(video.duration)}
                  </span>
                )}
                <div className="absolute end-2 top-2">
                  <VideoStatusBadge status={video.status} />
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{video.title}</p>
                    <p className="font-mono text-xs text-muted-foreground">{video.videoCode}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {video.status === "DELETED" ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setRestoreTarget(video)}
                        aria-label="استعادة"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setDeleteTarget(video)}
                        aria-label="حذف"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatBytes(video.fileSize)}</span>
                  <span>·</span>
                  <span>{formatResolution(video.width, video.height)}</span>
                  <span>·</span>
                  <span>{formatDate(video.createdAt)}</span>
                </div>

                {showProjectColumn && video.project && (
                  <p className="truncate text-xs text-muted-foreground">
                    {video.project.name} ({video.project.projectCode})
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>عرض</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-7 rounded-md border border-input bg-transparent px-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="عدد العناصر في الصفحة"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>من {total} فيديو</span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="الصفحة السابقة"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="px-2 text-xs text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                aria-label="الصفحة التالية"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Video Player Modal */}
      {playerTarget && (
        <VideoPlayer
          src={playerTarget.url}
          title={playerTarget.title}
          onClose={() => setPlayerTarget(null)}
        />
      )}

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف الفيديو"
        description={`هل أنت متأكد من حذف "${deleteTarget?.title}"؟ سيتم إخفاء الفيديو. يمكنك استعادته لاحقاً.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={!!restoreTarget}
        onOpenChange={(open) => !open && setRestoreTarget(null)}
        title="استعادة الفيديو"
        description={`هل تريد استعادة "${restoreTarget?.title}"؟`}
        confirmLabel="استعادة"
        variant="default"
        onConfirm={handleRestore}
      />
    </div>
  );
}
