"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  X,
  Search,
  Send,
  Loader2,
  Clock,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { CommentItem } from "@/components/review/comment-item";
import { CommentForm } from "@/components/review/comment-form";
import {
  EmptyStateIllustration,
} from "@/components/review/review-animations";
import { getCommentsAction } from "@/actions/reviews/get-comments";
import { createCommentAction } from "@/actions/reviews/create-comment";
import { formatDuration } from "@/lib/video/metadata";
import { cn } from "@/lib/utils/cn";
import type { CommentItem as CommentItemType } from "@/types/review";

/* ============================================
   PortalCommentsSheet — Comments UI
   Bottom sheet on mobile, slide panel on desktop.
   Client can read, reply, create, jump to timestamp.
   Cannot delete comments.
   ============================================ */

type PortalCommentsSheetProps = {
  open: boolean;
  onClose: () => void;
  videoId: string;
  deliveryId: string | null;
  currentTime: number;
  onSeek: (seconds: number) => void;
};

export function PortalCommentsSheet({
  open,
  onClose,
  videoId,
  deliveryId,
  currentTime,
  onSeek,
}: PortalCommentsSheetProps) {
  const [comments, setComments] = useState<CommentItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!open || !videoId) return;
    let active = true;
    getCommentsAction({ videoId }).then((result) => {
      if (!active) return;
      setComments(result.items);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [open, videoId, refreshKey]);

  const handleAddComment = async (
    authorName: string,
    authorEmail: string,
    message: string,
  ) => {
    if (!deliveryId) {
      toast.error("التعليقات غير متاحة لهذا المشروع");
      return;
    }

    const result = await createCommentAction({
      videoId,
      deliveryId,
      authorName,
      authorEmail,
      message,
      timestampSeconds: Math.floor(currentTime),
    });

    if (result.success) {
      toast.success("تم إضافة التعليق");
      setShowForm(false);
      setLoading(true);
      setRefreshKey((k) => k + 1);
    } else {
      toast.error(result.error ?? "فشل في إضافة التعليق");
    }
  };

  const filteredComments = comments.filter((c) => {
    if (filter === "open" && c.status !== "OPEN") return false;
    if (filter === "resolved" && c.status !== "RESOLVED") return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.message.toLowerCase().includes(q) ||
        c.authorName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (!open) return null;

  const commentsEnabled = !!deliveryId;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel: bottom sheet on mobile, slide panel on desktop */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 flex h-[75dvh] flex-col rounded-t-2xl border-t border-white/8 bg-[#0c0c0e] shadow-2xl",
          "sm:bottom-auto sm:end-0 sm:top-0 sm:h-full sm:w-[400px] sm:rounded-none sm:border-l sm:border-t-0",
          "animate-in slide-in-from-bottom sm:slide-in-from-right",
        )}
        role="dialog"
        aria-label="التعليقات"
      >
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-2 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <MessageSquare className="h-4 w-4" />
            التعليقات ({comments.length})
          </h3>
          <button
            onClick={onClose}
            className="text-white/40 transition-colors hover:text-white focus:outline-none"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search + Filter */}
        <div className="space-y-2 border-b border-white/8 p-3">
          <div className="relative">
            <Search className="absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
            <input
              type="search"
              placeholder="بحث في التعليقات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-md border border-white/10 bg-transparent ps-8 pe-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="بحث في التعليقات"
            />
          </div>
          <div className="flex items-center gap-1" role="tablist">
            {[
              { value: "all", label: "الكل" },
              { value: "open", label: "مفتوح" },
              { value: "resolved", label: "محلول" },
            ].map((opt) => (
              <button
                key={opt.value}
                role="tab"
                aria-selected={filter === opt.value}
                onClick={() => setFilter(opt.value)}
                className={cn(
                  "rounded-md px-2 py-1 text-xs transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary",
                  filter === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "text-white/40 hover:bg-white/5 hover:text-white/70",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto p-3">
          {!commentsEnabled ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <Lock className="h-8 w-8 text-white/20" />
              <div>
                <p className="text-sm font-medium text-white/60">
                  التعليقات غير متاحة
                </p>
                <p className="mt-0.5 text-xs text-white/30">
                  لم يتم تفعيل التعليقات لهذا المشروع
                </p>
              </div>
            </div>
          ) : loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg bg-white/5" />
              ))}
            </div>
          ) : filteredComments.length === 0 ? (
            <EmptyStateIllustration
              type="no-comments"
              title="لا توجد تعليقات"
              subtitle="اضغط على إضافة تعليق للبدء"
            />
          ) : (
            <div className="space-y-2">
              {filteredComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  deliveryId={deliveryId ?? ""}
                  onSeek={onSeek}
                  isTeam={false}
                />
              ))}
            </div>
          )}
        </div>

        {/* Add comment form / button */}
        {commentsEnabled && (
          <div className="border-t border-white/8 p-3">
            {showForm ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-white/50">
                  <Clock className="h-3 w-3 text-primary" />
                  تعليق عند {formatDuration(Math.floor(currentTime))}
                </div>
                <InlineCommentForm
                  onSubmit={handleAddComment}
                  onCancel={() => setShowForm(false)}
                />
              </div>
            ) : (
              <Button
                className="w-full"
                size="sm"
                onClick={() => setShowForm(true)}
              >
                <MessageSquare className="h-4 w-4" />
                إضافة تعليق عند {formatDuration(Math.floor(currentTime))}
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* ── Inline comment form ─────────────────── */

function InlineCommentForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (name: string, email: string, message: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(
        name.trim() || "مراجع",
        email.trim() || "reviewer@pixelhub.local",
        message,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="الاسم"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8 border-white/10 bg-transparent text-xs text-white placeholder:text-white/30"
        />
        <Input
          type="email"
          placeholder="البريد"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-8 border-white/10 bg-transparent text-xs text-white placeholder:text-white/30"
        />
      </div>
      <textarea
        placeholder="اكتب تعليقك..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-white/30">✓ حفظ تلقائي</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-2 py-1 text-xs text-white/50 transition-colors hover:text-white focus:outline-none"
          >
            إغلاق
          </button>
          <button
            type="submit"
            disabled={submitting || !message.trim()}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            إرسال
          </button>
        </div>
      </div>
    </form>
  );
}
