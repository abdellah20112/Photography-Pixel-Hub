"use server";

import { clientService } from "@/services/client.service";
import { activityService } from "@/services/activity.service";
import { getCurrentUser } from "@/lib/auth/session";
import type { ClientStatistics } from "@/types/client";

/* ============================================
   Get Client Details Server Action
   Returns client with statistics and timeline.
   ============================================ */

export async function getClientDetailsAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const client = await clientService.getById(id);
  if (!client || client.userId !== user.id) return null;

  const statistics: ClientStatistics = await clientService.getStatistics(id);

  const timeline = await activityService.list({
    entity: "client",
    entityId: id,
    take: 20,
  });

  return {
    client,
    statistics,
    timeline,
  };
}
