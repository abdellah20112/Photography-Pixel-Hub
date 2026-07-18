/* ============================================
   Job Scheduler
   Registers all recurring jobs with their intervals.
   ============================================ */

import { cleanupExpiredProjects } from "../cleanup/expired-projects";
import { sendPendingEmailNotifications } from "../emails/send-notifications";

export type ScheduledJob = {
  name: string;
  intervalMs: number;
  handler: () => Promise<void>;
};

export const scheduledJobs: ScheduledJob[] = [
  {
    name: "cleanup-expired-projects",
    intervalMs: 60 * 60 * 1000, // 1 hour
    handler: cleanupExpiredProjects,
  },
  {
    name: "send-pending-emails",
    intervalMs: 5 * 60 * 1000, // 5 minutes
    handler: sendPendingEmailNotifications,
  },
];

/**
 * Start the job scheduler.
 * Call this once during application bootstrap (e.g., in instrumentation.ts).
 */
export function startScheduler(): void {
  for (const job of scheduledJobs) {
    setInterval(() => {
      job.handler().catch((error) => {
        console.error(`[job:${job.name}] failed:`, error);
      });
    }, job.intervalMs);

    if (process.env.NODE_ENV !== "production") {
      console.log(`[scheduler] registered: ${job.name}`);
    }
  }
}
