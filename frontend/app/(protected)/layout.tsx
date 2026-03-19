"use client";

import { SessionAuth } from "supertokens-auth-react/recipe/session";
import NavbarComponent from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionAuth requireAuth>
      <div className="h-screen flex flex-col bg-app-gradient text-[#111827]">
        <NavbarComponent />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </SessionAuth>
  );
}


