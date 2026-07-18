"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  ChevronRight,
  ChevronLeft,
  Activity as ActivityIcon,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { WorkflowBadge } from "@/components/workflow/workflow-badge";
import { getRelativeTime, EVENT_ICONS, EVENT_LABELS } from "@/components/workflow/project-timeline";
import { formatDateTime } from "@/lib/utils/format";
import { getActivityAction } from "@/actions/workflow/get-activity";
import type { ProjectEventType } from "@prisma/client";

/* ============================================
   ActivityTable — Global activity feed
   ============================================ */

const PAGE_SIZE_OPTIONS = [25, 50, 100];

export function ActivityTable() {
  const [data, setData] = useState<{
    items: Array<{
      id: string;
      projectId: string;
      eventType: ProjectEventType;
      title: string;
      description: string | null;
      actorName: string;
      createdAt: Date | string;
      project: { id: string; name: string; projectCode: string } | null;
    }>;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchInput, setSearchInput] = useState("");
  const hasFetched = useRef(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await getActivityAction({
        page,
        pageSize,
        search: search || undefined,
      });
      if (!active) return;
      setData(result);
    })();
    return () => { active = false };
  }, [page, pageSize, search]);

  // Debounce search
  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      return;
    }
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const isLoading = !data;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="بحث في النشاط..."
          className="ps-9"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="بحث في النشاط"
        />
      </div>

      {/* Events List */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b p-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border bg-card">
          <EmptyState
            icon={ActivityIcon}
            title={search ? "لا توجد نتائج" : "لا يوجد نشاط بعد"}
            description={search ? "جرّب تغيير كلمات البحث" : "ستظهر هنا جميع أنشطة المشاريع"}
            className="py-20"
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
              <tr className="border-b">
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">الحدث</th>
                <th className="hidden px-4 py-3 text-start font-medium text-muted-foreground md:table-cell">المشروع</th>
                <th className="hidden px-4 py-3 text-start font-medium text-muted-foreground lg:table-cell">الوصف</th>
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">بواسطة</th>
                <th className="hidden px-4 py-3 text-start font-medium text-muted-foreground sm:table-cell">الوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((event) => (
                <tr key={event.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{EVENT_ICONS[event.eventType] ?? "📋"}</span>
                      <span className="font-medium">{event.title}</span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {event.project ? (
                      <span>{event.project.name}</span>
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {event.description ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{event.actorName}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    <span title={formatDateTime(event.createdAt)}>
                      {getRelativeTime(event.createdAt)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>عرض</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="h-7 rounded-md border border-input bg-transparent px-1 text-xs"
              aria-label="عدد العناصر"
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span>من {total} حدث</span>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} aria-label="السابق">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="px-2 text-xs text-muted-foreground">{page} / {totalPages}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} aria-label="التالي">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
