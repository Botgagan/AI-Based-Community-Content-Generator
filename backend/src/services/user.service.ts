import { db } from "../index.js";
import { users } from "../db/users.schema.js";
import { eq } from "drizzle-orm";

export async function saveUserToDB(data: {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  avatarUrl?: string;
}) {
  // Check if user already exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, data.id));

  if (existing.length > 0) {
    return; // already exists → do nothing
  }

  // Insert safely (only non-undefined values)
  await db.insert(users).values({
    id: data.id,
    email: data.email ?? null,
    phone: data.phone ?? null,
    name: data.name ?? null,
    avatarUrl: data.avatarUrl ?? null,
  });
}