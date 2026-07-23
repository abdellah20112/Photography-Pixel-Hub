import { PageHeader } from "@/components/shared/page-header";
import { ExecutiveDashboard } from "@/components/analytics/executive-dashboard";

export const metadata = { title: "التحليلات" };

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="التحليلات"
        description="نظرة شاملة على أداء المنصة"
      />
      <ExecutiveDashboard />
    </div>
  );
}
