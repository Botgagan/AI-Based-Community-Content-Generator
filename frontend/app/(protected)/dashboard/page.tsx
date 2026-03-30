"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { url } from "@/lib/axiosInstance";
import {
  hasNextPageByLength,
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
} from "@/lib/pagination";

type Community = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(PAGINATION_DEFAULT_PAGE);
  const [hasMore, setHasMore] = useState(true);

  const fetchCommunities = useCallback(async (page = PAGINATION_DEFAULT_PAGE) => {
    try {
      const res = await url.get(
        `/api/community/list?page=${page}&limit=${PAGINATION_DEFAULT_LIMIT}`
      );
      const data = res.data.communities || [];

      setCommunities(data);
      setCurrentPage(page);
      setHasMore(hasNextPageByLength(data.length, PAGINATION_DEFAULT_LIMIT));
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "response" in err) {
        const response = (err as { response?: { status?: number } }).response;
        if (response?.status === 401) {
          router.push("/auth");
        }
      } else {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  const handleDelete = async (communityId: string) => {
    if (!confirm("Delete this community?")) return;

    try {
      await url.delete(`/api/community/${communityId}`);
      setCommunities((prev) => prev.filter((community) => community.id !== communityId));
      window.dispatchEvent(new Event("community:changed"));
    } catch (err) {
      console.error(err);
      alert("Failed to delete community");
    }
  };

  return (
    <div className="min-h-screen bg-app-gradient px-4 py-10 sm:px-6 md:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#111827] md:text-3xl">Your Communities</h1>
            <p className="mt-1 text-sm text-[#6b7280]">Manage and generate AI-powered content</p>
          </div>

          <button onClick={() => router.push("/add-community")} className="btn-primary w-full px-6 py-3 text-sm md:w-auto">
            Add New Community
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-[#6b7280]">Loading communities...</div>
        ) : communities.length === 0 ? (
          <div className="panel rounded-2xl p-12 text-center md:p-20">
            <h2 className="mb-2 text-lg font-semibold text-[#111827] md:text-xl">Start building your community</h2>
            <p className="mx-auto mb-8 max-w-md text-[#6b7280]">
              Add your first community and generate AI-powered content.
            </p>

            <button onClick={() => router.push("/add-community")} className="btn-primary px-8 py-3">
              Add Your First Community
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {communities.map((community) => (
                <div key={community.id} className="panel relative rounded-xl p-6">
                  <div className="absolute right-4 top-4 flex gap-3">
                    <button
                      onClick={() => router.push(`/edit-community/${community.id}`)}
                      className="text-sm text-[#6b7280] transition hover:text-[#4f5fcf]"
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(community.id)}
                      className="text-sm text-[#6b7280] transition hover:text-rose-600"
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>

                  {community.imageUrl ? (
                    <img
                      src={community.imageUrl}
                      alt={community.name}
                      className="mb-3 h-36 w-full rounded-lg object-cover"
                    />
                  ) : null}

                  <h2 className="text-lg font-semibold text-[#111827]">{community.name}</h2>
                  <p className="mt-2 text-sm text-[#6b7280]">{community.description}</p>

                  <button
                    onClick={() => router.push(`/community/${community.id}`)}
                    className="btn-primary mt-5 w-full py-2.5 text-sm"
                  >
                    Generate and View Posts
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-10 flex justify-center gap-4">
              <button
                disabled={currentPage === 1}
                onClick={() => fetchCommunities(currentPage - 1)}
                className="btn-secondary px-4 py-2 disabled:opacity-40"
              >
                Previous
              </button>

              <span className="px-4 py-2 text-[#6b7280]">Page {currentPage}</span>

              <button
                disabled={!hasMore}
                onClick={() => fetchCommunities(currentPage + 1)}
                className="btn-primary px-4 py-2 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

