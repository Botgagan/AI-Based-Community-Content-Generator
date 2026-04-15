import { processDueFacebookSchedules } from "../services/posts.service.js";

const DEFAULT_INTERVAL_MS = 30_000;
let facebookScheduleWorkerTimer: NodeJS.Timeout | null = null;

export function startFacebookScheduleWorker() {
  if (facebookScheduleWorkerTimer) return facebookScheduleWorkerTimer;

  const intervalMs = Number(process.env.FACEBOOK_SCHEDULE_WORKER_INTERVAL_MS || DEFAULT_INTERVAL_MS);
  const safeInterval = Number.isFinite(intervalMs) && intervalMs >= 5000 ? intervalMs : DEFAULT_INTERVAL_MS;

  const run = async () => {
    try {
      const processed = await processDueFacebookSchedules();
      if (processed > 0) {
        console.info(`[facebook.schedule.worker] marked ${processed} schedule(s) as ready_to_share.`);
      }
    } catch (error) {
      console.error("[facebook.schedule.worker] failed:", error);
    }
  };

  run().catch(() => {
    // handled in run
  });

  facebookScheduleWorkerTimer = setInterval(() => {
    run().catch(() => {
      // handled in run
    });
  }, safeInterval);

  return facebookScheduleWorkerTimer;
}
