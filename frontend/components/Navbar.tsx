"use client";

import Session from "supertokens-auth-react/recipe/session";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const navLinks = [
    { name: "Dashboard", href: "/dashboard" },// we provided dashboard page with communities card.
    { name: "Communities", href: "/communities" },// can provide communities list in this page if we want.
    { name: "History", href: "/history" },// we provided history page will posts
  ];

   const handleLogout = async () => {
  await Session.signOut();
  window.location.href = "/auth";
};


  return (
    <nav className="bg-[#0B1120] border-b border-gray-800 sticky top-0 z-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">

        {/* LOGO */}
        <Link href="/dashboard">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-11 h-11 relative">
              <img src="/logo.png" alt="logo" className="w-11 h-11 object-contain" />
            </div>

            <span className="text-gray-100 font-semibold text-xl md:text-2xl">Hind Social</span>
          </div>
        </Link>

        {/* DESKTOP LINKS */}
        <div className="hidden md:flex gap-8 text-gray-400 text-sm">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <span className={`transition cursor-pointer ${pathname === link.href ? "text-white font-medium" : "hover:text-white"}`}>
                {link.name}
              </span>
            </Link>
          ))}
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3">

          {/* LOGOUT BUTTON */}
          <button onClick={handleLogout} className="hidden md:block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            Logout
          </button>

          {/* MOBILE MENU BUTTON */}
          <button onClick={() => setOpen(!open)} className="md:hidden text-gray-300 text-xl">☰</button>
        </div>
      </div>

      {/* MOBILE DROPDOWN */}
      {open && (
        <div className="md:hidden bg-[#0F172A] border-t border-gray-800 px-6 py-6 space-y-4">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <div onClick={() => setOpen(false)} className={`text-sm ${pathname === link.href ? "text-white font-medium" : "text-gray-400"}`}>
                {link.name}
              </div>
            </Link>
          ))}

          <button className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium">Logout</button>
        </div>
      )}
    </nav>
  );
}



