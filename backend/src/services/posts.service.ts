import { db } from "../index.js";
import { posts } from "../db/posts.schema.js";
import { postSchedules } from "../db/postSchedules.schema.js";
import { themes } from "../db/themes.schema.js";
import { communities } from "../db/community.schema.js";
import { communityMembers } from "../db/communityMembers.schema.js";
import { eq, and, desc, inArray, lte, or } from "drizzle-orm";
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
  statuses,
  page = PAGINATION_DEFAULT_PAGE,
  limit = PAGINATION_DEFAULT_LIMIT,
}: {
  userId: string;
  themeId?: string;
  communityId?: string;
  statuses?: string[];
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

  if (statuses?.length) {
    conditions.push(inArray(posts.status, statuses));
  }

  const query = db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      imageUrl: posts.imageUrl,
      status: posts.status,
      rejectionReason: posts.rejectionReason,
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
  if (theme.status !== "active") {
    throw new Error("This theme is pending admin approval");
  }

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
        status: "pending",
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
    .set({
      title: data.title ?? post.title,
      content: data.content ?? post.content,
    })
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
      status: "pending",
      rejectionReason: null,
    })
    .where(eq(posts.id, id))
    .returning();

  return updated;
}

async function verifyPostOwnerAccess(postId: string, userId: string) {
  const [post] = await db.select().from(posts).where(eq(posts.id, postId));
  if (!post) throw new Error("Post not found");

  const [theme] = await db.select().from(themes).where(eq(themes.id, post.themeId));
  if (!theme) throw new Error("Theme not found");

  const [member] = await db
    .select()
    .from(communityMembers)
    .where(
      and(
        eq(communityMembers.communityId, theme.communityId),
        eq(communityMembers.userId, userId)
      )
    );

  if (!member || (member.role !== "owner" && member.role !== "admin")) {
    throw new Error("Only owner or admin can review posts");
  }

  return post;
}

export async function reviewPost(
  postId: string,
  status: "approved" | "rejected",
  rejectionReason: string | undefined,
  userId: string
) {
  const post = await verifyPostOwnerAccess(postId, userId);

  if (status === "rejected" && (!rejectionReason || rejectionReason.trim().length < 5)) {
    throw new Error("Rejection reason is required");
  }

  const [updated] = await db
    .update(posts)
    .set({
      status,
      rejectionReason: status === "rejected" ? rejectionReason?.trim() : null,
    })
    .where(eq(posts.id, post.id))
    .returning();

  return updated;
}

async function verifyPostMemberAccess(postId: string, userId: string) {
  const [post] = await db.select().from(posts).where(eq(posts.id, postId));
  if (!post) throw new Error("Post not found");

  const [theme] = await db.select().from(themes).where(eq(themes.id, post.themeId));
  if (!theme) throw new Error("Theme not found");

  const [member] = await db
    .select()
    .from(communityMembers)
    .where(
      and(
        eq(communityMembers.communityId, theme.communityId),
        eq(communityMembers.userId, userId)
      )
    );

  if (!member) throw new Error("Not authorized");

  return { post, theme };
}

function buildFacebookShareUrl(input: { title: string; content: string; imageUrl?: string | null }) {
  const fallbackUrl = process.env.FRONTEND_URL?.trim() || "https://www.facebook.com/";
  const sourceUrl = input.imageUrl?.trim() || fallbackUrl;
  const quote = `${input.title}\n\n${input.content}`.slice(0, 1500);

  const params = new URLSearchParams({
    u: sourceUrl,
    quote,
  });

  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}

export async function schedulePostForFacebook(
  postId: string,
  scheduledAtRaw: string,
  userTimezone: string,
  userId: string
) {
  const { post } = await verifyPostMemberAccess(postId, userId);

  if (post.status !== "approved") {
    throw new Error("Only approved posts can be scheduled");
  }

  const scheduledAt = new Date(scheduledAtRaw);
  if (Number.isNaN(scheduledAt.getTime())) {
    throw new Error("Invalid schedule time");
  }

  if (scheduledAt.getTime() <= Date.now()) {
    throw new Error("Schedule time must be in the future");
  }

  await db
    .update(postSchedules)
    .set({
      status: "cancelled",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(postSchedules.postId, post.id),
        eq(postSchedules.userId, userId),
        or(eq(postSchedules.status, "scheduled"), eq(postSchedules.status, "ready_to_share"))
      )
    );

  const [created] = await db
    .insert(postSchedules)
    .values({
      id: randomUUID(),
      postId: post.id,
      userId,
      platform: "facebook",
      targetType: "profile_dialog",
      status: "scheduled",
      scheduledAt,
      userTimezone: userTimezone?.trim() || "UTC",
      updatedAt: new Date(),
    })
    .returning();

  return created;
}

export async function getFacebookPostSchedules(
  userId: string,
  communityId?: string
) {
  const conditions = [
    eq(postSchedules.userId, userId),
    eq(postSchedules.platform, "facebook"),
    eq(communityMembers.userId, userId),
  ];

  if (communityId) {
    conditions.push(eq(themes.communityId, communityId));
  }

  return db
    .select({
      id: postSchedules.id,
      postId: postSchedules.postId,
      status: postSchedules.status,
      scheduledAt: postSchedules.scheduledAt,
      userTimezone: postSchedules.userTimezone,
      facebookShareUrl: postSchedules.facebookShareUrl,
      errorMessage: postSchedules.errorMessage,
      createdAt: postSchedules.createdAt,
      updatedAt: postSchedules.updatedAt,
    })
    .from(postSchedules)
    .innerJoin(posts, eq(postSchedules.postId, posts.id))
    .innerJoin(themes, eq(posts.themeId, themes.id))
    .innerJoin(communityMembers, eq(communityMembers.communityId, themes.communityId))
    .where(and(...conditions))
    .orderBy(desc(postSchedules.createdAt));
}

export async function markFacebookScheduleShared(scheduleId: string, userId: string) {
  const [schedule] = await db
    .select()
    .from(postSchedules)
    .where(and(eq(postSchedules.id, scheduleId), eq(postSchedules.userId, userId)));

  if (!schedule) {
    throw new Error("Schedule entry not found");
  }

  const [updated] = await db
    .update(postSchedules)
    .set({
      status: "shared",
      processedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(postSchedules.id, schedule.id))
    .returning();

  return updated;
}

export async function processDueFacebookSchedules() {
  const dueSchedules = await db
    .select({
      id: postSchedules.id,
      postId: postSchedules.postId,
      status: postSchedules.status,
      scheduledAt: postSchedules.scheduledAt,
      title: posts.title,
      content: posts.content,
      imageUrl: posts.imageUrl,
      postStatus: posts.status,
    })
    .from(postSchedules)
    .innerJoin(posts, eq(postSchedules.postId, posts.id))
    .where(
      and(
        eq(postSchedules.platform, "facebook"),
        eq(postSchedules.status, "scheduled"),
        lte(postSchedules.scheduledAt, new Date())
      )
    )
    .orderBy(desc(postSchedules.scheduledAt))
    .limit(100);

  for (const row of dueSchedules) {
    try {
      if (row.postStatus !== "approved") {
        await db
          .update(postSchedules)
          .set({
            status: "failed",
            errorMessage: "Post is no longer approved",
            processedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(postSchedules.id, row.id));
        continue;
      }

      const facebookShareUrl = buildFacebookShareUrl({
        title: row.title,
        content: row.content,
        imageUrl: row.imageUrl,
      });

      await db
        .update(postSchedules)
        .set({
          status: "ready_to_share",
          facebookShareUrl,
          processedAt: new Date(),
          updatedAt: new Date(),
          errorMessage: null,
        })
        .where(eq(postSchedules.id, row.id));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown scheduling error";
      await db
        .update(postSchedules)
        .set({
          status: "failed",
          errorMessage: message,
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(postSchedules.id, row.id));
    }
  }

  return dueSchedules.length;
}
