import { notFound } from "next/navigation";
import { projectRepository } from "@/repositories/project.repository";
import { PortalAccess } from "@/components/portal/portal-access";
import { PortalProjectViewer } from "@/components/portal/portal-project-viewer";
import { BRANDING } from "@/config/branding";

export const metadata = {
  title: `${BRANDING.shortName} — عرض المشروع`,
};

/* ============================================
   Public Portal — Project Viewer
   /p/[token]/project
   Premium phone-frame video viewer.
   Token-based access, no login required.
   ============================================ */

export default async function PortalProjectPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const project = await projectRepository.findByToken(token);

  if (!project) notFound();

  return (
    <PortalAccess token={token}>
      {(data) => <PortalProjectViewer data={data} token={token} />}
    </PortalAccess>
  );
}
