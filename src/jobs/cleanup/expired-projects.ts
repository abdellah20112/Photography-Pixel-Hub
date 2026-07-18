/* ============================================
   Expired Projects Cleanup Job
   Archives projects whose expiry date has passed.
   ============================================ */

export async function cleanupExpiredProjects(): Promise<void> {
  // TODO: Query projects where expiresAt < now() and status = PUBLISHED
  //       Update status to EXPIRED
  //       This will be implemented when the scheduler is connected.
}
