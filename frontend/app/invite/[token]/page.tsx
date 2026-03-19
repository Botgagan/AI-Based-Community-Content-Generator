"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { url } from "@/lib/axiosInstance";
import Session from "supertokens-auth-react/recipe/session";

export default function InvitePage() {
  const { token } = useParams() as { token: string };
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const processInvite = async () => {
      try {
        // Step 1: Validate invite
        await url.get(`/api/invite/validate/${token}`);// /api/invite is a base route defined in the backend, and /validate/:token is the endpoint to validate the invite token. This step ensures that the token is valid before proceeding.

        // Step 2: Check session
        const hasSession = await Session.doesSessionExist();

        if (!hasSession) {
          // Force login
          router.replace(`/auth?redirectTo=/invite/${token}`);//
          return;
        }

        // Step 3: Accept invite
        const res = await url.post(`/api/invite/accept/${token}`);

        // Step 4: Redirect to community
        router.replace(`/community/${res.data.communityId}`);
      } catch (err: unknown) {
        const message =
          typeof err === "object" &&
          err !== null &&
          "response" in err &&
          (err as { response?: { data?: { message?: string } } }).response?.data?.message
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : "Invalid invite";

        alert(message);
        router.replace("/");
      } finally {
        setLoading(false);
      }
    };

    processInvite();
  }, [token, router]);

  return (
    <div className="bg-app-gradient min-h-screen flex items-center justify-center text-[#6b7280]">
      {loading ? "Processing invite..." : null}
    </div>
  );
}


