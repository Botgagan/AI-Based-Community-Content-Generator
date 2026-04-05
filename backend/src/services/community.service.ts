import { db } from "../index.js";
import { communities } from "../db/community.schema.js";
import { communityMembers } from "../db/communityMembers.schema.js";
import { eq, and, desc} from "drizzle-orm";
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
}: {
  userId: string
  page?: number
  limit?: number
  all?: boolean
}) {

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
