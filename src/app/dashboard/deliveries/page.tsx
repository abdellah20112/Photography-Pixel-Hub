import { PageHeader } from "@/components/shared/page-header";
import { DeliveryTable } from "@/components/deliveries/delivery-table";

export const metadata = { title: "التسليم" };

export default function DeliveriesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="التسليم"
        description="إدارة تسليمات الفيديوهات للعملاء"
      />
      <DeliveryTable />
    </div>
  );
}
