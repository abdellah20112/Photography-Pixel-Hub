import { formatDateTime } from "@/lib/utils/format";
import type { ProjectEventType } from "@prisma/client";

/* ============================================
   Event Icons + Labels
   ============================================ */

const EVENT_ICONS: Record<string, string> = {
  PROJECT_CREATED: "📦",
  PROJECT_UPDATED: "✏️",
  PROJECT_STATUS_CHANGED: "🔄",
  VIDEOS_UPLOADED: "🎬",
  UPLOAD_FAILED: "❌",
  DELIVERY_CREATED: "📤",
  DELIVERY_PUBLISHED: "🚀",
  DELIVERY_VIEWED: "👁️",
  DOWNLOAD_STARTED: "⬇️",
  DOWNLOAD_COMPLETED: "✅",
  COMMENT_ADDED: "💬",
  COMMENT_RESOLVED: "✔️",
  VIDEO_APPROVED: "👍",
  INVOICE_CREATED: "🧾",
  INVOICE_PAID: "💳",
  PROJECT_COMPLETED: "🎉",
  WORKFLOW_TRANSITION: "🔄",
};

const EVENT_LABELS: Record<string, string> = {
  PROJECT_CREATED: "إنشاء المشروع",
  PROJECT_UPDATED: "تحديث المشروع",
  PROJECT_STATUS_CHANGED: "تغيير الحالة",
  VIDEOS_UPLOADED: "رفع فيديوهات",
  UPLOAD_FAILED: "فشل الرفع",
  DELIVERY_CREATED: "إنشاء تسليم",
  DELIVERY_PUBLISHED: "نشر تسليم",
  DELIVERY_VIEWED: "عرض التسليم",
  DOWNLOAD_STARTED: "بدء التحميل",
  DOWNLOAD_COMPLETED: "إكمال التحميل",
  COMMENT_ADDED: "إضافة تعليق",
  COMMENT_RESOLVED: "حل تعليق",
  VIDEO_APPROVED: "اعتماد فيديو",
  INVOICE_CREATED: "إنشاء فاتورة",
  INVOICE_PAID: "دفع فاتورة",
  PROJECT_COMPLETED: "اكتمال المشروع",
  WORKFLOW_TRANSITION: "تغيير سير العمل",
};

/** Get relative time in Arabic (e.g., "منذ 5 دقائق"). */
export function getRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = Date.now();
  const diff = now - d.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) return formatDateTime(d);
  if (days > 0) return `منذ ${days} يوم`;
  if (hours > 0) return `منذ ${hours} ساعة`;
  if (minutes > 0) return `منذ ${minutes} دقيقة`;
  return "منذ لحظات";
}

type ProjectTimelineProps = {
  events: Array<{
    id: string;
    eventType: ProjectEventType;
    title: string;
    description: string | null;
    actorName: string;
    createdAt: Date | string;
  }>;
};

/* ============================================
   ProjectTimeline — Chronological timeline
   Displays project events newest first.
   ============================================ */

export function ProjectTimeline({ events }: ProjectTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        لا توجد أحداث بعد
      </div>
    );
  }

  return (
    <ol className="mt-4 space-y-4">
      {events.map((event, index) => (
        <li key={event.id} className="flex gap-3">
          {/* Icon + connector */}
          <div className="flex flex-col items-center">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm">
              {EVENT_ICONS[event.eventType] ?? "📋"}
            </span>
            {index !== events.length - 1 && (
              <span className="mt-1 h-full w-px flex-1 bg-border" />
            )}
          </div>

          {/* Content */}
          <div className="pb-2">
            <p className="text-sm font-medium">
              {event.title}
            </p>
            {event.description && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {event.description}
              </p>
            )}
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{event.actorName}</span>
              <span>·</span>
              <span>{getRelativeTime(event.createdAt)}</span>
              <span>·</span>
              <span>{formatDateTime(event.createdAt)}</span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export { EVENT_LABELS, EVENT_ICONS };
