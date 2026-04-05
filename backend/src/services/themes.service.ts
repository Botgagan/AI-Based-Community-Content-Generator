import { db } from "../index.js";
import { themes } from "../db/themes.schema";
import { posts } from "../db/posts.schema";
import { communityMembers } from "../db/communityMembers.schema";
import { communities } from "../db/community.schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { getAggregatedContent } from "../apify/aggregator.js";
import { generateAIThemes } from "../ai/theme.generator.js";
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
  resolveOffset,
} from "../config/pagination.js";

type ThemeStatus = "pending" | "active" | "inactive" | "deleted";

async function verifyCommunityMembership(communityId: string, userId: string) {
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

async function verifyCommunityOwner(communityId: string, userId: string) {
  const membership = await verifyCommunityMembership(communityId, userId);
  if (membership.role !== "owner") {
    throw new Error("Only owner can perform this action");
  }
}

async function getThemeById(themeId: string) {
  const [theme] = await db.select().from(themes).where(eq(themes.id, themeId));
  if (!theme) {
    throw new Error("Theme not found");
  }
  return theme;
}

export async function generateThemes(communityId: string, userId: string) {
  await verifyCommunityMembership(communityId, userId);

  const [community] = await db
    .select()
    .from(communities)
    .where(eq(communities.id, communityId));

  if (!community) {
    throw new Error("Community not found");
  }

  const content = await getAggregatedContent({
    websiteUrl: community.websiteUrl,
    youtubeUrl: community.youtubeUrl,
    twitterUrl: community.twitterUrl,
  });

  let aiThemes: { title: string; description: string }[] = [];

  try {
    aiThemes = await generateAIThemes(content);
  } catch (err) {
    console.error("AI parsing error:", err);
    throw new Error("Failed to generate themes");
  }

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
        status: "pending",
      }))
    )
    .returning();

  return insertedThemes;
}

export async function createCustomTheme(
  data: {
    communityId: string;
    title: string;
    description: string;
  },
  userId: string
) {
  await verifyCommunityOwner(data.communityId, userId);

  const [theme] = await db
    .insert(themes)
    .values({
      communityId: data.communityId,
      title: data.title,
      description: data.description,
      scrapedContext: "",
      source: "custom",
      status: "pending",
    })
    .returning();

  return theme;
}

export async function getThemesByCommunity({
  communityId,
  userId,
  page = PAGINATION_DEFAULT_PAGE,
  limit = PAGINATION_DEFAULT_LIMIT,
  statuses,
}: {
  communityId: string;
  userId: string;
  page?: number;
  limit?: number;
  statuses?: ThemeStatus[];
}) {
  await verifyCommunityMembership(communityId, userId);
  const offset = resolveOffset(page, limit);

  const filters = [eq(themes.communityId, communityId)];

  if (statuses && statuses.length > 0) {
    filters.push(inArray(themes.status, statuses));
  } else {
    filters.push(sql`${themes.status} <> 'deleted'`);
  }

  return db
    .select({
      id: themes.id,
      communityId: themes.communityId,
      title: themes.title,
      description: themes.description,
      scrapedContext: themes.scrapedContext,
      imageUrl: themes.imageUrl,
      source: themes.source,
      status: themes.status,
      createdAt: themes.createdAt,
      postCount: sql<number>`count(${posts.id})`.as("postCount"),
    })
    .from(themes)
    .leftJoin(posts, eq(posts.themeId, themes.id))
    .where(and(...filters))
    .groupBy(
      themes.id,
      themes.communityId,
      themes.title,
      themes.description,
      themes.scrapedContext,
      themes.imageUrl,
      themes.source,
      themes.status,
      themes.createdAt
    )
    .orderBy(desc(themes.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function updateThemeStatus(
  themeId: string,
  status: ThemeStatus,
  userId: string
) {
  const theme = await getThemeById(themeId);
  await verifyCommunityOwner(theme.communityId, userId);

  const allowed: ThemeStatus[] = ["pending", "active", "inactive", "deleted"];
  if (!allowed.includes(status)) {
    throw new Error("Invalid theme status");
  }

  const [updatedTheme] = await db
    .update(themes)
    .set({ status })
    .where(eq(themes.id, themeId))
    .returning();

  return updatedTheme;
}

export async function updateTheme(
  themeId: string,
  data: { title?: string; description?: string },
  userId: string
) {
  const theme = await getThemeById(themeId);
  await verifyCommunityOwner(theme.communityId, userId);

  const [updatedTheme] = await db
    .update(themes)
    .set({
      title: data.title ?? theme.title,
      description: data.description ?? theme.description,
    })
    .where(eq(themes.id, themeId))
    .returning();

  return updatedTheme;
}

export async function getThemeDetail(themeId: string, userId: string) {
  const theme = await getThemeById(themeId);
  await verifyCommunityOwner(theme.communityId, userId);

  const themePosts = await db
    .select()
    .from(posts)
    .where(eq(posts.themeId, themeId))
    .orderBy(desc(posts.createdAt));

  const stats = {
    total: themePosts.length,
    pending: themePosts.filter((post) => post.status === "pending").length,
    approved: themePosts.filter((post) => post.status === "approved").length,
    rejected: themePosts.filter((post) => post.status === "rejected").length,
  };

  return {
    theme,
    posts: themePosts,
    stats,
  };
}

export async function deleteTheme(themeId: string, userId: string) {
  const theme = await getThemeById(themeId);
  await verifyCommunityOwner(theme.communityId, userId);

  await db.update(themes).set({ status: "deleted" }).where(eq(themes.id, themeId));

  return { success: true };
}
