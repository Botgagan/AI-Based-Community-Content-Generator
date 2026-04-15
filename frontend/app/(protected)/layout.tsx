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
      <div className="app-shell">
        <NavbarComponent />
        <section className="app-body">
          <Sidebar />
          <main className="app-content">{children}</main>
        </section>
      </div>
    </SessionAuth>
  );
}
