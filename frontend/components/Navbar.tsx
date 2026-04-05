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

  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatarBroken, setAvatarBroken] = useState(false);

  const navLinks = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "History", href: "/history" },
  ];

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

  const handleLogout = async () => {
    await Session.signOut();
    router.replace("/auth");
  };

  const goToProfile = () => {
    setProfileOpen(false);
    setOpen(false);
    router.push("/profile");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-[#e5e7eb] bg-[#ffffff]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/dashboard" onClick={() => setOpen(false)}>
          <div className="flex cursor-pointer items-center gap-3">
            <Image src="/logo.png" alt="logo" width={40} height={40} className="object-contain" />
            <span className="text-xl font-semibold text-[#111827] md:text-2xl">Hind Social</span>
          </div>
        </Link>

        <div className="hidden items-center gap-8 text-sm md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <span
                className={`rounded-lg px-3 py-1.5 transition ${
                  pathname === link.href
                    ? "bg-[#e8edff] text-[#4f5fcf] font-semibold"
                    : "text-[#6b7280] hover:bg-[#eef2ff] hover:text-[#111827]"
                }`}
              >
                {link.name}
              </span>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#d1d5db] bg-white text-sm font-semibold text-[#4b5563]"
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
              <div className="absolute right-0 mt-2 w-44 rounded-xl border border-[#e5e7eb] bg-white p-1 shadow-md">
                <button
                  onClick={goToProfile}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-[#374151] hover:bg-[#f3f4f6]"
                >
                  View Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          <button onClick={() => setOpen((prev) => !prev)} className="text-xl text-[#6b7280] md:hidden">
            {open ? "x" : "="}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[#e5e7eb] bg-[#ffffff] px-6 py-5 md:hidden">
          <div className="space-y-4">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    pathname === link.href
                      ? "bg-[#e8edff] text-[#4f5fcf] font-semibold"
                      : "text-[#6b7280]"
                  }`}
                >
                  {link.name}
                </div>
              </Link>
            ))}

            <button onClick={goToProfile} className="btn-secondary w-full py-2 text-sm">
              View Profile
            </button>
            <button onClick={handleLogout} className="btn-primary w-full py-2 text-sm">
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
