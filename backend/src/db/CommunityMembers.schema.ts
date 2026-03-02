import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { communities } from "./community.schema";
import { users } from "./users.schema";

export const communityMembers = pgTable("community_members", {
  id: uuid("id").defaultRandom().primaryKey(),

  communityId: uuid("community_id")
    .notNull()
    .references(() => communities.id, { onDelete: "cascade" }),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  role: text("role").notNull().default("member"),
  // owner | member
});