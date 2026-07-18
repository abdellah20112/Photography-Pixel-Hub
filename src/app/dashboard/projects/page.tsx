import { PageHeader } from "@/components/shared/page-header";
import { ProjectTable } from "@/components/projects/project-table";

export const metadata = { title: "المشاريع" };

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="المشاريع"
        description="إدارة مشاريع التصوير ومعارض الصور"
      />
      <ProjectTable />
    </div>
  );
}
