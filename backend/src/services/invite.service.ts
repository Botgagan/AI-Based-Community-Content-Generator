import { db } from "../index.js";
import { invites } from "../db/invites.schema";
import { communityMembers } from "../db/communityMembers.schema";
import { users } from "../db/users.schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { randomUUID } from "crypto";
import { sendInviteEmail } from "../services/emailInvite.service";

/* ================= SEND INVITE ================= */

export async function sendInvite(
  communityId: string,
  email: string,
  senderUserId: string
) {
  if (!communityId || !email)
    throw new Error("Missing fields");

  const token = crypto.randomBytes(32).toString("hex");

  /* 1️⃣ CHECK IF EMAIL BELONGS TO EXISTING USER */

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  /* 2️⃣ IF USER EXISTS → CHECK MEMBERSHIP */

  if (existingUser.length) {
    const member = await db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.communityId, communityId),
          eq(communityMembers.userId, existingUser[0].id)
        )
      );

    if (member.length) {
      throw new Error("User already in community");
    }
  }

  /* 3️⃣ CHECK IF INVITE ALREADY SENT */

  const alreadyInvited = await db
    .select()
    .from(invites)
    .where(
      and(
        eq(invites.communityId, communityId),
        eq(invites.email, email),
        eq(invites.status, "pending")
      )
    );

  if (alreadyInvited.length)
    throw new Error("Invite already sent");

  /* 4️⃣ CREATE INVITE */

  await db.insert(invites).values({
    id: randomUUID(),
    communityId,
    email,
    token,
    status: "pending",
  });

  /* 5️⃣ SEND EMAIL */

  const inviteLink = `${process.env.FRONTEND_URL}/invite/${token}`;

  await sendInviteEmail(email, inviteLink);

  return { success: true };
}

/* ================= VALIDATE INVITE ================= */

export async function validateInvite(token: string) {
  const record = await db
    .select()
    .from(invites)
    .where(eq(invites.token, token));

  if (!record.length) throw new Error("Invalid invite");

  if (record[0].status === "accepted")
    throw new Error("Invite already used");

  return record[0];
}

/* ================= ACCEPT INVITE ================= */

export async function acceptInvite(token: string, userId: string) {
  const invite = await validateInvite(token);

  /* CHECK IF USER ALREADY MEMBER */

  const existing = await db
    .select()
    .from(communityMembers)
    .where(
      and(
        eq(communityMembers.communityId, invite.communityId),
        eq(communityMembers.userId, userId)
      )
    );

  if (!existing.length) {
    await db.insert(communityMembers).values({
      id: randomUUID(),
      communityId: invite.communityId,
      userId,
      role: "member",
    });
  }

  /* MARK INVITE USED */

  await db
    .update(invites)
    .set({ status: "accepted" })
    .where(eq(invites.id, invite.id));

  return invite.communityId;
}