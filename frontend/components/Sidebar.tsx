"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { url } from "@/lib/axiosInstance";

type SidebarCommunity = {
  id: string;
  name: string;
};

export default function Sidebar() {
  const [communities, setCommunities] = useState<SidebarCommunity[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await url.get(`/api/community/list?all=true`);
        setCommunities(res.data.communities || []);
      } catch (err) {
        console.error(err);
      }
    };

    const reloadCommunities = () => load();

    load();
    window.addEventListener("community:created", reloadCommunities);
    window.addEventListener("community:changed", reloadCommunities);

    return () => {
      window.removeEventListener("community:created", reloadCommunities);
      window.removeEventListener("community:changed", reloadCommunities);
    };
  }, []);

  return (
    <aside className="hidden h-[calc(100vh-126px)] overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white md:flex md:flex-col">
      <div className="flex min-h-0 flex-1 flex-col p-3">
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#6b7280]">Communities</p>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {communities.map((community) => {
            const active = pathname === `/community/${community.id}` || pathname.startsWith(`/community/${community.id}/`);
            return (
              <button
                key={community.id}
                onClick={() => router.push(`/community/${community.id}`)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition ${
                  active
                    ? "border-[#cdd9ff] bg-[#dbe7fa] text-[#111827]"
                    : "border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb]"
                }`}
              >
                <span className="block truncate">{community.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
