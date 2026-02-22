"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Session from "supertokens-auth-react/recipe/session";
import { ThirdPartyPreBuiltUI } from "supertokens-auth-react/recipe/thirdparty/prebuiltui";
import { PasswordlessPreBuiltUI } from "supertokens-auth-react/recipe/passwordless/prebuiltui";
import { canHandleRoute, getRoutingComponent } from "supertokens-auth-react/ui";

export default function AuthPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const exists = await Session.doesSessionExist();
        if (exists) {
          setIsLoggedIn(true);
          // Give a small delay to ensure session is fully established
          setTimeout(() => router.replace("/dashboard"), 100);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setLoading(false);
      }
    };

    checkSession();
  }, [router]);

  // If user is logging in or already logged in, show loading
  if (isLoggedIn || loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (canHandleRoute([ThirdPartyPreBuiltUI, PasswordlessPreBuiltUI])) {
    return getRoutingComponent([ThirdPartyPreBuiltUI, PasswordlessPreBuiltUI]);
  }

  return null;
}


