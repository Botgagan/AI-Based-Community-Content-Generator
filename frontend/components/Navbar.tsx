"use client";

import Session from "supertokens-auth-react/recipe/session";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navLinks = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "History", href: "/history" },
  ];

  const handleLogout = async () => {
    await Session.signOut();
    window.location.href = "/auth";
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
          <button onClick={handleLogout} className="btn-primary hidden px-4 py-2 text-sm md:block">
            Logout
          </button>

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

            <button onClick={handleLogout} className="btn-primary w-full py-2 text-sm">
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

