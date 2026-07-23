import { PageHeader } from "@/components/shared/page-header";
import { FinanceDashboard } from "@/components/finance/finance-dashboard";

export const metadata = { title: "المالية" };

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="المالية"
        description="إدارة عروض الأسعار والفواتير والمدفوعات"
      />
      <FinanceDashboard />
    </div>
  );
}
