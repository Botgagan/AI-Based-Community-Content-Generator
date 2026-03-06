import { db } from "../index.js";

import { posts } from "../db/posts.schema.js";
import { themes } from "../db/themes.schema.js";
import { communities } from "../db/community.schema";
import { communityMembers } from "../db/communityMembers.schema";

import { eq, and, desc } from "drizzle-orm";

import { randomUUID } from "crypto";

/* =============================
   GET POSTS
============================= */

export async function getPosts({
  userId,
  themeId,
  communityId,
  page = 1,
}: {
  userId: string;
  themeId?: string;
  communityId?: string;
  page?: number;
}) {

   const limit = 10;
   const offset = (page -1) * limit;

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
   CREATE POST
============================= */

export async function createPost(
  data: {
    themeId: string;
    title: string;
    content: string;
  },
  userId: string
) {
  const [theme] = await db
    .select()
    .from(themes)
    .where(eq(themes.id, data.themeId));

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

  const [post] = await db
    .insert(posts)
    .values({
      id: randomUUID(),
      themeId: data.themeId,
      title: data.title,
      content: data.content,
    })
    .returning();

  return post;
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

  const newContent = post.content + " (Regenerated)";

  const [updated] = await db
    .update(posts)
    .set({ content: newContent })
    .where(eq(posts.id, id))
    .returning();

  return updated;
}