"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { url } from "@/lib/axiosInstance";

type Community = {
  id: string;
  name: string;
  description: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  /* pagination */
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  /* ---------------- FETCH ---------------- */

  const fetchCommunities = async (page = 1) => {
    try {

      const res = await url.get(`/api/community/list?page=${page}`);

      const data = res.data.communities || [];

      setCommunities(data);
      setCurrentPage(page);

      setHasMore(data.length === 10);

    } catch (err: any) {

      if (err?.response?.status === 401) {
        router.push("/auth");
      }

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  /* ---------------- DELETE ---------------- */

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this community?")) return;

    try {
      await url.delete(`/api/community/${id}`);

      // remove from UI instantly
      setCommunities((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete community");
    }
  };

  /* ---------------- UI ---------------- */

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

        {/* LOADING */}
        {loading ? (
          <div className="text-center text-gray-400 py-20">
            Loading communities...
          </div>
        ) : communities.length === 0 ? (

          /* EMPTY STATE */
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

            {/* CARDS */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.map((community) => (
                <div
                  key={community.id}
                  className="relative bg-[#111827] border border-gray-800 rounded-xl p-6"
                >
                  {/* ACTION ICONS */}
                  <div className="absolute top-4 right-4 flex gap-3">

                    {/* EDIT */}
                    <button
                      onClick={() => router.push(`/edit-community/${community.id}`)}
                      className="text-gray-400 hover:text-yellow-400 transition"
                      title="Edit"
                    >
                      ✏️
                    </button>

                    {/* DELETE */}
                    <button
                      onClick={() => handleDelete(community.id)}
                      className="text-gray-400 hover:text-red-500 transition"
                      title="Delete"
                    >
                      🗑️
                    </button>

                  </div>

                  {/* NAME */}
                  <h2 className="text-white font-semibold text-lg">
                    {community.name}
                  </h2>

                  {/* DESC */}
                  <p className="text-gray-400 text-sm mt-2">
                    {community.description}
                  </p>

                  {/* ORIGINAL BUTTON — UNCHANGED */}
                  <button
                    onClick={() => router.push(`/community/${community.id}`)}
                    className="mt-5 w-full bg-blue-600 py-2 rounded-lg text-white"
                  >
                    Generate & View Posts
                  </button>
                </div>
              ))}
            </div>
            {communities.length > 0 && (

              <div className="flex justify-center gap-4 mt-10">

                <button
                  disabled={currentPage === 1}
                  onClick={() => fetchCommunities(currentPage - 1)}
                  className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="text-white px-4 py-2">
                  Page {currentPage}
                </span>

                <button
                  disabled={!hasMore}
                  onClick={() => fetchCommunities(currentPage + 1)}
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-40"
                >
                  Next
                </button>

              </div>

            )}
          </>
        )}
      </div>
    </div>
  );
}