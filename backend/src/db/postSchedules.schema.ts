import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { posts } from "./posts.schema.js";
import { users } from "./users.schema.js";

export const postSchedules = pgTable(
  "post_schedules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    platform: text("platform").notNull().default("facebook"),
    targetType: text("target_type").notNull().default("profile_dialog"),
    status: text("status").notNull().default("scheduled"),
    scheduledAt: timestamp("scheduled_at").notNull(),
    userTimezone: text("user_timezone").notNull().default("UTC"),
    facebookShareUrl: text("facebook_share_url"),
    errorMessage: text("error_message"),
    processedAt: timestamp("processed_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    postIdx: index("post_schedules_post_id_idx").on(table.postId),
    statusTimeIdx: index("post_schedules_status_scheduled_at_idx").on(
      table.status,
      table.scheduledAt
    ),
  })
);

