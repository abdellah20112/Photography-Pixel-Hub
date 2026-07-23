import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { projectService } from "@/services/project.service";
import { getDeliveryCenterDataAction } from "@/actions/delivery/delivery-center";
import { ROUTES } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { DeliveryCenter } from "@/components/delivery/delivery-center";

export const metadata = { title: "مركز التسليم" };

/* ============================================
   Delivery Center Page
   ============================================ */

export default async function DeliveryCenterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const project = await projectService.getById(id);
  if (!project) notFound();

  const data = await getDeliveryCenterDataAction(id);
  if (!data) return notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="مركز التسليم"
        description={`${project.name} — ${project.projectCode}`}
        breadcrumbs={[
          { label: "المشاريع", href: ROUTES.DASHBOARD_PROJECTS },
          { label: project.name, href: ROUTES.DASHBOARD_PROJECT_DETAILS(id) },
          { label: "التسليم" },
        ]}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.DASHBOARD_PROJECT_DETAILS(id)}>
              <ArrowRight className="h-4 w-4" />
              رجوع
            </Link>
          </Button>
        }
      />

      <DeliveryCenter data={data} />
    </div>
  );
}
