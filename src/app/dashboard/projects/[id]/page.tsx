import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Calendar,
  Hash,
  FolderKanban,
  Video,
  Download,
  Eye,
  Plus,
  Clock,
  Activity,
  HardDrive,
} from "lucide-react";

import { projectService } from "@/services/project.service";
import { workflowService } from "@/services/workflow.service";
import { ROUTES } from "@/lib/constants";
import { formatDate, formatDateTime, formatBytes, formatNumber } from "@/lib/utils/format";
import { PageHeader } from "@/components/shared/page-header";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { SectionTitle } from "@/components/shared/section-title";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { RetentionBadge } from "@/components/projects/retention-badge";
import { WorkflowBadge } from "@/components/workflow/workflow-badge";
import { ProjectTimeline } from "@/components/workflow/project-timeline";

/* ============================================
   Project Details Page
   ============================================ */

const ACTIVITY_LABELS: Record<string, string> = {
  CREATE: "تم إنشاء المشروع",
  UPDATE: "تم تحديث المشروع",
  ARCHIVE: "تمت أرشفة المشروع",
  RESTORE: "تمت استعادة المشروع",
  DELETE: "تم حذف المشروع",
  LOGIN: "تسجيل دخول",
  LOGOUT: "تسجيل خروج",
  UPLOAD: "رفع ملف",
  DOWNLOAD: "تحميل",
  VIEW: "عرض",
  RETENTION_CHANGE: "تم تغيير فترة الاحتفاظ",
};

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FolderKanban;
  label: string;
  value: string | number;
}) {
  return (
    <DashboardCard className="p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </span>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </DashboardCard>
  );
}

export default async function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const project = await projectService.getById(id);
  if (!project) notFound();

  const statistics = await projectService.getStatistics(id);

  const timeline = await workflowService.getHistory(id, 50);

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.name}
        description={`تفاصيل المشروع ${project.projectCode}`}
        breadcrumbs={[
          { label: "المشاريع", href: ROUTES.DASHBOARD_PROJECTS },
          { label: project.name },
        ]}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.DASHBOARD_PROJECTS}>
              <ArrowRight className="h-4 w-4" />
              رجوع
            </Link>
          </Button>
        }
      />

      {/* Status bar */}
      <div className="flex items-center gap-3">
        <ProjectStatusBadge status={project.status} />
        <WorkflowBadge status={project.workflowStatus} />
        <RetentionBadge period={project.retentionPeriod} />
        {project.archivedAt && (
          <span className="text-xs text-muted-foreground">
            أُرشف في {formatDate(project.archivedAt)}
          </span>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Video} label="الفيديوهات" value={formatNumber(statistics.videos)} />
        <StatCard icon={Eye} label="المشاهدات" value={formatNumber(statistics.views)} />
        <StatCard icon={Download} label="التحميلات" value={formatNumber(statistics.downloads)} />
        <StatCard icon={HardDrive} label="حجم التخزين" value={formatBytes(statistics.storageSize)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Basic Information */}
        <div className="lg:col-span-2 space-y-6">
          <DashboardCard className="p-6">
            <SectionTitle title="المعلومات الأساسية" />
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">كود المشروع</dt>
                  <dd className="font-mono text-sm">{project.projectCode}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">الموعد النهائي</dt>
                  <dd className="text-sm">
                    {project.deadline ? formatDate(project.deadline) : "—"}
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">تاريخ الإنشاء</dt>
                  <dd className="text-sm">{formatDate(project.createdAt)}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">آخر تحديث</dt>
                  <dd className="text-sm">{formatDate(project.updatedAt)}</dd>
                </div>
              </div>
            </dl>

            {project.description && (
              <div className="mt-4 border-t pt-4">
                <dt className="mb-1 text-xs text-muted-foreground">الوصف</dt>
                <dd className="text-sm leading-relaxed">{project.description}</dd>
              </div>
            )}
          </DashboardCard>

          {/* Client Information */}
          <DashboardCard className="p-6">
            <SectionTitle title="معلومات العميل" />
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">كود العميل</dt>
                  <dd className="font-mono text-sm">{project.client.clientCode}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">اسم العميل</dt>
                  <dd className="text-sm">{project.client.name}</dd>
                </div>
              </div>
              {project.client.company && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <dt className="text-xs text-muted-foreground">الشركة</dt>
                    <dd className="text-sm">{project.client.company}</dd>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">حالة العميل</dt>
                  <dd className="text-sm">
                    {project.client.status === "ACTIVE" ? "نشط" : project.client.status === "ARCHIVED" ? "مؤرشف" : project.client.status}
                  </dd>
                </div>
              </div>
            </dl>
          </DashboardCard>

          {/* Videos Placeholder */}
          <DashboardCard className="p-6">
            <SectionTitle
              title="الفيديوهات"
              action={
                <Button variant="outline" size="sm" disabled>
                  <Plus className="h-4 w-4" />
                  رفع فيديو
                </Button>
              }
            />
            <div className="mt-4">
              {statistics.videos > 0 ? (
                <p className="text-sm text-muted-foreground">
                  {statistics.videos} فيديو — قيد التطوير
                </p>
              ) : (
                <EmptyState
                  icon={Video}
                  title="لا توجد فيديوهات"
                  description="سيتم عرض فيديوهات المشروع هنا"
                  className="py-8"
                />
              )}
            </div>
          </DashboardCard>
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          <DashboardCard className="p-6">
            <SectionTitle title="السجل الزمني" />
            <ProjectTimeline events={timeline} />
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
