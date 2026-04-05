"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Session from "supertokens-auth-react/recipe/session";
import { ThirdPartyPreBuiltUI } from "supertokens-auth-react/recipe/thirdparty/prebuiltui";
import { PasswordlessPreBuiltUI } from "supertokens-auth-react/recipe/passwordless/prebuiltui";
import { canHandleRoute, getRoutingComponent } from "supertokens-auth-react/ui";
import { initSuperTokens } from "@/lib/supertokens";

initSuperTokens();

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let redirected = false;

    const checkSession = async () => {
      if (cancelled || redirected) return;

      try {
        const exists = await Session.doesSessionExist();
        if (cancelled || redirected) return;

        if (exists) {
          redirected = true;
          const redirectTo = searchParams.get("redirectTo");

          if (redirectTo) {
            router.replace(redirectTo);
          } else {
            router.replace("/dashboard");
          }

          return;
        }

        setLoading(false);
      } catch {
        if (!cancelled) setLoading(false);
      }
    };

    checkSession();

    // Keep checking while auth UI is open; this catches post-login session creation.
    const intervalId = window.setInterval(checkSession, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="bg-app-gradient flex min-h-screen items-center justify-center text-[#6b7280]">
        Loading...
      </div>
    );
  }

  if (canHandleRoute([ThirdPartyPreBuiltUI, PasswordlessPreBuiltUI])) {
    return (
      <div className="bg-app-gradient flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{getRoutingComponent([ThirdPartyPreBuiltUI, PasswordlessPreBuiltUI])}</div>
      </div>
    );
  }

  return null;
}


