import { db } from "../index.js";
import { posts } from "../db/posts.schema.js";
import { themes } from "../db/themes.schema.js";
import { communities } from "../db/community.schema.js";
import { communityMembers } from "../db/communityMembers.schema.js";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { generateAIPosts } from "../ai/posts.generator.js";
import { enqueuePostImageJob } from "../queue/image.queue.js";
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
  resolveOffset,
} from "../config/pagination.js";

/* =============================
   GET POSTS
============================= */

export async function getPosts({
  userId,
  themeId,
  communityId,
  page = PAGINATION_DEFAULT_PAGE,
  limit = PAGINATION_DEFAULT_LIMIT,
}: {
  userId: string;
  themeId?: string;
  communityId?: string;
  page?: number;
  limit?: number;
}) {

   const offset = resolveOffset(page, limit);

  const conditions = [
    eq(communityMembers.userId, userId),
  ];

  if (themeId) {
    conditions.push(eq(posts.themeId, themeId));
  }

  if (communityId) {
    conditions.push(eq(themes.communityId, communityId));
  }

  const query = db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      imageUrl: posts.imageUrl,
      themeId: posts.themeId,
      themeTitle: themes.title,
      communityId: themes.communityId,
      communityName: communities.name,
    })
    .from(posts)
    .innerJoin(themes, eq(posts.themeId, themes.id))
    .innerJoin(communities, eq(themes.communityId, communities.id))
    .innerJoin(
      communityMembers,
      eq(communityMembers.communityId, communities.id)
    )
    .where(and(...conditions))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);

  return query;
}

/* =============================
   Generate POST
============================= */

async function getCommunityPromptContext(
  communityId: string,
  scrapedContext?: string | null
) {
  const [community] = await db
    .select()
    .from(communities)
    .where(eq(communities.id, communityId));

  if (!community) throw new Error("Community not found");

  return {
    communityName: community.name,
    communityDescription: community.description,
    scrapedContext: scrapedContext || "",
  };
}

export async function generatePostsFromTheme(
  themeId: string,
  userId: string
) {
  const [theme] = await db
    .select()
    .from(themes)
    .where(eq(themes.id, themeId));

  if (!theme) throw new Error("Theme not found");

  const member = await db
    .select()
    .from(communityMembers)
    .where(
      and(
        eq(communityMembers.communityId, theme.communityId),
        eq(communityMembers.userId, userId)
      )
    );

  if (!member.length) throw new Error("Not authorized");

  const context = await getCommunityPromptContext(
    theme.communityId,
    theme.scrapedContext
  );

  const parsedPosts = await generateAIPosts({
    title: theme.title,
    description: theme.description,
    communityName: context.communityName,
    communityDescription: context.communityDescription,
    scrapedContext: context.scrapedContext,
    temperature: 0.7,
  });

  const inserted = await db
    .insert(posts)
    .values(
      parsedPosts.map((p) => ({
        id: randomUUID(),
        themeId: theme.id,
        title: p.title,
        content: p.content,
      }))
    )
    .returning();

  for (const post of inserted) {
    await enqueuePostImageJob(post.id);
  }

  return inserted;
}

/* =============================
   UPDATE POST
============================= */

export async function updatePost(
  id: string,
  data: any,
  userId: string
) {
  const [post] = await db
    .select()
    .from(posts)
    .where(eq(posts.id, id));

  if (!post) throw new Error("Post not found");

  const [theme] = await db
    .select()
    .from(themes)
    .where(eq(themes.id, post.themeId));

  const member = await db
    .select()
    .from(communityMembers)
    .where(
      and(
        eq(communityMembers.communityId, theme.communityId),
        eq(communityMembers.userId, userId)
      )
    );

  if (!member.length) throw new Error("Not authorized");

  return db
    .update(posts)
    .set(data)
    .where(eq(posts.id, id))
    .returning();
}

/* =============================
   DELETE POST
============================= */

export async function deletePost(id: string, userId: string) {
  const [post] = await db
    .select()
    .from(posts)
    .where(eq(posts.id, id));

  if (!post) throw new Error("Post not found");

  const [theme] = await db
    .select()
    .from(themes)
    .where(eq(themes.id, post.themeId));

  const member = await db
    .select()
    .from(communityMembers)
    .where(
      and(
        eq(communityMembers.communityId, theme.communityId),
        eq(communityMembers.userId, userId)
      )
    );

  if (!member.length) throw new Error("Not authorized");

  await db.delete(posts).where(eq(posts.id, id));
}

/* =============================
   REGENERATE POST
============================= */

export async function regeneratePost(id: string, userId: string) {
  const [post] = await db
    .select()
    .from(posts)
    .where(eq(posts.id, id));

  if (!post) throw new Error("Post not found");

  const [theme] = await db
    .select()
    .from(themes)
    .where(eq(themes.id, post.themeId));

  if (!theme) throw new Error("Theme not found");

  const member = await db
    .select()
    .from(communityMembers)
    .where(
      and(
        eq(communityMembers.communityId, theme.communityId),
        eq(communityMembers.userId, userId)
      )
    );

  if (!member.length) throw new Error("Not authorized");

  const context = await getCommunityPromptContext(
    theme.communityId,
    theme.scrapedContext
  );

  const parsed = await generateAIPosts({
    title: theme.title,
    description: theme.description,
    communityName: context.communityName,
    communityDescription: context.communityDescription,
    scrapedContext: context.scrapedContext,
    temperature: 0.9,
  });

  const newPost = parsed[0];
  if (!newPost) {
    throw new Error("Failed to regenerate post");
  }

  const [updated] = await db
    .update(posts)
    .set({
      title: newPost.title,
      content: newPost.content,
    })
    .where(eq(posts.id, id))
    .returning();

  return updated;
}
