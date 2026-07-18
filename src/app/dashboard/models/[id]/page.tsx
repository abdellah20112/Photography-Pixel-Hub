import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Phone, MessageCircle, Mail, Hash, Calendar } from "lucide-react";

import { modelService } from "@/services/model.service";
import { ROUTES } from "@/lib/constants";
import { formatDate, formatNumber } from "@/lib/utils/format";
import { PageHeader } from "@/components/shared/page-header";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { SectionTitle } from "@/components/shared/section-title";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ModelStatusBadge, PaymentStatusBadge } from "@/components/models/model-status-badge";
import { getWhatsAppUrl } from "@/lib/utils/whatsapp";

/* ============================================
   Model Profile Page
   ============================================ */

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <DashboardCard className="p-4">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Hash className="h-5 w-5" />
        </span>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </DashboardCard>
  );
}

export default async function ModelProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const model = await modelService.getById(id);
  if (!model) notFound();

  const statistics = await modelService.getStatistics(id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={model.fullName}
        description={`ملف الموديل ${model.modelCode}`}
        breadcrumbs={[
          { label: "الموديلات", href: ROUTES.DASHBOARD_MODELS },
          { label: model.fullName },
        ]}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.DASHBOARD_MODELS}>
              <ArrowRight className="h-4 w-4" />
              رجوع
            </Link>
          </Button>
        }
      />

      {/* Status bar */}
      <div className="flex items-center gap-3">
        <ModelStatusBadge status={model.status} />
        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <a
            href={getWhatsAppUrl(model.whatsapp || model.phone, `مرحباً ${model.fullName}`)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="h-4 w-4" />
            واتساب
          </a>
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="المشاريع" value={statistics.totalProjects} color="bg-blue-500/10 text-blue-500" />
        <StatCard label="إجمالي الفيديوهات" value={statistics.totalVideos} color="bg-purple-500/10 text-purple-500" />
        <StatCard label="إجمالي الدخل" value={statistics.totalEarnings.toFixed(0)} color="bg-green-500/10 text-green-500" />
        <StatCard label="مدفوعات معلقة" value={statistics.pendingAmount.toFixed(0)} color="bg-amber-500/10 text-amber-500" />
        <StatCard label="مدفوع" value={statistics.paidAmount.toFixed(0)} color="bg-teal-500/10 text-teal-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Information */}
        <DashboardCard className="p-6">
          <SectionTitle title="المعلومات الشخصية" />
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">كود الموديل</dt>
                <dd className="font-mono text-sm">{model.modelCode}</dd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">الهاتف</dt>
                <dd className="text-sm" dir="ltr">{model.phone}</dd>
              </div>
            </div>
            {model.whatsapp && (
              <div className="flex items-center gap-3">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">واتساب</dt>
                  <dd className="text-sm" dir="ltr">{model.whatsapp}</dd>
                </div>
              </div>
            )}
            {model.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">البريد الإلكتروني</dt>
                  <dd className="text-sm" dir="ltr">{model.email}</dd>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">تاريخ الإنشاء</dt>
                <dd className="text-sm">{formatDate(model.createdAt)}</dd>
              </div>
            </div>
          </dl>

          {model.notes && (
            <div className="mt-4 border-t pt-4">
              <dt className="mb-1 text-xs text-muted-foreground">ملاحظات</dt>
              <dd className="text-sm leading-relaxed">{model.notes}</dd>
            </div>
          )}
        </DashboardCard>

        {/* Current Assignments */}
        <DashboardCard className="p-6">
          <SectionTitle title="التعيينات الحالية" />
          <div className="mt-4">
            {model.projectModels.length === 0 ? (
              <EmptyState
                icon={Hash}
                title="لا توجد تعيينات"
                description="لم يتم تعيين هذا الموديل في أي مشروع"
                className="py-8"
              />
            ) : (
              <div className="space-y-3">
                {model.projectModels.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Link href={ROUTES.DASHBOARD_PROJECT_DETAILS(assignment.project.id)} className="font-medium hover:underline">
                        {assignment.project.name}
                      </Link>
                      <p className="font-mono text-xs text-muted-foreground">{assignment.project.projectCode}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {assignment.videosCount} فيديو · {assignment.totalAmount.toFixed(0)}
                      </p>
                    </div>
                    <PaymentStatusBadge status={assignment.paymentStatus} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
