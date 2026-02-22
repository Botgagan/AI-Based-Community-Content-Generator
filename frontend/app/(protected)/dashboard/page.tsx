"use client";

import { useEffect, useState } from "react";
import { useRouter} from "next/navigation";


type Community = {
  id: string;
  name: string;
  description: string;
};

export default function DashboardPage() {
  const router = useRouter();


  const [communities, setCommunities] = useState<Community[]>([]);

  
  useEffect(() => {
    
    // Load communities
    const stored = JSON.parse(localStorage.getItem("communities") || "[]");
    setCommunities(stored);
  }, []);

 

  const stats = [
    { label: "Total Communities", value: communities.length },
    { label: "AI Content Generated", value: "0" },
    { label: "Engagement Rate", value: "0%" },
  ];

  return (
    <div className="bg-[#0B1120] min-h-screen px-4 sm:px-6 py-10 md:py-12">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="mb-12 flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl text-white font-semibold">
              Your Communities
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Manage and generate AI-powered content
            </p>
          </div>

          <button
            onClick={() => router.push("/add-community")}
            className="bg-blue-600 px-6 py-3 rounded-lg text-white text-sm font-medium w-full md:w-auto"
          >
            Add New Community
          </button>
        </div>

        {/* EMPTY STATE */}
        {communities.length === 0 ? (
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-12 md:p-20 text-center">
            <h2 className="text-lg md:text-xl text-white font-semibold mb-2">
              Start building your community
            </h2>

            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Add your first community and generate AI-powered content.
            </p>

            <button
              onClick={() => router.push("/add-community")}
              className="bg-blue-600 px-8 py-3 rounded-lg text-white"
            >
              Add Your First Community
            </button>
          </div>
        ) : (
          <>
            {/* STATS */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-[#111827] border border-gray-800 rounded-xl p-6"
                >
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <p className="text-white text-2xl font-semibold mt-2">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* CARDS */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.map((community) => (
                <div
                  key={community.id}
                  className="bg-[#111827] border border-gray-800 rounded-xl p-6"
                >
                  <h2 className="text-white font-semibold text-lg">
                    {community.name}
                  </h2>

                  <p className="text-gray-400 text-sm mt-2">
                    {community.description}
                  </p>

                  <button
                    onClick={() =>
                      router.push(`/community/${community.id}`)
                    }
                    className="mt-5 w-full bg-blue-600 py-2 rounded-lg text-white"
                  >
                    Generate & View Posts
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
