import { PageHeader } from "@/components/shared/page-header";
import { TeamTable } from "@/components/team/team-table";

export const metadata = { title: "الفريق" };

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="الفريق"
        description="إدارة أعضاء فريق العمل والصلاحيات"
      />
      <TeamTable />
    </div>
  );
}
