import { BarChart3 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DashboardCard } from "@/components/dashboard/dashboard-card";

export const metadata = { title: "التحليلات" };

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="التحليلات"
        description="نظرة شاملة على أداء منصتك"
      />

      <DashboardCard>
        <EmptyState
          icon={BarChart3}
          title="لا توجد بيانات تحليلية بعد"
          description="ستظهر هنا رسوم بيانية وتقارير تفصيلية عن العملاء والمشاريع والتنزيلات"
          className="py-20"
        />
      </DashboardCard>
    </div>
  );
}
