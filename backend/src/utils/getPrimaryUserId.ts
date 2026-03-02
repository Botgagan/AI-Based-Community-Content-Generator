import type { SessionRequest } from "supertokens-node/framework/express";

/**
 * Returns the primary user id.
 * This ensures same user across Google + Passwordless logins.
 */
export async function getPrimaryUserId(req: SessionRequest): Promise<string> {
  const userId = req.session!.getUserId();

  // SuperTokens may return linked accounts info
  const recipeUserId = req.session!.getRecipeUserId();

  // If accounts linked → use primary user id
  if (recipeUserId?.getAsString) {
    return recipeUserId.getAsString();
  }

  return userId;
}