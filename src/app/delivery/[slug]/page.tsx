import { notFound } from "next/navigation";

import { deliveryService } from "@/services/delivery.service";
import { DeliveryPortalAccess } from "@/components/delivery/delivery-portal-access";
import { ExpiredScreen } from "@/components/delivery/expired-screen";
import { DisabledScreen } from "@/components/delivery/disabled-screen";

/* ============================================
   Public Delivery Portal Page
   /delivery/[slug]
   No authentication required.
   ============================================ */

export default async function DeliveryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const delivery = await deliveryService.getBySlug(slug);

  if (!delivery) {
    notFound();
  }

  const accessStatus = deliveryService.checkAccess(delivery);

  if (accessStatus === "disabled") {
    return <DisabledScreen />;
  }

  if (accessStatus === "expired") {
    return <ExpiredScreen />;
  }

  // Delegate to client component for password flow + signed URLs
  return <DeliveryPortalAccess slug={slug} />;
}
