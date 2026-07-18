import { PageHeader } from "@/components/shared/page-header";
import { ModelTable } from "@/components/models/model-table";

export const metadata = { title: "الموديلات" };

export default function ModelsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="الموديلات"
        description="إدارة الموديلين والمواهب"
      />
      <ModelTable />
    </div>
  );
}
