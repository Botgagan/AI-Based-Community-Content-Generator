"use client";

import Image from "next/image";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-[#e5e7eb] bg-[#ffffff] text-[#6b7280]">
      <div className="pointer-events-none absolute left-[-150px] top-[-200px] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#c7d2fe]/30 to-[#93c5fd]/18" />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex items-center gap-3 text-center md:text-left">
            <div className="relative h-12 w-12">
              <Image src="/logo.png" alt="Hind Social Logo" fill className="object-contain" />
            </div>

            <div>
              <p className="text-lg font-semibold text-[#111827]">Hind Social</p>
              <p className="text-xs text-[#9ca3af]">AI Powered Community Platform</p>
            </div>
          </div>

          <div className="text-center text-sm">Copyright {year} Hind Social. All rights reserved.</div>

          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <a href="#" className="transition hover:text-[#111827]">Privacy</a>
            <a href="#" className="transition hover:text-[#111827]">Terms</a>
            <a href="#" className="transition hover:text-[#111827]">Support</a>
          </div>
        </div>

        <div className="mt-10 h-px bg-gradient-to-r from-transparent via-[#dbe3ff] to-transparent" />
      </div>
    </footer>
  );
}


