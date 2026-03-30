import { eq } from "drizzle-orm";
import { db } from "../index.js";
import { communities } from "../db/community.schema.js";
import { posts } from "../db/posts.schema.js";
import { themes } from "../db/themes.schema.js";
import { generateImageBase64 } from "../ai/image.generator.js";
import { uploadBase64ImageToCloudinary } from "./cloudinary.service.js";
import type { ImageGenerationJob } from "../queue/image.job.types.js";
import {
  generatePostImagePrompt,
  generateThemeImagePrompt,
} from "../utils/prompts.js";

async function processThemeImage(themeId: string) {
  const [record] = await db
    .select({
      id: themes.id,
      title: themes.title,
      description: themes.description,
      scrapedContext: themes.scrapedContext,
      communityName: communities.name,
      communityDescription: communities.description,
    })
    .from(themes)
    .innerJoin(communities, eq(themes.communityId, communities.id))
    .where(eq(themes.id, themeId));

  if (!record) {
    throw new Error(`Theme not found: ${themeId}`);
  }

  const prompt = generateThemeImagePrompt({
    communityName: record.communityName,
    communityDescription: record.communityDescription,
    themeTitle: record.title,
    themeDescription: record.description,
    scrapedContext: record.scrapedContext,
  });

  const base64 = await generateImageBase64(prompt);
  const upload = await uploadBase64ImageToCloudinary({
    base64,
    folder: "themes",
    publicId: record.id,
  });

  await db
    .update(themes)
    .set({ imageUrl: upload.secure_url })
    .where(eq(themes.id, themeId));
}

async function processPostImage(postId: string) {
  const [record] = await db
    .select({
      postId: posts.id,
      postTitle: posts.title,
      postContent: posts.content,
      themeTitle: themes.title,
      themeDescription: themes.description,
      scrapedContext: themes.scrapedContext,
      communityName: communities.name,
      communityDescription: communities.description,
    })
    .from(posts)
    .innerJoin(themes, eq(posts.themeId, themes.id))
    .innerJoin(communities, eq(themes.communityId, communities.id))
    .where(eq(posts.id, postId));

  if (!record) {
    throw new Error(`Post not found: ${postId}`);
  }

  const prompt = generatePostImagePrompt({
    communityName: record.communityName,
    communityDescription: record.communityDescription,
    themeTitle: record.themeTitle,
    themeDescription: record.themeDescription,
    postTitle: record.postTitle,
    postContent: record.postContent,
    scrapedContext: record.scrapedContext,
  });

  const base64 = await generateImageBase64(prompt);
  const upload = await uploadBase64ImageToCloudinary({
    base64,
    folder: "posts",
    publicId: record.postId,
  });

  await db
    .update(posts)
    .set({ imageUrl: upload.secure_url })
    .where(eq(posts.id, postId));
}

export async function processImageGenerationJob(job: ImageGenerationJob) {
  if (job.entityType === "theme") {
    await processThemeImage(job.entityId);
    return;
  }

  if (job.entityType === "post") {
    await processPostImage(job.entityId);
    return;
  }

  throw new Error(`Unsupported image job entityType: ${job.entityType}`);
}
