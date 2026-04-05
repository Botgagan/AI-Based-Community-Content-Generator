import type { SessionRequest } from "supertokens-node/framework/express";

/**
 * Returns the primary user id from the session.
 */
export async function getPrimaryUserId(req: SessionRequest): Promise<string> {
  return req.session!.getUserId();
}
