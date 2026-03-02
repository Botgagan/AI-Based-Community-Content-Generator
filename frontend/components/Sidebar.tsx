"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { url } from "@/lib/axiosInstance";

export default function Sidebar() {
  const [communities, setCommunities] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await url.get("/api/community/list");
        setCommunities(res.data.communities || []);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  return (
    <aside className="w-64 bg-[#111827] border-r border-gray-800 hidden md:block">

      <div className="p-4 border-b border-gray-800">
        <h2 className="text-white font-semibold text-lg">
          Communities
        </h2>
      </div>

      <div className="p-3 space-y-2">
        {communities.map((c) => (
          <button
            key={c.id}
            onClick={() => router.push(`/community/${c.id}`)}
            className="w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800"
          >
            {c.name}
          </button>
        ))}
      </div>
    </aside>
  );
}