"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils/format";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getNotificationsAction } from "@/actions/notifications/get-notifications";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/actions/notifications/mark-read";
import type { NotificationRow } from "@/types/notification";

/* ============================================
   NotificationMenu — Bell dropdown with real data
   ============================================ */

const NOTIFICATION_ICONS: Record<string, string> = {
  PROJECT_CREATED: "📦",
  MODEL_ASSIGNED: "💃",
  UPLOAD_FINISHED: "📤",
  CLIENT_COMMENTED: "💬",
  CLIENT_APPROVED: "✅",
  CHANGES_REQUESTED: "✏️",
  DOWNLOAD_ENABLED: "🔓",
  DOWNLOAD_COMPLETED: "⬇️",
  PROJECT_COMPLETED: "🎉",
  STATUS_CHANGED: "🔄",
};

export function NotificationMenu() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    const result = await getNotificationsAction({ page: 1, pageSize: 10 });
    setNotifications(result.items);
    setUnreadCount(result.unreadCount);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    const doFetch = () => {
      getNotificationsAction({ page: 1, pageSize: 10 }).then((result) => {
        if (!active) return;
        setNotifications(result.items);
        setUnreadCount(result.unreadCount);
        setLoading(false);
      });
    };
    doFetch();
    const interval = setInterval(doFetch, 30000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    await markAllNotificationsReadAction();
    await fetchNotifications();
    setMarkingAll(false);
  };

  const handleMarkRead = async (id: string) => {
    await markNotificationReadAction(id);
    await fetchNotifications();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="الإشعارات"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm font-semibold">الإشعارات</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleMarkAllRead}
              disabled={markingAll}
            >
              {markingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
              تعليم الكل كمقروء
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        {loading ? (
          <div className="space-y-2 p-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-md" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">لا توجد إشعارات</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => !notif.readAt && handleMarkRead(notif.id)}
                className={`flex w-full items-start gap-3 p-3 text-right transition-colors hover:bg-accent/50 ${
                  !notif.readAt ? "bg-primary/5" : ""
                }`}
              >
                <span className="text-lg shrink-0">
                  {NOTIFICATION_ICONS[notif.type] ?? "🔔"}
                </span>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-xs font-medium truncate">{notif.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                  <p className="text-[10px] text-muted-foreground/70">
                    {formatDateTime(notif.createdAt)}
                  </p>
                </div>
                {!notif.readAt && (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
