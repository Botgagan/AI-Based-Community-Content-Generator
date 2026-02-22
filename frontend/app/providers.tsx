"use client";

import { SuperTokensWrapper } from "supertokens-auth-react";
import { initSuperTokens } from "@/lib/supertokens";

/* initialize immediately */
initSuperTokens();

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SuperTokensWrapper>{children}</SuperTokensWrapper>;
}

