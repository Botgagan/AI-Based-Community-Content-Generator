import { Request, Response } from "express";
import type { SessionRequest } from "supertokens-node/framework/express";
import {
  sendInvite,
  acceptInvite,
  validateInvite,
} from "../services/invite.service.js";
import { getPrimaryUserId } from "../utils/getPrimaryUserId.js";

/* SEND */
export async function sendInviteController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = await getPrimaryUserId(req);
    const { communityId, email } = req.body;

    if (!communityId || !email)
      return res.status(400).json({ message: "Missing fields" });

    const result = await sendInvite(communityId, email, userId);

    res.json(result);
  } catch (err: any) {
    console.error("INVITE ERROR:", err.message);
    res.status(400).json({ message: err.message });
  }
}

/* VALIDATE */
export async function validateInviteController(
  req: Request,
  res: Response
) {
  try {
    const { token } = req.params;
    await validateInvite(token);
    res.json({ valid: true });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

/* ACCEPT */
export async function acceptInviteController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = await getPrimaryUserId(req);
    const { token } = req.params;

    const communityId = await acceptInvite(token, userId);

    res.json({ success: true, communityId });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}