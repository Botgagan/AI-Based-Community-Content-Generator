import { db } from "../index.js";
import { themes } from "../db/themes.schema";
import { communityMembers } from "../db/communityMembers.schema";
import { communities } from "../db/community.schema";
import { eq, and, desc } from "drizzle-orm";
import { getAggregatedContent } from "../apify/aggregator.js";
import { generateAIThemes } from "../ai/theme.generator.js";
import { enqueueThemeImageJob } from "../queue/image.queue.js";
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
  resolveOffset,
} from "../config/pagination.js";

/* =========================================================
   VERIFY COMMUNITY MEMBERSHIP
========================================================= */

async function verifyCommunityMembership(
  communityId: string,
  userId: string
) {
  const [membership] = await db
    .select()
    .from(communityMembers)
    .where(
      and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.userId, userId)
      )
    );

  if (!membership) {
    throw new Error("Not authorized for this community");
  }

  return membership;
}

/* =========================================================
   GENERATE AI THEMES
========================================================= */

export async function generateThemes(
  communityId: string,
  userId: string
) {
  const startedAt = Date.now();
  console.info(`[themes.generate] started communityId=${communityId}`);

  await verifyCommunityMembership(communityId, userId);
  console.info("[themes.generate] membership verified");

  const existingThemes = await db
    .select()
    .from(themes)
    .where(
      and(
        eq(themes.communityId, communityId),
        eq(themes.source, "ai")
      )
    );

  if (existingThemes.length > 0) {
    throw new Error("Themes already generated for this community");
  }
  console.info("[themes.generate] existing AI themes check passed");

  const [community] = await db
    .select()
    .from(communities)
    .where(eq(communities.id, communityId));

  if (!community) {
    throw new Error("Community not found");
  }
  console.info("[themes.generate] community loaded");

  const content = await getAggregatedContent({
    websiteUrl: community.websiteUrl,
    youtubeUrl: community.youtubeUrl,
    twitterUrl: community.twitterUrl,
  });
  console.info("[themes.generate] content aggregation finished");

  let aiThemes: { title: string; description: string }[] = [];

  try {
    aiThemes = await generateAIThemes(content);
  } catch (err) {
    console.error("AI parsing error:", err);
    throw new Error("Failed to generate themes");
  }
  console.info(`[themes.generate] ai returned ${aiThemes.length} themes`);

  if (!aiThemes || aiThemes.length === 0) {
    throw new Error("No themes generated");
  }

  const limitedThemes = aiThemes.slice(0, 10);

  const insertedThemes = await db
    .insert(themes)
    .values(
      limitedThemes.map((t) => ({
        communityId,
        title: t.title,
        description: t.description,
        scrapedContext: content,
        source: "ai",
      }))
    )
    .returning();

  console.info(
    `[themes.generate] completed inserted=${insertedThemes.length} durationMs=${Date.now() - startedAt}`
  );

  for (const theme of insertedThemes) {
    await enqueueThemeImageJob(theme.id);
  }

  return insertedThemes;
}
/* =========================================================
   CREATE CUSTOM THEME
========================================================= */

export async function createCustomTheme(
  data: {
    communityId: string;
    title: string;
    description: string;
  },
  userId: string
) {
  await verifyCommunityMembership(data.communityId, userId);

  const [theme] = await db
    .insert(themes)
    .values({
      communityId: data.communityId,
      title: data.title,
      description: data.description,
      scrapedContext: "",
      source: "custom",
    })
    .returning();

  await enqueueThemeImageJob(theme.id);

  return theme;
}

/* =========================================================
   GET THEMES
========================================================= */

export async function getThemesByCommunity({
  communityId,
  userId,
  page = PAGINATION_DEFAULT_PAGE,
  limit = PAGINATION_DEFAULT_LIMIT,
}: {
  communityId: string;
  userId: string;
  page?: number;
  limit?: number;
}) {

  await verifyCommunityMembership(communityId, userId);

  const offset = resolveOffset(page, limit);

  return db
    .select()
    .from(themes)
    .where(eq(themes.communityId, communityId))
    .orderBy(desc(themes.createdAt))
    .limit(limit)
    .offset(offset);
}

/* =========================================================
   DELETE THEME
========================================================= */

export async function deleteTheme(
  themeId: string,
  userId: string
) {
  const [theme] = await db
    .select()
    .from(themes)
    .where(eq(themes.id, themeId));

  if (!theme) {
    throw new Error("Theme not found");
  }

  const membership = await verifyCommunityMembership(
    theme.communityId,
    userId
  );

  // owner-only delete rule
  if (membership.role !== "owner") {
    throw new Error("Only owner can delete themes");
  }

  await db.delete(themes).where(eq(themes.id, themeId));

  return { success: true };
}
