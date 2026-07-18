import { PageHeader } from "@/components/shared/page-header";
import { ExecutiveDashboard } from "@/components/analytics/executive-dashboard";

export const metadata = { title: "لوحة القيادة" };

export default function ExecutivePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="لوحة القيادة التنفيذية"
        description="تحليلات شاملة لجميع أنشطة الوكالة"
      />
      <ExecutiveDashboard />
    </div>
  );
}
