import { db } from "../index.js";
import { communityMembers } from "../db/communityMembers.schema.js";
import { eq, and } from "drizzle-orm";

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

  if (!member.length) {
    throw new Error("Access denied");
  }

  return member[0];
}