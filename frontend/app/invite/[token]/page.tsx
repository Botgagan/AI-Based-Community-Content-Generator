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
    const handleInvite = async () => {
      try {
        // Validate invite first
        await url.get(`/api/invite/validate/${token}`);

        const hasSession = await Session.doesSessionExist();

        if (!hasSession) {
          // redirect to auth with return path
          router.push(`/auth?redirectTo=/invite/${token}`);
          return;
        }

        // Accept invite
        const res = await url.post(`/api/invite/accept/${token}`);
        router.push(`/community/${res.data.communityId}`);
      } catch (err: any) {
        alert(err.response?.data?.message || "Invalid invite");
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    handleInvite();
  }, []);

  return (
    <div className="text-white p-10">
      {loading ? "Processing invite..." : ""}
    </div>
  );
}