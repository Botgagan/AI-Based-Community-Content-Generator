"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { url } from "@/lib/axiosInstance";
import Session from "supertokens-auth-react/recipe/session";
import { useUI } from "@/components/UIProvider";
import PageLoader from "@/components/PageLoader";

export default function InvitePage() {
  const { token } = useParams() as { token: string };
  const router = useRouter();
  const { toast, showLoader, hideLoader } = useUI();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const processInvite = async () => {
      showLoader();
      try {
        await url.get(`/api/invite/validate/${token}`);

        const hasSession = await Session.doesSessionExist();

        if (!hasSession) {
          router.replace(`/auth?redirectTo=/invite/${token}`);
          return;
        }

        const res = await url.post(`/api/invite/accept/${token}`);
        toast({ title: "Invite accepted", variant: "success" });
        router.replace(`/community/${res.data.communityId}`);
      } catch (err: unknown) {
        const message =
          typeof err === "object" &&
          err !== null &&
          "response" in err &&
          (err as { response?: { data?: { message?: string } } }).response?.data?.message
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : "Invalid invite";

        toast({ title: "Invite invalid", description: message, variant: "error" });
        router.replace("/");
      } finally {
        setLoading(false);
        hideLoader();
      }
    };

    processInvite();
  }, [token, router, toast, showLoader, hideLoader]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,rgba(57,91,255,0.14),transparent_42%),linear-gradient(180deg,#f6f8ff,#edf2ff)]">
      <PageLoader label={loading ? "Processing invite..." : "Redirecting..."} />
    </div>
  );
}

