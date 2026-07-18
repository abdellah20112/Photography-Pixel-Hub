"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MessageSquare, ArrowUpDown, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { CommentItem } from "@/components/review/comment-item";
import { CommentForm } from "@/components/review/comment-form";
import { getCommentsAction } from "@/actions/reviews/get-comments";
import type { CommentItem as CommentItemType } from "@/types/review";
import type { CommentFilterValue, CommentSortValue } from "@/lib/validations/review";

/* ============================================
   CommentsPanel — Right side panel (desktop)
   / Bottom sheet (mobile)
   ============================================ */

type CommentsPanelProps = {
  videoId: string;
  deliveryId: string;
  onClose?: () => void;
  onSeek?: (seconds: number) => void;
  isTeam?: boolean;
};

const FILTER_OPTIONS: { value: CommentFilterValue; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "open", label: "مفتوح" },
  { value: "resolved", label: "محلول" },
  { value: "archived", label: "مؤرشف" },
];

const SORT_OPTIONS: { value: CommentSortValue; label: string }[] = [
  { value: "newest", label: "الأحدث" },
  { value: "oldest", label: "الأقدم" },
  { value: "timestamp", label: "الطابع الزمني" },
];

export function CommentsPanel({
  videoId,
  deliveryId,
  onClose,
  onSeek,
  isTeam = false,
}: CommentsPanelProps) {
  const [comments, setComments] = useState<CommentItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CommentFilterValue>("all");
  const [sort, setSort] = useState<CommentSortValue>("timestamp");
  const [showForm, setShowForm] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
    }
    let active = true;
    (async () => {
      const result = await getCommentsAction({
        videoId,
        deliveryId,
        search: search || undefined,
        filter,
        sort,
      });
      if (!active) return;
      setComments(result.items);
      setLoading(false);
    })();
    return () => { active = false };
  }, [videoId, deliveryId, search, filter, sort]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquare className="h-4 w-4" />
          التعليقات ({comments.length})
        </h3>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} aria-label="إغلاق">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search + Filter */}
      <div className="space-y-2 border-b p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="بحث في التعليقات..."
            className="h-8 ps-8 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`rounded-md px-2 py-1 text-xs transition-colors ${
                filter === opt.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
          </div>
        ) : comments.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="لا توجد تعليقات"
            description="اضغط على الفيديو لإضافة تعليق"
            className="py-12"
          />
        ) : (
          <div className="space-y-2">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                deliveryId={deliveryId}
                onSeek={onSeek}
                isTeam={isTeam}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
