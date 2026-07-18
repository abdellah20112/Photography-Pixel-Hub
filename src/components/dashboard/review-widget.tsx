"use client";

import { useState, useEffect } from "react";
import { MessageSquare, CheckCircle2, Clock, ThumbsUp } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { SectionTitle } from "@/components/shared/section-title";
import { getReviewStatsAction } from "@/actions/reviews/get-review-stats";
import type { ReviewStats } from "@/types/review";

/* ============================================
   ReviewWidget — Dashboard notification widget
   Shows review activity summary.
   ============================================ */

function StatRow({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof MessageSquare;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}

export function ReviewWidget() {
  const [stats, setStats] = useState<ReviewStats>({
    totalComments: 0,
    openComments: 0,
    resolvedComments: 0,
    archivedComments: 0,
    approvedVideos: 0,
    pendingReviews: 0,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await getReviewStatsAction();
      if (!active) return;
      setStats(result);
    })();
    return () => { active = false };
  }, []);

  return (
    <DashboardCard className="p-5">
      <SectionTitle title="مراجعات الفيديو" />
      <div className="mt-3 divide-y">
        <StatRow
          icon={MessageSquare}
          label="تعليقات جديدة"
          value={stats.openComments}
          color="bg-blue-500/10 text-blue-500"
        />
        <StatRow
          icon={CheckCircle2}
          label="محلولة اليوم"
          value={stats.resolvedComments}
          color="bg-green-500/10 text-green-500"
        />
        <StatRow
          icon={Clock}
          label="مراجعات معلقة"
          value={stats.pendingReviews}
          color="bg-amber-500/10 text-amber-500"
        />
        <StatRow
          icon={ThumbsUp}
          label="فيديوهات معتمدة"
          value={stats.approvedVideos}
          color="bg-purple-500/10 text-purple-500"
        />
      </div>
    </DashboardCard>
  );
}
