"use client";

import { SessionAuth } from "supertokens-auth-react/recipe/session";
import NavbarComponent from "@/components/Navbar";
import FooterComponent from "@/components/Footer";
import Sidebar from "@/components/Sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionAuth requireAuth>
      <div className="min-h-screen flex flex-col bg-[#0B1120]">

        <NavbarComponent />

        <div className="flex flex-1">

          {/* Sidebar */}
          <Sidebar />

          {/* Page Content */}
          <main className="flex-1 p-6 overflow-y-auto">
            {children}
          </main>

        </div>

        <FooterComponent />

      </div>
    </SessionAuth>
  );
}



