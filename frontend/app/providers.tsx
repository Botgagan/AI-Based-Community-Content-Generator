"use client";

import { SuperTokensWrapper } from "supertokens-auth-react";
import { initSuperTokens } from "@/lib/supertokens";
import { UIProvider } from "@/components/UIProvider";

/* initialize immediately */
initSuperTokens();

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SuperTokensWrapper>
      <UIProvider>{children}</UIProvider>
    </SuperTokensWrapper>
  );
}

