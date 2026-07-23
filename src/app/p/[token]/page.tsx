import { notFound } from "next/navigation";
import { projectRepository } from "@/repositories/project.repository";
import { PortalAccess } from "@/components/portal/portal-access";
import { PortalHome } from "@/components/portal/portal-home";
import { BRANDING } from "@/config/branding";

export const metadata = {
  title: `${BRANDING.shortName} — معاينة المشروع`,
};

/* ============================================
   Public Portal — Home Page
   /p/[token]
   Token-based access, no login required.
   ============================================ */

export default async function PortalHomePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const project = await projectRepository.findByToken(token);

  if (!project) notFound();

  return (
    <PortalAccess token={token}>
      {(data) => <PortalHome data={data} token={token} />}
    </PortalAccess>
  );
}
