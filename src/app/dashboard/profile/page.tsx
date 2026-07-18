import { UserCircle } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DashboardCard } from "@/components/dashboard/dashboard-card";

export const metadata = { title: "الملف الشخصي" };

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="الملف الشخصي"
        description="عرض وتعديل معلوماتك الشخصية"
      />

      <DashboardCard>
        <EmptyState
          icon={UserCircle}
          title="الملف الشخصي قيد التطوير"
          description="ستتمكن قريباً من تعديل معلوماتك الشخصية وصورتك الشخصية"
          className="py-20"
        />
      </DashboardCard>
    </div>
  );
}
