"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Session from "supertokens-auth-react/recipe/session";
import { ThirdPartyPreBuiltUI } from "supertokens-auth-react/recipe/thirdparty/prebuiltui";
import { PasswordlessPreBuiltUI } from "supertokens-auth-react/recipe/passwordless/prebuiltui";
import { canHandleRoute, getRoutingComponent } from "supertokens-auth-react/ui";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const exists = await Session.doesSessionExist();

        if (exists) {
          const redirectTo = searchParams.get("redirectTo");

          if (redirectTo) {
            router.replace(redirectTo);
          } else {
            router.replace("/dashboard");
          }

          return;
        }

        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };

    checkSession();
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (canHandleRoute([ThirdPartyPreBuiltUI, PasswordlessPreBuiltUI])) {
    return getRoutingComponent([
      ThirdPartyPreBuiltUI,
      PasswordlessPreBuiltUI,
    ]);
  }

  return null;
}


