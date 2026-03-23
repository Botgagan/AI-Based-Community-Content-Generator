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
    <aside className="hidden h-full w-64 border-r border-[#e5e7eb] bg-[#ffffff]/80 backdrop-blur md:flex md:flex-col md:min-h-0">
      <div className="border-b border-[#e5e7eb] p-4">
        <h2 className="text-lg font-semibold text-[#1f2937]">Communities</h2>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {communities.map((c) => (
          <button
            key={c.id}
            onClick={() => router.push(`/community/${c.id}`)}
            className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
              pathname === `/community/${c.id}`
                ? "border-[#c7d2fe] bg-[#e8edff] text-[#4f5fcf]"
                : "border-transparent text-[#4b5563] hover:border-[#e5e7eb] hover:bg-[#eef2ff]"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
    </aside>
  );
}

