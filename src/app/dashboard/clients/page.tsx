import { PageHeader } from "@/components/shared/page-header";
import { ClientTable } from "@/components/clients/client-table";

export const metadata = { title: "العملاء" };

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="العملاء"
        description="إدارة عملائك ومعارض الصور الخاصة بهم"
      />
      <ClientTable />
    </div>
  );
}
