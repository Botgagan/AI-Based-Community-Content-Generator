"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Session from "supertokens-auth-react/recipe/session";

export default function AuthLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    Session.doesSessionExist().then((exists) => {
      if (exists) router.replace("/dashboard");
    });
  }, []);

  return children;
}


