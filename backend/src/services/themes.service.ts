import { db } from "../index.js";
import { themes } from "../db/themes.schema";
import { communities } from "../db/community.schema";
import { eq, and } from "drizzle-orm";

/* =========================================================
   HELPER → VERIFY COMMUNITY OWNERSHIP
========================================================= */

async function verifyCommunityOwnership(
  communityId: string,
  userId: string
) {
  const community = await db
    .select()
    .from(communities)
    .where(
      and(
        eq(communities.id, communityId),
        eq(communities.userId, userId)
      )
    );

  if (!community.length) {
    throw new Error("Community not found or unauthorized");
  }

  return community[0];
}

/* =========================================================
   GENERATE AI THEMES
========================================================= */

export async function generateThemes(
  communityId: string,
  userId: string
) {
  await verifyCommunityOwnership(communityId, userId);

  const aiThemes = [//these are dummy themes. In real implementation, you would call an AI service to generate themes based on community info.
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
  await verifyCommunityOwnership(data.communityId, userId);

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
  await verifyCommunityOwnership(communityId, userId);

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
  /* verify theme belongs to user's community */

  const theme = await db.select().from(themes).where(eq(themes.id, themeId));

  if (!theme.length) {
    throw new Error("Theme not found");
  }

  const communityId = theme[0].communityId;

  await verifyCommunityOwnership(communityId, userId);

  await db.delete(themes).where(eq(themes.id, themeId));

  return { success: true };
}