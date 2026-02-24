import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { communities } from "./community.schema.js";

export const themes = pgTable(
  "themes",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    communityId: uuid("community_id")//foreign key coming from communities table.
      .notNull()
      .references(() => communities.id, {
        onDelete: "cascade",// this means that if a community is deleted then all the themes associated with that community will also be deleted.
      }),

    title: text("title").notNull(),
    description: text("description").notNull(),

    imageUrl: text("image_url"),

    source: text("source").notNull().default("ai"),
    // "ai" or "custom"

    createdAt: timestamp("created_at").defaultNow(),
  });