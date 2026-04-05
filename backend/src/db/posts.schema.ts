import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { themes } from "./themes.schema";

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),

  themeId: uuid("theme_id")
    .notNull()
    .references(() => themes.id, { onDelete: "cascade" }),

  title: text("title").notNull(),
  content: text("content").notNull(),

  imageUrl: text("image_url"),

  status: text("status").notNull().default("pending"),
  // "pending" | "approved" | "rejected"

  rejectionReason: text("rejection_reason"),

  isPolished: boolean("is_polished").default(false),

  createdAt: timestamp("created_at").defaultNow(),
});
