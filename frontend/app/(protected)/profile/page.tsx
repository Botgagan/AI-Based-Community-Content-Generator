"use client";

import { useEffect, useMemo, useState } from "react";
import { url } from "@/lib/axiosInstance";

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
    return (
      <div className="min-h-screen flex items-center justify-center text-[#6b7280]">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-gradient px-4 py-10 sm:px-6 md:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="panel overflow-hidden rounded-3xl p-0">
          <div className="bg-gradient-to-r from-[#e0e7ff] via-[#dbeafe] to-[#ecfeff] px-6 py-8 sm:px-10">
            <h1 className="text-xl font-semibold text-[#1f2937] sm:text-2xl">Your Profile</h1>
            <p className="mt-1 text-sm text-[#4b5563]">Account details linked to your login.</p>
          </div>

          <div className="space-y-8 p-6 sm:p-10">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white text-3xl font-semibold text-[#4b5563] shadow">
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
              <p className="text-2xl font-semibold text-[#111827]">Hi, {firstName}</p>
              <p className="mt-1 text-sm text-[#6b7280]">{profile?.email || "No email available"}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[#e5e7eb] bg-white/70 p-4">
                <p className="text-xs uppercase tracking-wide text-[#6b7280]">Full Name</p>
                <p className="mt-1 text-sm font-medium text-[#111827]">{displayFullName}</p>
              </div>
              <div className="rounded-xl border border-[#e5e7eb] bg-white/70 p-4">
                <p className="text-xs uppercase tracking-wide text-[#6b7280]">Phone</p>
                <p className="mt-1 text-sm font-medium text-[#111827]">{profile?.phone || "-"}</p>
              </div>
              <div className="rounded-xl border border-[#e5e7eb] bg-white/70 p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-[#6b7280]">Email</p>
                <p className="mt-1 break-all text-sm font-medium text-[#111827]">{profile?.email || "-"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
