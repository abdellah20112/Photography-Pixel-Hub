"use client";

import { useEffect, useState } from "react";
import {
  Upload,
  MessageSquare,
  CheckCircle2,
  Package,
  Download,
  ArrowRightLeft,
  FileEdit,
  Film,
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils/format";
import { getPublicTimelineAction, type PortalTimelineEvent } from "@/actions/public/get-public-timeline";
import { cn } from "@/lib/utils/cn";

/* ============================================
   PortalTimeline — Vertical timeline
   Shows project events (uploads, approvals,
   revisions, deliveries, downloads).
   Mobile-first, adapts to desktop.
   ============================================ */

const EVENT_ICONS: Record<string, typeof Upload> = {
  VIDEOS_UPLOADED: Upload,
  UPLOAD_FAILED: Upload,
  COMMENT_ADDED: MessageSquare,
  COMMENT_RESOLVED: CheckCircle2,
  VIDEO_APPROVED: CheckCircle2,
  DELIVERY_CREATED: Package,
  DELIVERY_PUBLISHED: Package,
  DELIVERY_VIEWED: Film,
  DOWNLOAD_STARTED: Download,
  DOWNLOAD_COMPLETED: Download,
  WORKFLOW_TRANSITION: ArrowRightLeft,
  PROJECT_COMPLETED: CheckCircle2,
  PROJECT_STATUS_CHANGED: ArrowRightLeft,
};

const EVENT_COLORS: Record<string, string> = {
  VIDEOS_UPLOADED: "text-blue-400 bg-blue-500/10",
  COMMENT_ADDED: "text-amber-400 bg-amber-500/10",
  VIDEO_APPROVED: "text-green-400 bg-green-500/10",
  DELIVERY_PUBLISHED: "text-teal-400 bg-teal-500/10",
  DOWNLOAD_COMPLETED: "text-purple-400 bg-purple-500/10",
  WORKFLOW_TRANSITION: "text-white/40 bg-white/5",
  PROJECT_COMPLETED: "text-green-500 bg-green-600/10",
};

type PortalTimelineProps = {
  token: string;
  compact?: boolean;
};

export function PortalTimeline({ token, compact = false }: PortalTimelineProps) {
  const [events, setEvents] = useState<PortalTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getPublicTimelineAction(token).then((result) => {
      if (!active) return;
      setEvents(result);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(compact ? 3 : 5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full bg-white/5" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-32 bg-white/5" />
              <Skeleton className="h-2 w-20 bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-white/30">
        لا توجد أحداث بعد
      </p>
    );
  }

  const displayEvents = compact ? events.slice(0, 5) : events;

  return (
    <div className="relative space-y-1">
      {/* Vertical line */}
      <div className="absolute bottom-2 start-4 top-2 w-px bg-white/8" />

      {displayEvents.map((event, idx) => {
        const Icon = EVENT_ICONS[event.eventType] ?? FileEdit;
        const colorClass = EVENT_COLORS[event.eventType] ?? "text-white/40 bg-white/5";
        const isLast = idx === displayEvents.length - 1;

        return (
          <div
            key={event.id}
            className={cn(
              "relative flex items-start gap-3 py-2",
              isLast && compact && "pb-0",
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                colorClass,
              )}
            >
              <Icon className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="flex-1 pt-0.5">
              <p className="text-sm font-medium text-white/90">
                {event.title}
              </p>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <span>{formatDate(event.createdAt)}</span>
                {event.actorName && (
                  <>
                    <span>·</span>
                    <span>{event.actorName}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {compact && events.length > 5 && (
        <p className="ps-11 pt-1 text-xs text-primary">
          +{events.length - 5} أحداث أخرى
        </p>
      )}
    </div>
  );
}
