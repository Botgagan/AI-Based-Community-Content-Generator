import { verifySession as supertokensVerifySession } from "supertokens-node/recipe/session/framework/express";

export function verifySession() {
  return supertokensVerifySession();
}