import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Phone,
  Mail,
  Calendar,
  Hash,
  FolderKanban,
  Video,
  Download,
  Eye,
  Plus,
  Clock,
  Activity,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth/session";
import { clientService } from "@/services/client.service";
import { activityService } from "@/services/activity.service";
import { ROUTES } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import { PageHeader } from "@/components/shared/page-header";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { SectionTitle } from "@/components/shared/section-title";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

/* ============================================
   Client Details Page
   ============================================ */

function statusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return <Badge variant="default" className="bg-green-600 hover:bg-green-600">نشط</Badge>;
    case "ARCHIVED":
      return <Badge variant="secondary">مؤرشف</Badge>;
    case "BLOCKED":
      return <Badge variant="destructive">محظور</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

const ACTIVITY_LABELS: Record<string, string> = {
  CREATE: "تم إنشاء العميل",
  UPDATE: "تم تحديث العميل",
  ARCHIVE: "تمت أرشفة العميل",
  RESTORE: "تمت استعادة العميل",
  DELETE: "تم حذف العميل",
  LOGIN: "تسجيل دخول",
  LOGOUT: "تسجيل خروج",
  UPLOAD: "رفع ملف",
  DOWNLOAD: "تحميل",
  VIEW: "عرض",
};

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FolderKanban;
  label: string;
  value: number;
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

export default async function ClientDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) notFound();

  const client = await clientService.getById(id);
  if (!client || client.userId !== user.id) notFound();

  const statistics = await clientService.getStatistics(id);

  const timeline = await activityService.list({
    entity: "client",
    entityId: id,
    take: 15,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.name}
        description={`تفاصيل العميل ${client.clientCode}`}
        breadcrumbs={[
          { label: "العملاء", href: ROUTES.DASHBOARD_CLIENTS },
          { label: client.name },
        ]}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.DASHBOARD_CLIENTS}>
              <ArrowRight className="h-4 w-4" />
              رجوع
            </Link>
          </Button>
        }
      />

      {/* Status bar */}
      <div className="flex items-center gap-3">
        {statusBadge(client.status)}
        {client.archivedAt && (
          <span className="text-xs text-muted-foreground">
            أُرشف في {formatDate(client.archivedAt)}
          </span>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={FolderKanban} label="المشاريع" value={statistics.projects} />
        <StatCard icon={Video} label="الفيديوهات" value={statistics.videos} />
        <StatCard icon={Download} label="التحميلات" value={statistics.downloads} />
        <StatCard icon={Eye} label="المشاهدات" value={statistics.views} />
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
                  <dt className="text-xs text-muted-foreground">كود العميل</dt>
                  <dd className="font-mono text-sm">{client.clientCode}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">الشركة</dt>
                  <dd className="text-sm">{client.company ?? "—"}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">البريد الإلكتروني</dt>
                  <dd className="text-sm" dir="ltr">{client.email}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">الهاتف</dt>
                  <dd className="text-sm" dir="ltr">{client.phone ?? "—"}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">تاريخ الإنشاء</dt>
                  <dd className="text-sm">{formatDate(client.createdAt)}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">آخر تحديث</dt>
                  <dd className="text-sm">{formatDate(client.updatedAt)}</dd>
                </div>
              </div>
            </dl>

            {client.notes && (
              <div className="mt-4 border-t pt-4">
                <dt className="mb-1 text-xs text-muted-foreground">ملاحظات</dt>
                <dd className="text-sm leading-relaxed">{client.notes}</dd>
              </div>
            )}
          </DashboardCard>

          {/* Projects Placeholder */}
          <DashboardCard className="p-6">
            <SectionTitle
              title="المشاريع"
              action={
                <Button variant="outline" size="sm" disabled>
                  <Plus className="h-4 w-4" />
                  مشروع جديد
                </Button>
              }
            />
            <div className="mt-4">
              {statistics.projects > 0 ? (
                <p className="text-sm text-muted-foreground">
                  {statistics.projects} مشروع — قيد التطوير
                </p>
              ) : (
                <EmptyState
                  icon={FolderKanban}
                  title="لا توجد مشاريع"
                  description="سيتم عرض مشاريع العميل هنا"
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
            {timeline.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="لا يوجد سجل"
                description="سيظهر هنا سجل نشاطات العميل"
                className="py-8"
              />
            ) : (
              <ol className="mt-4 space-y-4">
                {timeline.map((entry) => (
                  <li key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Activity className="h-4 w-4 text-primary" />
                      </span>
                      {entry !== timeline[timeline.length - 1] && (
                        <span className="mt-1 h-full w-px flex-1 bg-border" />
                      )}
                    </div>
                    <div className="pb-2">
                      <p className="text-sm font-medium">
                        {ACTIVITY_LABELS[entry.type] ?? entry.type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(entry.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
