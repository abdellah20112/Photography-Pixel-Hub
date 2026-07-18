import { PageHeader } from "@/components/shared/page-header";
import { ActivityTable } from "@/components/workflow/activity-table";

export const metadata = { title: "النشاط" };

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="النشاط"
        description="سجل أنشطة جميع المشاريع"
      />
      <ActivityTable />
    </div>
  );
}
