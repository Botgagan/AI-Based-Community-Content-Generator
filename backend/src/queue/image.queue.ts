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

  await imageQueue.add("generate", job, {
    jobId: `${job.entityType}:${job.entityId}`,
    removeOnComplete: 1000,
    removeOnFail: 5000,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
  });
}

export async function enqueueThemeImageJob(themeId: string) {
  await enqueueImageJob({
    entityType: "theme",
    entityId: themeId,
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
