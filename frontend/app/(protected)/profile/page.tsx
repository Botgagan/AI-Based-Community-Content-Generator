"use client";

import { useEffect, useMemo, useState } from "react";
import { url } from "@/lib/axiosInstance";
import PageLoader from "@/components/PageLoader";

type UserProfile = {
  id: string;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  createdAt?: string | null;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarBroken, setAvatarBroken] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await url.get("/api/user/me");
        const user = (res.data.user || null) as UserProfile | null;
        if (!user) {
          setProfile(null);
          return;
        }

        setProfile({
          ...user,
          avatarUrl: user.avatarUrl || user.avatar_url || null,
        });
        setAvatarBroken(false);
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const initials = useMemo(() => {
    const source = profile?.name?.trim() || profile?.email?.trim() || "U";
    const first = source.charAt(0).toUpperCase();
    const second = source.includes(" ")
      ? source.split(" ").filter(Boolean)[1]?.charAt(0).toUpperCase() || ""
      : "";
    return `${first}${second}`;
  }, [profile?.email, profile?.name]);

  const firstName = useMemo(() => {
    const name = profile?.name?.trim();
    if (name && name.length > 0) {
      return name.split(" ").filter(Boolean)[0];
    }

    const email = profile?.email?.trim();
    if (email && email.length > 0) {
      return email.split("@")[0];
    }

    return "there";
  }, [profile?.email, profile?.name]);

  const displayFullName = useMemo(() => {
    const value = profile?.name?.trim();
    return value && value.length > 0 ? value : "Not available";
  }, [profile?.name]);

  if (loading) {
    return <PageLoader label="Loading profile..." />;
  }

  return (
    <div className="px-1 py-2">
      <div className="mx-auto max-w-5xl">
        <div className="panel overflow-hidden">
          <div className="bg-[linear-gradient(120deg,#f2f6ff,#eef2ff)] px-6 py-8 sm:px-10">
            <p className="text-xs uppercase tracking-[0.14em] text-[rgba(0,0,0,0.8)]">Account</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] text-[#1d1d1f]">Your Profile</h1>
            <p className="mt-1 text-sm text-[rgba(0,0,0,0.8)]">Account details linked to your sign-in method.</p>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-[280px_1fr] sm:p-10">
            <div className="panel flex h-fit flex-col items-center rounded-2xl p-5 text-center">
              <div className="mb-4 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white text-3xl font-bold text-[#4b5563] shadow">
                  {profile?.avatarUrl && !avatarBroken ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatarUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                      onError={() => setAvatarBroken(true)}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
              </div>
              <p className="text-2xl font-bold tracking-[-0.02em] text-[#1d1d1f]">Hi, {firstName}</p>
              <p className="mt-1 text-sm text-[rgba(0,0,0,0.8)]">{profile?.email || "No email available"}</p>
              <div className="mt-4 w-full rounded-xl bg-[#eef3ff] p-3 text-left text-xs text-[#344054]">
                <p className="font-semibold">Workspace Access</p>
                <p className="mt-1">Member account active</p>
                <p className="mt-1">Community creation enabled</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[8px] border border-white/60 bg-[#f5f5f7] p-4">
                <p className="text-xs uppercase tracking-wide text-[rgba(0,0,0,0.8)]">Full Name</p>
                <p className="mt-1 text-sm font-semibold text-[#1d1d1f]">{displayFullName}</p>
              </div>
              <div className="rounded-[8px] border border-white/60 bg-[#f5f5f7] p-4">
                <p className="text-xs uppercase tracking-wide text-[rgba(0,0,0,0.8)]">Phone</p>
                <p className="mt-1 text-sm font-semibold text-[#1d1d1f]">{profile?.phone || "-"}</p>
              </div>
              <div className="rounded-[8px] border border-white/60 bg-[#f5f5f7] p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-[rgba(0,0,0,0.8)]">Email</p>
                <p className="mt-1 break-all text-sm font-semibold text-[#1d1d1f]">{profile?.email || "-"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


