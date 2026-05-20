import { db } from "../index.js";
import { posts } from "../db/posts.schema.js";
import { themes } from "../db/themes.schema.js";
import { communities } from "../db/community.schema.js";
import { communityMembers } from "../db/communityMembers.schema.js";
import { postSchedules } from "../db/postSchedules.schema.js";
import { eq, and, desc, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";
import { generateAIPosts } from "../ai/posts.generator.js";
import { enqueuePostImageJob } from "../queue/image.queue.js";
import {
  getFacebookPublishStatus,
  scheduleFacebookPhotoPost,
} from "./facebook.service.js";
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
  const rows = await query;

  if (!rows.length) {
    return rows;
  }

  const postIds = rows.map((row) => row.id);
  const schedules = await db
    .select({
      id: postSchedules.id,
      postId: postSchedules.postId,
      status: postSchedules.status,
      scheduledAt: postSchedules.scheduledAt,
      platform: postSchedules.platform,
      facebookShareUrl: postSchedules.facebookShareUrl,
      createdAt: postSchedules.createdAt,
    })
    .from(postSchedules)
    .where(inArray(postSchedules.postId, postIds))
    .orderBy(desc(postSchedules.createdAt));

  const now = new Date();

  for (const schedule of schedules) {
    if (
      schedule.status === "scheduled" &&
      schedule.facebookShareUrl &&
      schedule.scheduledAt <= now
    ) {
      const currentStatus = await getFacebookPublishStatus(schedule.facebookShareUrl);
      if (currentStatus === "published") {
        await db
          .update(postSchedules)
          .set({
            status: "published",
            processedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(postSchedules.id, schedule.id));
        schedule.status = "published";
      }
    }
  }

  const latestScheduleByPostId = new Map<
    string,
    { status: string; scheduledAt: Date; platform: string }
  >();

  for (const schedule of schedules) {
    if (!latestScheduleByPostId.has(schedule.postId)) {
      latestScheduleByPostId.set(schedule.postId, {
        status: schedule.status,
        scheduledAt: schedule.scheduledAt,
        platform: schedule.platform,
      });
    }
  }

  return rows.map((row) => {
    const schedule = latestScheduleByPostId.get(row.id);
    return {
      ...row,
      facebookSchedule: schedule
        ? {
            status: schedule.status,
            scheduledAt: schedule.scheduledAt,
            platform: schedule.platform,
          }
        : null,
    };
  });
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

export async function scheduleApprovedPostToFacebook(
  postId: string,
  scheduledAt: Date,
  userId: string,
  userTimezone: string = "UTC"
) {
  const post = await verifyPostOwnerAccess(postId, userId);

  if (post.status !== "approved") {
    throw new Error("Only approved posts can be scheduled.");
  }

  if (!post.imageUrl) {
    throw new Error("Post image is still generating. Please schedule after image is ready.");
  }

  const result = await scheduleFacebookPhotoPost({
    caption: post.content,
    imageUrl: post.imageUrl,
    scheduledAt,
  });

  await db.insert(postSchedules).values({
    postId: post.id,
    userId,
    platform: "facebook",
    targetType: "page",
    status: "scheduled",
    scheduledAt,
    userTimezone,
    facebookShareUrl: result.post_id || result.id || null,
    processedAt: new Date(),
  });

  return {
    scheduledAt: scheduledAt.toISOString(),
    facebookPostId: result.post_id || result.id || null,
    status: "scheduled",
  };
}
