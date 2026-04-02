import { Queue } from "bullmq";
import IORedis from "ioredis";
import type { ImageGenerationJob } from "./image.job.types.js";
import { processImageGenerationJob } from "../services/image.jobs.service.js";

const queueName = "image-generation";
const rawRedisUrl = process.env.REDIS_URL?.trim();

function resolveRedisUrl(value: string | undefined) {
  if (!value) return null;

  // Common placeholder values should behave like "not configured".
  if (value === "..." || value.toLowerCase() === "your_redis_url") {
    return null;
  }

  try {
    const parsed = new URL(value);
    return parsed.hostname ? value : null;
  } catch {
    return null;
  }
}

const redisUrl = resolveRedisUrl(rawRedisUrl);
export const imageQueueRedisUrl = redisUrl;

if (rawRedisUrl && !redisUrl) {
  console.warn("[image.queue] REDIS_URL is invalid. Falling back to inline mode.");
}

export const isImageQueueEnabled = Boolean(redisUrl);

function createRedisConnection() {
  if (!redisUrl) return null;

  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  });
}

const queueConnection = createRedisConnection();

export const imageQueue = queueConnection
  ? new Queue<ImageGenerationJob>(queueName, { connection: queueConnection })
  : null;

async function enqueueImageJob(job: ImageGenerationJob) {
  if (!imageQueue) {
    // Fallback for local development when Redis is not configured.
    processImageGenerationJob(job).catch((error) => {
      console.error("[image.queue] inline image generation failed:", error);
    });
    return;
  }

  const attempts = Number(process.env.IMAGE_JOB_ATTEMPTS || 2);
  const backoffDelayMs = Number(process.env.IMAGE_JOB_BACKOFF_MS || 2000);

  await imageQueue.add("generate", job, {
    // BullMQ custom job IDs cannot contain ":".
    jobId: `${job.entityType}-${job.entityId}`,
    removeOnComplete: 1000,
    removeOnFail: 5000,
    attempts: Number.isFinite(attempts) && attempts > 0 ? attempts : 2,
    backoff: {
      type: "exponential",
      delay:
        Number.isFinite(backoffDelayMs) && backoffDelayMs > 0
          ? backoffDelayMs
          : 2000,
    },
  });
}

export async function enqueuePostImageJob(postId: string) {
  await enqueueImageJob({
    entityType: "post",
    entityId: postId,
  });
}

export function getImageQueueName() {
  return queueName;
}
