import { db } from "../index.js";
import { themes } from "../db/themes.schema";
import { communities } from "../db/community.schema";
import { communityMembers } from "../db/communityMembers.schema";
import { eq, and } from "drizzle-orm";

/* =========================================================
   VERIFY COMMUNITY MEMBERSHIP
========================================================= */

async function verifyCommunityMembership(
  communityId: string,
  userId: string
) {
  const membership = await db
    .select()
    .from(communityMembers)
    .where(
      and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.userId, userId)
      )
    );

  if (!membership.length) {
    throw new Error("Not authorized for this community");
  }

  return membership[0];
}

/* =========================================================
   GENERATE AI THEMES
========================================================= */

export async function generateThemes(
  communityId: string,
  userId: string
) {
  await verifyCommunityMembership(communityId, userId);

  const aiThemes = [
    { title: "Awareness Campaign", description: "Promote mission and values" },
    { title: "Educational Content", description: "Share knowledge and insights" },
    { title: "Events Promotion", description: "Boost engagement" },
  ];

  const inserted = await db
    .insert(themes)
    .values(
      aiThemes.map((t) => ({
        communityId,
        title: t.title,
        description: t.description,
        source: "ai",
      }))
    )
    .returning();

  return inserted;
}

/* =========================================================
   CREATE CUSTOM THEME
========================================================= */

export async function createCustomTheme(
  data: {
    communityId: string;
    title: string;
    description: string;
  },
  userId: string
) {
  await verifyCommunityMembership(data.communityId, userId);

  const [theme] = await db
    .insert(themes)
    .values({
      communityId: data.communityId,
      title: data.title,
      description: data.description,
      source: "custom",
    })
    .returning();

  return theme;
}

/* =========================================================
   GET THEMES
========================================================= */

export async function getThemesByCommunity(
  communityId: string,
  userId: string
) {
  await verifyCommunityMembership(communityId, userId);

  return await db
    .select()
    .from(themes)
    .where(eq(themes.communityId, communityId));
}

/* =========================================================
   DELETE THEME
========================================================= */

export async function deleteTheme(
  themeId: string,
  userId: string
) {
  const theme = await db
    .select()
    .from(themes)
    .where(eq(themes.id, themeId));

  if (!theme.length) {
    throw new Error("Theme not found");
  }

  const communityId = theme[0].communityId;

  const membership = await verifyCommunityMembership(communityId, userId);

  // Only owner can delete theme (optional rule)
  if (membership.role !== "owner") {
    throw new Error("Only owner can delete themes");
  }

  await db.delete(themes).where(eq(themes.id, themeId));

  return { success: true };
}