import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { communities } from "./community.schema";

export const invites = pgTable("invites", {
  id: uuid("id").defaultRandom().primaryKey(),

  communityId: uuid("community_id")
    .notNull()
    .references(() => communities.id, { onDelete: "cascade" }),

  email: text("email").notNull(),

  token: text("token").notNull().unique(),

  status: text("status").notNull().default("pending"),
  // pending | accepted | expired

  createdAt: timestamp("created_at").defaultNow(),
});