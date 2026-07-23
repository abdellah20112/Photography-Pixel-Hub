"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Activity as ActivityIcon, ArrowLeft } from "lucide-react";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionTitle } from "@/components/shared/section-title";
import { Button } from "@/components/ui/button";
import { getRecentActivityAction, type RecentActivityItem } from "@/actions/dashboard/get-recent-activity";
import { EVENT_ICONS } from "@/components/workflow/project-timeline";
import { getRelativeTime } from "@/components/workflow/project-timeline";
import { ROUTES } from "@/lib/constants";

/* ============================================
   RecentActivity — Dashboard widget
   Shows latest 10 activity events with
   project links and relative time.
   ============================================ */

export function RecentActivity() {
  const [items, setItems] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getRecentActivityAction(8).then((result) => {
      if (!active) return;
      setItems(result);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <Card className="animate-fade-in-up">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <SectionTitle title="النشاط الأخير" />
          <Button variant="ghost" size="sm" asChild>
            <Link href={ROUTES.DASHBOARD_ACTIVITY}>
              عرض الكل
              <ArrowLeft className="h-3.5 w-3.5 rtl-flip" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-2 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={ActivityIcon}
            title="لا يوجد نشاط بعد"
            description="ستظهر هنا آخر التحديثات على المشاريع"
            className="py-10"
          />
        ) : (
          <div className="space-y-1">
            {items.map((event) => (
              <Link
                key={event.id}
                href={
                  event.project
                    ? ROUTES.DASHBOARD_PROJECT_DETAILS(event.project.id)
                    : "#"
                }
                className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm">
                  {EVENT_ICONS[event.eventType] ?? "📋"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{event.title}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {event.project && (
                      <span className="truncate">{event.project.name}</span>
                    )}
                    <span>·</span>
                    <span>{getRelativeTime(event.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
