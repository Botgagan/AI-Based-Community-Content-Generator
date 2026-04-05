import { verifySession as supertokensVerifySession } from "supertokens-node/recipe/session/framework/express";
import type { Request, Response, NextFunction } from "express";
import { saveUserToDB } from "../services/user.service.js";

/**
 * Production-grade auth middleware
 *
 * 1. Verifies SuperTokens session
 * 2. Ensures user exists in local DB
 * 3. Keeps DB and session always in sync
 */

export function verifySession() {
  const sessionMiddleware = supertokensVerifySession();

  return async (req: Request & any, res: Response, next: NextFunction) => {
    try {
      // 1️⃣ Verify session first
      await new Promise<void>((resolve, reject) => {
        sessionMiddleware(req, res, (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // 2️⃣ If session exists → sync user into DB
      if (req.session) {
        const userId = req.session.getUserId();
        const payload = req.session.getAccessTokenPayload() as Record<string, any>;

        const name =
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

        const avatarUrl =
          payload.picture ??
          payload.avatar_url ??
          payload.profile_picture ??
          payload.photoURL ??
          payload.user?.picture ??
          payload.user?.avatar_url ??
          payload.user_metadata?.picture;

        await saveUserToDB({
          id: userId,
          email: payload.email,
          phone: payload.phone_number,
          name,
          avatarUrl,
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
