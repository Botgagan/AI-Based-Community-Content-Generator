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
        const payload = req.session.getAccessTokenPayload();

        await saveUserToDB({
          id: userId,
          email: payload.email,
          phone: payload.phone_number,
          name: payload.name,
          avatarUrl: payload.picture,
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}