import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { projectService } from "@/services/project.service";
import { ROUTES } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { VideoGrid } from "@/components/uploads/video-grid";

/* ============================================
   Project Videos Page
   Video library scoped to a single project.
   ============================================ */

export default async function ProjectVideosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const project = await projectService.getById(id);
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`فيديوهات ${project.name}`}
        description={`${project.projectCode} — إدارة فيديوهات المشروع`}
        breadcrumbs={[
          { label: "المشاريع", href: ROUTES.DASHBOARD_PROJECTS },
          { label: project.name, href: ROUTES.DASHBOARD_PROJECT_DETAILS(id) },
          { label: "الفيديوهات" },
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

      <VideoGrid projectId={id} />
    </div>
  );
}