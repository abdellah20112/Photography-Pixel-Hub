"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

/* ============================================
   Get Project Analytics (auth required)
   Aggregates views, downloads, comments,
   approvals, revisions for a project.
   Returns 7-day breakdown for charts.
   ============================================ */

export type ProjectAnalytics = {
  totals: {
    views: number;
    uniqueVisitors: number;
    downloads: number;
    comments: number;
    approvals: number;
    revisions: number;
    videoPlays: number;
  };
  daily: Array<{
    date: string;
    views: number;
    downloads: number;
    comments: number;
  }>;
};

export async function getProjectAnalyticsAction(
  projectId: string,
): Promise<ProjectAnalytics | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [views, downloads, comments, timelineEvents] = await Promise.all([
    prisma.view.findMany({
      where: { projectId, createdAt: { gte: sevenDaysAgo } },
      select: { ip: true, duration: true, createdAt: true },
    }),
    prisma.download.findMany({
      where: { projectId, createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.reviewComment.findMany({
      where: {
        video: { projectId },
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true },
    }),
    prisma.projectTimelineEvent.findMany({
      where: { projectId },
      select: { eventType: true, title: true, createdAt: true },
    }),
  ]);

  const uniqueIps = new Set(views.map((v) => v.ip).filter(Boolean));
  const videoPlays = views.filter((v) => v.duration && v.duration > 0).length;
  const approvals = timelineEvents.filter(
    (e) => e.eventType === "VIDEO_APPROVED",
  ).length;
  const revisions = timelineEvents.filter(
    (e) =>
      e.eventType === "COMMENT_ADDED" &&
      e.title.includes("تعديل"),
  ).length;

  // Build 7-day breakdown
  const dailyMap = new Map<string, { views: number; downloads: number; comments: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dailyMap.set(key, { views: 0, downloads: 0, comments: 0 });
  }

  for (const v of views) {
    const key = v.createdAt.toISOString().slice(0, 10);
    if (dailyMap.has(key)) {
      dailyMap.get(key)!.views++;
    }
  }
  for (const d of downloads) {
    const key = d.createdAt.toISOString().slice(0, 10);
    if (dailyMap.has(key)) {
      dailyMap.get(key)!.downloads++;
    }
  }
  for (const c of comments) {
    const key = c.createdAt.toISOString().slice(0, 10);
    if (dailyMap.has(key)) {
      dailyMap.get(key)!.comments++;
    }
  }

  return {
    totals: {
      views: views.length,
      uniqueVisitors: uniqueIps.size,
      downloads: downloads.length,
      comments: comments.length,
      approvals,
      revisions,
      videoPlays,
    },
    daily: Array.from(dailyMap.entries()).map(([date, vals]) => ({
      date,
      ...vals,
    })),
  };
}
