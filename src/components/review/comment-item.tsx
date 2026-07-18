"use client";

import { useState } from "react";
import {
  Reply,
  CheckCircle2,
  RotateCcw,
  Archive,
  Clock,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/video/metadata";
import { formatDate } from "@/lib/utils/format";
import { CommentForm } from "@/components/review/comment-form";
import { resolveCommentAction } from "@/actions/reviews/resolve-comment";
import { reopenCommentAction } from "@/actions/reviews/reopen-comment";
import { archiveCommentAction } from "@/actions/reviews/archive-comment";
import type { CommentItem } from "@/types/review";

/* ============================================
   CommentItem — Single comment with replies
   ============================================ */

type CommentItemProps = {
  comment: CommentItem;
  deliveryId: string;
  onSeek?: (seconds: number) => void;
  onReply?: () => void;
  isTeam?: boolean;
};

function StatusBadge({ status }: { status: string }) {
  if (status === "RESOLVED") return <Badge className="bg-green-600 hover:bg-green-600">محلول</Badge>;
  if (status === "ARCHIVED") return <Badge variant="secondary">مؤرشف</Badge>;
  return <Badge variant="outline">مفتوح</Badge>;
}

export function CommentItem({
  comment,
  deliveryId,
  onSeek,
  isTeam = false,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleAction = async (action: "resolve" | "reopen" | "archive") => {
    setActionLoading(true);
    try {
      if (action === "resolve") await resolveCommentAction(comment.id);
      if (action === "reopen") await reopenCommentAction(comment.id);
      if (action === "archive") await archiveCommentAction(comment.id);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-2 rounded-lg border p-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
            <User className="h-3 w-3 text-muted-foreground" />
          </span>
          <span className="text-xs font-medium">{comment.authorName}</span>
          <StatusBadge status={comment.status} />
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDate(comment.createdAt)}
        </span>
      </div>

      {/* Timestamp */}
      {onSeek && (
        <button
          onClick={() => onSeek(comment.timestampSeconds)}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Clock className="h-3 w-3" />
          {formatDuration(comment.timestampSeconds)}
        </button>
      )}

      {/* Message */}
      <p className="text-sm leading-relaxed">{comment.message}</p>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setShowReplyForm((s) => !s)}
        >
          <Reply className="h-3 w-3" />
          رد
        </Button>

        {isTeam && comment.status === "OPEN" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-green-600 hover:text-green-600"
            onClick={() => handleAction("resolve")}
            disabled={actionLoading}
          >
            <CheckCircle2 className="h-3 w-3" />
            حل
          </Button>
        )}

        {isTeam && comment.status === "RESOLVED" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleAction("reopen")}
            disabled={actionLoading}
          >
            <RotateCcw className="h-3 w-3" />
            إعادة فتح
          </Button>
        )}

        {isTeam && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => handleAction("archive")}
            disabled={actionLoading}
          >
            <Archive className="h-3 w-3" />
            أرشفة
          </Button>
        )}
      </div>

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="space-y-2 border-s-2 border-muted ps-3">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="rounded-md bg-muted/30 p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{reply.authorName}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(reply.createdAt)}
                </span>
              </div>
              <p className="mt-1 text-sm">{reply.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reply Form */}
      {showReplyForm && (
        <div className="border-t pt-2">
          <CommentForm
            videoId={comment.videoId}
            deliveryId={deliveryId}
            timestampSeconds={comment.timestampSeconds}
            parentId={comment.id}
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      )}
    </div>
  );
}
