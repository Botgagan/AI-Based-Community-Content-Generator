import { db } from "../index.js";
import { communityMembers } from "../db/communityMembers.schema";
import { and, eq } from "drizzle-orm";

/* CHECK MEMBER ACCESS */

export async function checkCommunityAccess(
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

  if (!member.length)
    throw new Error("Not authorized for this community");

  return member[0];
}

/* CHECK OWNER */

export async function requireOwner(
  communityId: string,
  userId: string
) {
  const member = await checkCommunityAccess(communityId, userId);

  if (member.role !== "owner")
    throw new Error("Only owner allowed");

  return member;
}