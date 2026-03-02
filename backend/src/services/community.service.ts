import { db } from "../index.js";
import { communities } from "../db/community.schema";
import { communityMembers } from "../db/communityMembers.schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

/* =========================================================
   CREATE COMMUNITY
========================================================= */

export async function createCommunity(data: any, userId: string) {
  /* create community */
  const [community] = await db
    .insert(communities)
    .values({
      id: data.id,
      name: data.name,
      description: data.description,
      websiteUrl: data.websiteUrl,
      youtubeUrl: data.youtubeUrl,
      twitterUrl: data.twitterUrl,
    })
    .returning();

  /* IMPORTANT — add creator as OWNER */
  await db.insert(communityMembers).values({
    id: randomUUID(),
    communityId: community.id,
    userId,
    role: "owner",
  });

  return community;
}

/* =========================================================
   GET USER COMMUNITIES
========================================================= */

export async function getUserCommunities(userId: string) {
  return await db
    .select({
      id: communities.id,
      name: communities.name,
      description: communities.description,
      createdAt: communities.createdAt,
    })
    .from(communityMembers)
    .innerJoin(
      communities,
      eq(communityMembers.communityId, communities.id)
    )
    .where(eq(communityMembers.userId, userId));
}

/* =========================================================
   GET COMMUNITY BY ID
========================================================= */

export async function getCommunityById(id: string, userId: string) {
  const result = await db
    .select()
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

  return result[0]?.communities ?? null;
}

/* =========================================================
   UPDATE (OWNER ONLY)
========================================================= */

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

  return await db
    .update(communities)
    .set(data)
    .where(eq(communities.id, id))
    .returning();
}

/* =========================================================
   DELETE (OWNER ONLY)
========================================================= */

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

  return await db
    .delete(communities)
    .where(eq(communities.id, id))
    .returning();
}

/* =========================================================
   LEAVE COMMUNITY
========================================================= */

export async function leaveCommunity(
  communityId: string,
  userId: string
) {
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

  return await db
    .delete(communityMembers)
    .where(
      and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.userId, userId)
      )
    );
}
