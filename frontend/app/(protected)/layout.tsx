"use client";

import { SessionAuth } from "supertokens-auth-react/recipe/session";
import NavbarComponent from "@/components/Navbar";
import FooterComponent from "@/components/Footer";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionAuth requireAuth={true}>
      <div className="flex flex-col min-h-screen">
        <NavbarComponent />
        <main className="flex-grow">{children}</main>
        <FooterComponent />
      </div>
    </SessionAuth>
  );
}



