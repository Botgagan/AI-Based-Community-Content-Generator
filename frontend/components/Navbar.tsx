"use client";

import Session from "supertokens-auth-react/recipe/session";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { url } from "@/lib/axiosInstance";

type UserProfile = {
  id: string;
  email?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  avatar_url?: string | null;
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatarBroken, setAvatarBroken] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
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
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const initials = useMemo(() => {
    const source = profile?.name?.trim() || profile?.email?.trim() || "U";
    const first = source.charAt(0).toUpperCase();
    const second = source.includes(" ")
      ? source.split(" ").filter(Boolean)[1]?.charAt(0).toUpperCase() || ""
      : "";
    return `${first}${second}`;
  }, [profile?.email, profile?.name]);
  const topLinks = useMemo(
    () => [
      { label: "Dashboard", href: "/dashboard" },
      { label: "History", href: "/history" },
    ],
    []
  );

  const handleLogout = async () => {
    await Session.signOut();
    router.replace("/auth");
  };

  return (
    <header className="relative z-40 overflow-visible rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Hind Social" width={42} height={42} className="rounded-md border border-[#e5e7eb] p-1" />
          <span className="text-2xl font-extrabold tracking-tight text-[#101828] sm:text-3xl">Hind Social</span>
        </Link>

        <nav className="mx-auto flex items-center gap-2 overflow-x-auto">
          {topLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-xl border px-3 py-1.5 text-sm font-semibold transition ${
                  active
                    ? "border-[#c7d2fe] bg-[#eef2ff] text-[#24358f]"
                    : "border-transparent text-[#475467] hover:border-[#dbe4ff] hover:bg-[#f8faff]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#d0d5dd] bg-[#111827] text-xs font-bold text-white"
              aria-label="Profile menu"
            >
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
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-[80] w-52 rounded-xl border border-[#e5e7eb] bg-white p-1.5 shadow-[0_20px_48px_rgba(15,23,42,0.14)]">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    router.push("/profile");
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#101828] hover:bg-[#f2f5ff]"
                >
                  View Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#2c43b7] hover:bg-[#eef2ff]"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

