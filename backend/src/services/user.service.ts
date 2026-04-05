import { db } from "../index.js";
import { users } from "../db/users.schema.js";
import { communityMembers } from "../db/communityMembers.schema.js";
import { eq } from "drizzle-orm";

type SaveUserInput = {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  avatarUrl?: string;
};

function normalize(value?: string) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

async function migrateMemberships(fromUserId: string, toUserId: string) {
  if (fromUserId === toUserId) return;

  await db.transaction(async (tx) => {
    const fromMemberships = await tx
      .select({
        id: communityMembers.id,
        communityId: communityMembers.communityId,
      })
      .from(communityMembers)
      .where(eq(communityMembers.userId, fromUserId));

    if (fromMemberships.length === 0) return;

    const toMemberships = await tx
      .select({
        communityId: communityMembers.communityId,
      })
      .from(communityMembers)
      .where(eq(communityMembers.userId, toUserId));

    const toCommunitySet = new Set(toMemberships.map((m) => m.communityId));

    for (const membership of fromMemberships) {
      if (toCommunitySet.has(membership.communityId)) {
        await tx
          .delete(communityMembers)
          .where(eq(communityMembers.id, membership.id));
        continue;
      }

      await tx
        .update(communityMembers)
        .set({ userId: toUserId })
        .where(eq(communityMembers.id, membership.id));
    }
  });
}

export async function saveUserToDB(data: SaveUserInput) {
  const email = normalize(data.email)?.toLowerCase();
  let phone = normalize(data.phone);
  let name = normalize(data.name);
  let avatarUrl = normalize(data.avatarUrl);

  const [userById] = await db
    .select({
      id: users.id,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, data.id));

  const [userByEmail] = email
    ? await db
        .select({
          id: users.id,
          email: users.email,
          phone: users.phone,
          name: users.name,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(eq(users.email, email))
    : [undefined];

  // If same email exists on another user id, merge old id into current session id.
  if (userByEmail && userByEmail.id !== data.id) {
    if (!userById) {
      await db.insert(users).values({
        id: data.id,
        email: null,
        phone: null,
        name: null,
        avatarUrl: null,
      });
    }

    await migrateMemberships(userByEmail.id, data.id);

    // Preserve profile data from the email-linked row when incoming fields are missing.
    if (!phone && typeof userByEmail.phone === "string" && userByEmail.phone.trim().length > 0) {
      phone = userByEmail.phone.trim();
    }
    if (!name && typeof userByEmail.name === "string" && userByEmail.name.trim().length > 0) {
      name = userByEmail.name.trim();
    }
    if (
      !avatarUrl &&
      typeof userByEmail.avatarUrl === "string" &&
      userByEmail.avatarUrl.trim().length > 0
    ) {
      avatarUrl = userByEmail.avatarUrl.trim();
    }

    await db
      .delete(users)
      .where(eq(users.id, userByEmail.id));
  }

  const [freshUserById] = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.id, data.id));

  const updates: Partial<{
    email: string | null;
    phone: string | null;
    name: string | null;
    avatarUrl: string | null;
  }> = {};

  if (email) updates.email = email;
  if (phone) updates.phone = phone;
  if (name) updates.name = name;
  if (avatarUrl) updates.avatarUrl = avatarUrl;

  if (!freshUserById) {
    await db.insert(users).values({
      id: data.id,
      email: updates.email ?? null,
      phone: updates.phone ?? null,
      name: updates.name ?? null,
      avatarUrl: updates.avatarUrl ?? null,
    });
    return;
  }

  if (Object.keys(updates).length > 0) {
    await db
      .update(users)
      .set(updates)
      .where(eq(users.id, data.id));
  }
}

export async function getUserById(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      phone: users.phone,
      name: users.name,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId));

  return user || null;
}
