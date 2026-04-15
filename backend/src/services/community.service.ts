import { db } from "../index.js";
import { communities } from "../db/community.schema.js";
import { communityMembers } from "../db/communityMembers.schema.js";
import { invites } from "../db/invites.schema.js";
import { themes } from "../db/themes.schema.js";
import { posts } from "../db/posts.schema.js";
import { eq, and, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
  resolveOffset,
} from "../config/pagination.js";

/* CREATE COMMUNITY */

export async function createCommunity(data: any, userId: string) {
  const [community] = await db
    .insert(communities)
    .values({
      id: data.id,
      name: data.name,
      description: data.description,
      websiteUrl: data.websiteUrl,
      youtubeUrl: data.youtubeUrl,
      twitterUrl: data.twitterUrl,
      imageUrl: data.imageUrl,
    })
    .returning();

  // creator becomes owner
  await db.insert(communityMembers).values({
    id: randomUUID(),
    communityId: community.id,
    userId,
    role: "owner",
  });

  return community;
}

/* GET USER COMMUNITIES */

export async function getUserCommunities({
  userId,
  page = PAGINATION_DEFAULT_PAGE,
  limit = PAGINATION_DEFAULT_LIMIT,
  all = false,
  scope = "member",
}: {
  userId: string
  page?: number
  limit?: number
  all?: boolean
  scope?: "member" | "directory"
}) {
  if (scope === "directory") {
    const offset = resolveOffset(page, limit);

    return db
      .select({
        id: communities.id,
        name: communities.name,
        description: communities.description,
        imageUrl: communities.imageUrl,
        createdAt: communities.createdAt,
        isMember: sql<boolean>`${communityMembers.userId} IS NOT NULL`.as("isMember"),
        role: communityMembers.role,
      })
      .from(communities)
      .leftJoin(
        communityMembers,
        and(
          eq(communityMembers.communityId, communities.id),
          eq(communityMembers.userId, userId)
        )
      )
      .orderBy(desc(communities.createdAt))
      .limit(limit)
      .offset(offset);
  }

  const baseQuery = db
    .select({
      id: communities.id,
      name: communities.name,
      description: communities.description,
      imageUrl: communities.imageUrl,
      createdAt: communities.createdAt,
    })
    .from(communityMembers)
    .innerJoin(
      communities,
      eq(communityMembers.communityId, communities.id)
    )
    .where(eq(communityMembers.userId, userId))
    .orderBy(desc(communities.createdAt));

  if (all) {
    return baseQuery;
  }

  const offset = resolveOffset(page, limit);

  return baseQuery.limit(limit).offset(offset);
}

/* GET COMMUNITY BY ID (ONLY IF MEMBER) */

export async function getCommunityById(id: string, userId: string) {
  const result = await db
    .select({
      id: communities.id,
      name: communities.name,
      description: communities.description,
      websiteUrl: communities.websiteUrl,
      youtubeUrl: communities.youtubeUrl,
      twitterUrl: communities.twitterUrl,
      imageUrl: communities.imageUrl,
      createdAt: communities.createdAt,
      role: communityMembers.role,
    })
    .from(communityMembers)
    .innerJoin(
      communities,
      eq(communityMembers.communityId, communities.id)
    )
    .where(
      and(
        eq(communities.id, id),
        eq(communityMembers.userId, userId)
      )
    );

  return result[0] || null;
}

/* UPDATE (OWNER ONLY) */

export async function updateCommunity(id: string, userId: string, data: any) {
  const member = await db
    .select()
    .from(communityMembers)
    .where(
      and(
        eq(communityMembers.communityId, id),
        eq(communityMembers.userId, userId)
      )
    );

  if (!member.length || member[0].role !== "owner")
    throw new Error("Only owner can update");

  return db
    .update(communities)
    .set(data)
    .where(eq(communities.id, id))
    .returning();
}

/* DELETE (OWNER ONLY) */

export async function deleteCommunity(id: string, userId: string) {
  const member = await db
    .select()
    .from(communityMembers)
    .where(
      and(
        eq(communityMembers.communityId, id),
        eq(communityMembers.userId, userId)
      )
    );

  if (!member.length || member[0].role !== "owner")
    throw new Error("Only owner can delete");

  return db.delete(communities).where(eq(communities.id, id)).returning();
}

/* LEAVE COMMUNITY */

export async function leaveCommunity(communityId: string, userId: string) {
  const member = await db
    .select()
    .from(communityMembers)
    .where(
      and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.userId, userId)
      )
    );

  if (!member.length) throw new Error("Not a member");

  if (member[0].role === "owner")
    throw new Error("Owner cannot leave");

  return db
    .delete(communityMembers)
    .where(
      and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.userId, userId)
      )
    );
}

export async function joinCommunity(communityId: string, userId: string) {
  const [community] = await db
    .select({ id: communities.id })
    .from(communities)
    .where(eq(communities.id, communityId));

  if (!community) {
    throw new Error("Community not found");
  }

  const [existingMembership] = await db
    .select({ id: communityMembers.id })
    .from(communityMembers)
    .where(
      and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.userId, userId)
      )
    );

  if (existingMembership) {
    return { joined: false };
  }

  await db.insert(communityMembers).values({
    id: randomUUID(),
    communityId,
    userId,
    role: "member",
  });

  return { joined: true };
}

export async function getCommunityAdminStats(communityId: string, userId: string) {
  const member = await db
    .select({
      role: communityMembers.role,
    })
    .from(communityMembers)
    .where(
      and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.userId, userId)
      )
    );

  if (!member.length || (member[0].role !== "owner" && member[0].role !== "admin")) {
    throw new Error("Only owner or admin can view community analytics");
  }

  const [
    membersCountResult,
    invitedUsersCountResult,
    themesGeneratedResult,
    themesApprovedResult,
    themesPendingResult,
    postsGeneratedResult,
    postsApprovedResult,
    postsPendingResult,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(communityMembers)
      .where(eq(communityMembers.communityId, communityId)),
    db
      .select({ count: sql<number>`count(distinct ${invites.email})` })
      .from(invites)
      .where(eq(invites.communityId, communityId)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(themes)
      .where(and(eq(themes.communityId, communityId), sql`${themes.status} <> 'deleted'`)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(themes)
      .where(and(eq(themes.communityId, communityId), eq(themes.status, "active"))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(themes)
      .where(and(eq(themes.communityId, communityId), eq(themes.status, "pending"))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .innerJoin(themes, eq(posts.themeId, themes.id))
      .where(eq(themes.communityId, communityId)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .innerJoin(themes, eq(posts.themeId, themes.id))
      .where(and(eq(themes.communityId, communityId), eq(posts.status, "approved"))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .innerJoin(themes, eq(posts.themeId, themes.id))
      .where(and(eq(themes.communityId, communityId), eq(posts.status, "pending"))),
  ]);

  return {
    members: Number(membersCountResult[0]?.count ?? 0),
    invitedUsers: Number(invitedUsersCountResult[0]?.count ?? 0),
    themesGenerated: Number(themesGeneratedResult[0]?.count ?? 0),
    themesApproved: Number(themesApprovedResult[0]?.count ?? 0),
    themesPending: Number(themesPendingResult[0]?.count ?? 0),
    postsGenerated: Number(postsGeneratedResult[0]?.count ?? 0),
    postsApproved: Number(postsApprovedResult[0]?.count ?? 0),
    postsPending: Number(postsPendingResult[0]?.count ?? 0),
  };
}
