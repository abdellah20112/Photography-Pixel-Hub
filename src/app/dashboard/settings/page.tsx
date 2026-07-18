import { Settings } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DashboardCard } from "@/components/dashboard/dashboard-card";

export const metadata = { title: "الإعدادات" };

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="الإعدادات"
        description="إدارة إعدادات الحساب والمنصة"
      />

      <DashboardCard>
        <EmptyState
          icon={Settings}
          title="الإعدادات قيد التطوير"
          description="ستتوفر قريباً خيارات تخصيص الحساب والمنصة والإشعارات"
          className="py-20"
        />
      </DashboardCard>
    </div>
  );
}
