import { db } from "../index.js";
import { communities } from "../db/community.schema";
import { eq, and } from "drizzle-orm";

export async function createCommunity(data: any) {
  return await db.insert(communities).values(data).returning();
}

export async function getUserCommunities(userId: string) {
  return await db
    .select()
    .from(communities)
    .where(eq(communities.userId, userId));
}

export async function updateCommunity(id: string, userId: string, data: any) {
  return await db
    .update(communities)
    .set(data)
    .where(
      and(
        eq(communities.id, id),
        eq(communities.userId, userId)
      )
    )
    .returning();
}

export async function deleteCommunity(id: string, userId: string) {
  return await db
    .delete(communities)
    .where(
      and(
        eq(communities.id, id),
        eq(communities.userId, userId)
      )
    )
    .returning();
}
