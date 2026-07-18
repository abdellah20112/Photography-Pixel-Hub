"use client";

import { useState, useCallback } from "react";
import { X, Send, Loader2, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCommentAction } from "@/actions/reviews/create-comment";
import type { CommentItem } from "@/types/review";

/* ============================================
   CommentForm — Create comment or reply
   ============================================ */

type CommentFormProps = {
  videoId: string;
  deliveryId: string;
  timestampSeconds: number;
  parentId?: string;
  authorName?: string;
  authorEmail?: string;
  onSubmitted?: (comment: CommentItem) => void;
  onCancel?: () => void;
};

export function CommentForm({
  videoId,
  deliveryId,
  timestampSeconds,
  parentId,
  authorName = "",
  authorEmail = "",
  onSubmitted,
  onCancel,
}: CommentFormProps) {
  const [name, setName] = useState(authorName);
  const [email, setEmail] = useState(authorEmail);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isReply = !!parentId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const result = await createCommentAction({
        videoId,
        deliveryId,
        authorName: name,
        authorEmail: email,
        message,
        timestampSeconds,
        parentId,
      });

      if (result.success) {
        setMessage("");
        onSubmitted?.({
          id: result.commentId ?? "",
          commentCode: "",
          videoId,
          deliveryId,
          parentId: parentId ?? null,
          authorName: name.trim(),
          authorEmail: email.trim().toLowerCase(),
          authorType: "CLIENT",
          message: message.trim(),
          timestampSeconds,
          status: "OPEN",
          resolvedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          canEdit: true,
          replies: [],
        });
      } else {
        setError(result.error ?? "فشل في إرسال التعليق");
      }
    } catch {
      setError("فشل في إرسال التعليق");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {!isReply && !name && (
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="الاسم"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 text-xs"
          />
          <Input
            type="email"
            placeholder="البريد الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      )}
      <div className="flex items-start gap-2">
        <textarea
          placeholder={isReply ? "اكتب رداً..." : "اكتب تعليقاً..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={isReply ? 2 : 3}
          className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
            إلغاء
          </Button>
        )}
        <Button type="submit" size="sm" disabled={submitting || !message.trim()}>
          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          إرسال
        </Button>
      </div>
    </form>
  );
}
