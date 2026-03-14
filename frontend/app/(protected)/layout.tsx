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
      <div className="h-screen flex flex-col bg-[#0B1120]">

        {/* Navbar */}
        <NavbarComponent />

        {/* Main area */}
        <div className="flex flex-1 overflow-hidden">

          {/* Sidebar */}
          <aside className="w-64 border-r border-gray-800 overflow-y-auto">
            <Sidebar />
          </aside>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>

        </div>

        {/* Footer */}
       {/* <FooterComponent />*/}

      </div>
    </SessionAuth>
  );
}



