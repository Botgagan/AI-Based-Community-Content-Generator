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
  inviterId: string
) {
  const token = crypto.randomBytes(32).toString("hex");

  /* verify inviter is member */
  const inviter = await db
    .select()
    .from(communityMembers)
    .where(
      and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.userId, inviterId)
      )
    );

  if (!inviter.length)
    throw new Error("Not authorized to invite");

  await db.insert(invites).values({
    id: randomUUID(),
    communityId,
    email,
    token,
    status: "pending",
  });

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