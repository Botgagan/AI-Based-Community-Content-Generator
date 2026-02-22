"use client";

import Image from "next/image";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0B1120] border-t border-gray-800 text-gray-400 relative overflow-hidden">

      {/* glow */}
      <div className="pointer-events-none absolute w-[500px] h-[500px] bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full top-[-200px] left-[-150px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        <div className="flex flex-col md:flex-row justify-between items-center gap-8">

          {/* BRAND */}
          <div className="flex items-center gap-3 text-center md:text-left">
            <div className="w-12 h-12 relative">
              <Image src="/logo.png" alt="Hind Social Logo" fill className="object-contain" />
            </div>

            <div>
              <p className="text-white font-semibold text-lg">Hind Social</p>
              <p className="text-xs text-gray-500">AI Powered Community Platform</p>
            </div>
          </div>

          {/* COPYRIGHT */}
          <div className="text-sm text-center">© {year} Hind Social. All rights reserved.</div>

          {/* LINKS */}
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Terms</a>
            <a href="#" className="hover:text-white transition">Support</a>
          </div>

        </div>

        {/* DIVIDER */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mt-10" />

      </div>
    </footer>
  );
}





