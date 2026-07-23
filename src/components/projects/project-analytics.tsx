"use client";

import { useState, useEffect } from "react";
import {
  Eye,
  Users,
  Play,
  MessageSquare,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { SectionTitle } from "@/components/shared/section-title";
import { formatNumber } from "@/lib/utils/format";
import { getProjectAnalyticsAction, type ProjectAnalytics } from "@/actions/projects/get-project-analytics";
import { cn } from "@/lib/utils/cn";

/* ============================================
   ProjectAnalytics — Analytics dashboard
   Shows views, visitors, plays, comments,
   revisions, approvals, downloads + 7-day chart.
   ============================================ */

type ProjectAnalyticsProps = {
  projectId: string;
};

const METRIC_ICONS = {
  views: Eye,
  uniqueVisitors: Users,
  videoPlays: Play,
  comments: MessageSquare,
  downloads: Download,
  approvals: CheckCircle2,
  revisions: AlertTriangle,
};

const METRIC_LABELS: Record<string, string> = {
  views: "المشاهدات",
  uniqueVisitors: "زوار فريدون",
  videoPlays: "تشغيل الفيديو",
  comments: "تعليقات",
  downloads: "تحميلات",
  approvals: "اعتمادات",
  revisions: "طلبات تعديل",
};

export function ProjectAnalytics({ projectId }: ProjectAnalyticsProps) {
  const [data, setData] = useState<ProjectAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getProjectAnalyticsAction(projectId).then((result) => {
      if (!active) return;
      setData(result);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [projectId]);

  if (loading) {
    return (
      <DashboardCard className="p-6">
        <SectionTitle title="تحليلات المشروع" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </DashboardCard>
    );
  }

  if (!data) return null;

  const metrics = [
    { key: "views", value: data.totals.views },
    { key: "uniqueVisitors", value: data.totals.uniqueVisitors },
    { key: "videoPlays", value: data.totals.videoPlays },
    { key: "comments", value: data.totals.comments },
    { key: "downloads", value: data.totals.downloads },
    { key: "approvals", value: data.totals.approvals },
    { key: "revisions", value: data.totals.revisions },
  ];

  const maxValue = Math.max(...data.daily.map((d) => Math.max(d.views, d.downloads, d.comments)), 1);

  return (
    <DashboardCard className="p-6">
      <div className="flex items-center justify-between">
        <SectionTitle title="تحليلات المشروع" />
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          آخر 7 أيام
        </span>
      </div>

      {/* Metric cards */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {metrics.map((metric) => {
          const Icon = METRIC_ICONS[metric.key as keyof typeof METRIC_ICONS] ?? TrendingUp;
          return (
            <div
              key={metric.key}
              className="rounded-lg border bg-card p-3"
            >
              <Icon className="h-4 w-4 text-primary" />
              <p className="mt-2 text-xl font-bold">{formatNumber(metric.value)}</p>
              <p className="text-[10px] text-muted-foreground">
                {METRIC_LABELS[metric.key]}
              </p>
            </div>
          );
        })}
      </div>

      {/* 7-day chart */}
      <div className="mt-6">
        <h4 className="mb-3 text-sm font-medium">النشاط اليومي</h4>
        <div className="flex h-32 items-end gap-1.5">
          {data.daily.map((day) => {
            const date = new Date(day.date);
            const dayLabel = date.toLocaleDateString("ar-SA", { weekday: "short" });
            return (
              <div
                key={day.date}
                className="flex flex-1 flex-col items-center gap-1"
                title={`${dayLabel}: ${day.views} مشاهدة، ${day.downloads} تحميل`}
              >
                {/* Stacked bars */}
                <div className="flex w-full flex-1 flex-col justify-end gap-px">
                  {day.views > 0 && (
                    <div
                      className="w-full rounded-t bg-primary transition-all"
                      style={{ height: `${(day.views / maxValue) * 100}%` }}
                    />
                  )}
                  {day.downloads > 0 && (
                    <div
                      className="w-full bg-primary/40 transition-all"
                      style={{ height: `${(day.downloads / maxValue) * 100}%` }}
                    />
                  )}
                  {day.comments > 0 && (
                    <div
                      className="w-full rounded-b bg-amber-500/40 transition-all"
                      style={{ height: `${(day.comments / maxValue) * 100}%` }}
                    />
                  )}
                </div>
                <span className="text-[9px] text-muted-foreground">{dayLabel}</span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" />
            مشاهدات
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary/40" />
            تحميلات
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500/40" />
            تعليقات
          </span>
        </div>
      </div>
    </DashboardCard>
  );
}
