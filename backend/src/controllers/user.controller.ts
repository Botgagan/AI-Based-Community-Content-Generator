import { Request, Response } from "express";
import type { SessionRequest } from "supertokens-node/framework/express";
import { getPrimaryUserId } from "../utils/getPrimaryUserId.js";
import { getUserById, saveUserToDB } from "../services/user.service.js";

export async function getMeController(
  req: Request & SessionRequest,
  res: Response
) {
  try {
    const userId = await getPrimaryUserId(req);
    const payload = req.session!.getAccessTokenPayload() as Record<string, any>;

    const payloadName =
      payload.name ??
      payload.full_name ??
      payload.displayName ??
      payload.given_name ??
      (payload.given_name && payload.family_name
        ? `${payload.given_name} ${payload.family_name}`
        : undefined) ??
      payload.first_name ??
      payload.user?.name ??
      payload.user?.full_name ??
      payload.user?.displayName ??
      payload.user_metadata?.name;

    const payloadAvatarUrl =
      payload.picture ??
      payload.avatar_url ??
      payload.profile_picture ??
      payload.photoURL ??
      payload.user?.picture ??
      payload.user?.avatar_url ??
      payload.user_metadata?.picture;

    // Keep DB in sync with latest session payload (Google, etc.).
    await saveUserToDB({
      id: userId,
      email: payload.email,
      phone: payload.phone_number,
      name: payloadName,
      avatarUrl: payloadAvatarUrl,
    });

    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      user: {
        ...user,
        name: user.name || payloadName || null,
        avatarUrl: user.avatarUrl || payloadAvatarUrl || null,
        email: user.email || payload.email || null,
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to fetch profile" });
  }
}
