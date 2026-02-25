import { db } from "../index.js";
import { users } from "../db/users.schema.js";

export async function saveUserToDB(data: {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  avatarUrl?: string;
}) {
  await db
    .insert(users)
    .values({
      id: data.id,
      email: data.email ?? null,
      phone: data.phone ?? null,
      name: data.name ?? null,
      avatarUrl: data.avatarUrl ?? null,
    })
    .onConflictDoNothing(); // prevents duplicate insert crash
}