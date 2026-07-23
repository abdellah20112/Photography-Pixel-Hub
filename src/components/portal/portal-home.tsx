"use client";

import Link from "next/link";
import {
  Play,
  Calendar,
  User,
  Clock,
  ChevronLeft,
} from "lucide-react";

import { BRANDING } from "@/config/branding";
import { ReviewStatusBadge } from "@/components/review/review-status-badge";
import { PortalTimeline } from "@/components/portal/portal-timeline";
import { PortalDeliverySection } from "@/components/portal/portal-delivery-section";
import { formatDateTime } from "@/lib/utils/format";
import { WORKFLOW_STATUS_LABELS } from "@/lib/workflow/transitions";
import type { PortalData } from "@/actions/public/get-portal-data";

/* ============================================
   PortalHome — Beautiful mobile-first home page
   First screen clients see.
   Shows project info, progress, timeline,
   and CTA to view project.
   ============================================ */

type PortalHomeProps = {
  data: PortalData;
  token: string;
};

export function PortalHome({ data, token }: PortalHomeProps) {
  const { project, videos, files, progress } = data;
  const isDelivered =
    project.workflowStatus === "DELIVERED" ||
    project.workflowStatus === "COMPLETED";
  const hasVideos = videos.length > 0;

  return (
    <main className="min-h-dvh bg-gradient-to-b from-[#0a0a0c] via-[#0e0e12] to-[#121214] text-white">
      {/* ── Header with logo ─────────────────── */}
      <header className="flex flex-col items-center gap-3 px-6 pt-10 pb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRANDING.logo.white}
          alt={BRANDING.companyName}
          className="h-14 w-14 rounded-xl object-contain"
        />
        <p className="text-xs text-white/40">{BRANDING.tagline}</p>
      </header>

      {/* ── Project card ──────────────────────── */}
      <section className="mx-auto max-w-md px-4 pb-8">
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 backdrop-blur-sm">
          {/* Project name */}
          <h1 className="text-center text-xl font-bold tracking-tight">
            {project.name}
          </h1>

          {/* Client name */}
          <div className="mt-2 flex items-center justify-center gap-1.5 text-sm text-white/50">
            <User className="h-3.5 w-3.5" />
            <span>{project.clientName}</span>
          </div>

          {/* Status badge */}
          <div className="mt-3 flex justify-center">
            <ReviewStatusBadge status={project.workflowStatus} />
          </div>

          {/* Progress bar */}
          <div className="mt-5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/40">التقدم</span>
              <span className="font-medium text-white/70">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Meta info */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-white/40">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              آخر تحديث: {formatDateTime(project.updatedAt)}
            </span>
            {project.shootingDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDateTime(project.shootingDate)}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── View Project CTA ──────────────────── */}
      {hasVideos && (
        <section className="mx-auto max-w-md px-4 pb-6">
          <Link
            href={`/p/${token}/project`}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary px-6 py-4 text-base font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="h-5 w-5" fill="white" />
            عرض المشروع
          </Link>
          <p className="mt-2 text-center text-xs text-white/30">
            {videos.length} فيديو متاح للمعاينة
          </p>
        </section>
      )}

      {/* ── Delivery downloads ───────────────── */}
      {isDelivered && (
        <section className="mx-auto max-w-md px-4 pb-6">
          <PortalDeliverySection
            token={token}
            videos={videos.filter((v) => v.downloadUrl)}
            files={files}
          />
        </section>
      )}

      {/* ── Timeline ─────────────────────────── */}
      <section className="mx-auto max-w-md px-4 pb-6">
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
          <h2 className="mb-3 text-sm font-semibold text-white/80">
            سجل المشروع
          </h2>
          <PortalTimeline token={token} compact />
        </div>
      </section>

      {/* ── Footer ───────────────────────────── */}
      <footer className="border-t border-white/5 py-6">
        <div className="mx-auto flex max-w-md flex-col items-center gap-1 px-4 text-center">
          <div className="flex items-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BRANDING.logo.white}
              alt={BRANDING.companyName}
              className="h-4 w-4 rounded object-contain"
            />
            <span className="text-xs font-medium text-white/40">
              {BRANDING.companyName}
            </span>
          </div>
          <p className="text-[10px] text-white/20">
            هذه المعاينة محمية — يمنع التحميل أو التوزيع بدون إذن
          </p>
        </div>
      </footer>
    </main>
  );
}
