import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const communities = pgTable("communities", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: text("name").notNull(),
  description: text("description").notNull(),

  websiteUrl: text("website_url"),
  youtubeUrl: text("youtube_url"),
  twitterUrl: text("twitter_url"),

  imageUrl: text("image_url"),

  createdAt: timestamp("created_at").defaultNow(),
});