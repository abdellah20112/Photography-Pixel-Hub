"use server";

import { projectRepository } from "@/repositories/project.repository";
import { deliveryRepository } from "@/repositories/delivery.repository";
import { getCurrentUser } from "@/lib/auth/session";
import { APP_URL } from "@/lib/constants";

/* ============================================
   Get Portal Share Data (auth required)
   Returns portal URL, token, and delivery
   settings for the share dialog.
   ============================================ */

export type PortalShareData = {
  projectName: string;
  projectCode: string;
  clientName: string;
  token: string;
  portalUrl: string;
  delivery: {
    id: string;
    slug: string;
    title: string;
    expiresAt: Date | null;
    passwordProtected: boolean;
    downloadEnabled: boolean;
    allowStreaming: boolean;
    allowComments: boolean;
  } | null;
};

export async function getPortalShareAction(
  projectId: string,
): Promise<PortalShareData | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const project = await projectRepository.findById(projectId);
  if (!project) return null;

  const deliveries = await deliveryRepository.findMany({
    projectId,
    take: 1,
  });
  const delivery = deliveries.items[0] ?? null;

  const portalUrl = `${APP_URL}/p/${project.token}`;

  return {
    projectName: project.name,
    projectCode: project.projectCode,
    clientName: project.client?.name ?? "",
    token: project.token,
    portalUrl,
    delivery: delivery
      ? {
          id: delivery.id,
          slug: delivery.slug,
          title: delivery.title,
          expiresAt: delivery.expiresAt,
          passwordProtected: delivery.passwordProtected,
          downloadEnabled: delivery.downloadEnabled,
          allowStreaming: delivery.allowStreaming,
          allowComments: delivery.allowComments,
        }
      : null,
  };
}
