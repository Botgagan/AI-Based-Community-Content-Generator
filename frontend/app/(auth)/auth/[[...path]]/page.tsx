"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Session from "supertokens-auth-react/recipe/session";
import { ThirdPartyPreBuiltUI } from "supertokens-auth-react/recipe/thirdparty/prebuiltui";
import { PasswordlessPreBuiltUI } from "supertokens-auth-react/recipe/passwordless/prebuiltui";
import { canHandleRoute, getRoutingComponent } from "supertokens-auth-react/ui";
import { initSuperTokens } from "@/lib/supertokens";
import PageLoader from "@/components/PageLoader";

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

    const intervalId = window.setInterval(checkSession, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [router, searchParams]);

  if (loading) {
    return <PageLoader label="Loading authentication..." />;
  }

  if (canHandleRoute([ThirdPartyPreBuiltUI, PasswordlessPreBuiltUI])) {
    return (
      <div className="grid min-h-screen items-center bg-[radial-gradient(circle_at_20%_0%,rgba(57,91,255,0.16),transparent_40%),linear-gradient(180deg,#f6f8ff,#edf2ff)] px-4 py-12 lg:grid-cols-2">
        <div className="mx-auto hidden max-w-md lg:block">
          <p className="text-xs uppercase tracking-[0.14em] text-[#667085]">Welcome</p>
          <h1 className="mt-2 font-bold text-5xl font-bold leading-tight text-[#101828]">
            AI Based Community Content Generator
          </h1>
          <p className="mt-4 text-base text-[#475467]">
            Sign in to generate community posts, review content, and manage your workflow from one place.
          </p>
        </div>

        <div className="mx-auto w-full max-w-md rounded-[20px] border border-[#dfe6ff] bg-transparent p-3 shadow-none">
          {getRoutingComponent([ThirdPartyPreBuiltUI, PasswordlessPreBuiltUI])}
        </div>
      </div>
    );
  }

  return null;
}


