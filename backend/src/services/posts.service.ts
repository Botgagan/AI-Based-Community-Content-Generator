import { db } from "../index.js";
import { posts } from "../db/posts.schema.js";
import { themes } from "../db/themes.schema.js";
import { communities } from "../db/community.schema.js";
import { communityMembers } from "../db/communityMembers.schema.js";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { openai } from "../ai/llm.service.js";
import { generatePostsPrompt } from "../utils/prompts.js";
import { parsePostResponse } from "../utils/posts.parser.js";

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
   Generate POST
============================= */

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

  const completion = await openai.chat.completions.create({
    model: "google/gemini-2.5-flash",
    temperature: 0.7,
    messages: [
      {
        role: "user",
        content: generatePostsPrompt({
          title: theme.title,
          description: theme.description,
        }),
      },
    ],
  });

  const text = completion.choices[0]?.message?.content || "[]";

  const parsedPosts = parsePostResponse(text);

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

  const completion = await openai.chat.completions.create({
    model: "google/gemini-2.5-flash",
    temperature: 0.9,
    messages: [
      {
        role: "user",
        content: generatePostsPrompt({
          title: theme.title,
          description: theme.description,
        }),
      },
    ],
  });

  const text = completion.choices[0]?.message?.content || "[]";
  const parsed = parsePostResponse(text);

  const newPost = parsed[0];

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
