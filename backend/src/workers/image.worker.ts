import { Worker } from "bullmq";
import IORedis from "ioredis";
import { processImageGenerationJob } from "../services/image.jobs.service.js";
import {
  getImageQueueName,
  imageQueueRedisUrl,
  isImageQueueEnabled,
} from "../queue/image.queue.js";
import type { ImageGenerationJob } from "../queue/image.job.types.js";

let imageWorker: Worker<ImageGenerationJob> | null = null;

export function startImageWorker() {
  if (!isImageQueueEnabled) {
    console.warn("[image.worker] REDIS_URL not configured, running inline mode.");
    return null;
  }

  if (imageWorker) return imageWorker;

  const redis = new IORedis(imageQueueRedisUrl!, {
    maxRetriesPerRequest: null,
  });

  imageWorker = new Worker<ImageGenerationJob>(
    getImageQueueName(),
    async (job) => {
      await processImageGenerationJob(job.data);
    },
    {
      connection: redis,
      concurrency: Number(process.env.IMAGE_WORKER_CONCURRENCY || 3),
    }
  );

  imageWorker.on("completed", (job) => {
    console.info(`[image.worker] completed ${job.id}`);
  });

  imageWorker.on("failed", (job, error) => {
    console.error(`[image.worker] failed ${job?.id}:`, error);
  });

  return imageWorker;
}
