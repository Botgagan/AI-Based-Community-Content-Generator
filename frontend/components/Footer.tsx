"use client";

import Image from "next/image";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-black/10 bg-[#f5f5f7] text-[rgba(0,0,0,0.8)]">
      <div className="mx-auto max-w-[980px] px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3 text-center md:text-left">
            <div className="relative h-10 w-10">
              <Image src="/logo.png" alt="Hind Social Logo" fill className="object-contain" />
            </div>

            <div>
              <p className="text-base font-semibold text-[#1d1d1f]">Hind Social</p>
              <p className="text-xs text-[rgba(0,0,0,0.48)]">AI Powered Community Platform</p>
            </div>
          </div>

          <div className="text-center text-sm">Copyright {year} Hind Social. All rights reserved.</div>

          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a href="#" className="text-[#0066cc]">Privacy</a>
            <a href="#" className="text-[#0066cc]">Terms</a>
            <a href="#" className="text-[#0066cc]">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}