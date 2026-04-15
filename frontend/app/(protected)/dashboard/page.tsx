"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { url } from "@/lib/axiosInstance";
import { useUI } from "@/components/UIProvider";
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
  isMember: boolean;
  role?: "owner" | "admin" | "member" | null;
};

const iconButtonClass =
  "flex h-8 w-8 items-center justify-center rounded-full border border-[#d0d5dd] bg-white text-[#374151] transition hover:bg-[#f3f4f6]";

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 20h4l10-10-4-4L4 16v4z" />
      <path d="M12 6l4 4" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { toast, confirm, showLoader, hideLoader } = useUI();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(PAGINATION_DEFAULT_PAGE);
  const [hasMore, setHasMore] = useState(true);

  const fetchCommunities = useCallback(async (page = PAGINATION_DEFAULT_PAGE) => {
    try {
      const res = await url.get(
        `/api/community/list?scope=directory&page=${page}&limit=${PAGINATION_DEFAULT_LIMIT}`
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
    const shouldDelete = await confirm({
      title: "Delete this community?",
      description: "This action cannot be undone.",
      confirmText: "Delete",
      danger: true,
    });
    if (!shouldDelete) return;

    try {
      showLoader();
      await url.delete(`/api/community/${communityId}`);
      setCommunities((prev) => prev.filter((community) => community.id !== communityId));
      window.dispatchEvent(new Event("community:changed"));
      toast({ title: "Community deleted", variant: "success" });
    } catch (err) {
      console.error(err);
      toast({ title: "Delete failed", description: "Failed to delete community.", variant: "error" });
    } finally {
      hideLoader();
    }
  };

  const handleJoin = async (communityId: string) => {
    try {
      showLoader();
      await url.post(`/api/community/${communityId}/join`);
      setCommunities((prev) =>
        prev.map((community) =>
          community.id === communityId
            ? { ...community, isMember: true, role: community.role ?? "member" }
            : community
        )
      );
      window.dispatchEvent(new Event("community:changed"));
      toast({ title: "Joined community", variant: "success" });
    } catch (err) {
      console.error(err);
      toast({ title: "Join failed", description: "Failed to join community.", variant: "error" });
    } finally {
      hideLoader();
    }
  };

  return (
    <div className="px-1 py-2">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="panel overflow-hidden p-6 sm:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-[-0.02em] text-[#1d1d1f]">Community Command Center</h1>
              <p className="mt-1 text-sm text-[rgba(0,0,0,0.8)]">Manage your spaces, onboard new communities, and trigger your next content cycle.</p>
            </div>

            <button onClick={() => router.push("/add-community")} className="btn-primary w-full px-6 py-3 text-sm md:w-auto">
              Add New Community
            </button>
          </div>
        </div>

        {loading ? (
          <div className="panel rounded-[8px] py-16 text-center text-[rgba(0,0,0,0.8)]">Loading communities...</div>
        ) : communities.length === 0 ? (
          <div className="panel rounded-[8px] p-12 text-center md:p-20">
            <h2 className="mb-2 text-xl font-bold tracking-[-0.02em] text-[#1d1d1f]">Start building your gallery</h2>
            <p className="mx-auto mb-8 max-w-md text-[rgba(0,0,0,0.8)]">
              Add your first community to start generating beautiful AI-powered content.
            </p>

            <button onClick={() => router.push("/add-community")} className="btn-primary px-8 py-3">
              Add Your First Community
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {communities.map((community) => (
                <div key={community.id} className="panel relative overflow-hidden p-5">
                  <div className="absolute right-4 top-4 z-10 flex gap-2">
                    {community.role === "owner" && (
                      <>
                        <button
                          onClick={() => router.push(`/edit-community/${community.id}`)}
                          className={iconButtonClass}
                          title="Edit"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => handleDelete(community.id)}
                          className={iconButtonClass}
                          title="Delete"
                        >
                          <DeleteIcon />
                        </button>
                      </>
                    )}
                  </div>

                  {community.imageUrl ? (
                    <img
                      src={community.imageUrl}
                      alt={community.name}
                      className="mb-4 h-44 w-full rounded-[8px] object-cover"
                    />
                  ) : (
                    <div className="mb-4 h-44 w-full rounded-xl bg-[linear-gradient(135deg,#e8eeff,#f6f8ff)]" />
                  )}

                  <h2 className="text-xl font-bold tracking-[-0.02em] text-[#1d1d1f]">{community.name}</h2>
                  <p className="mt-2 line-clamp-3 text-sm text-[rgba(0,0,0,0.8)]">{community.description}</p>

                  {community.isMember ? (
                    <button
                      onClick={() => router.push(`/community/${community.id}`)}
                      className="btn-primary mt-6 w-full py-2.5 text-sm"
                    >
                      Open Community
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoin(community.id)}
                      className="btn-secondary mt-6 w-full py-2.5 text-sm"
                    >
                      Join Community
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4">
              <button
                disabled={currentPage === 1}
                onClick={() => fetchCommunities(currentPage - 1)}
                className="btn-secondary px-5 py-2 disabled:opacity-40"
              >
                Previous
              </button>

              <span className="rounded-full bg-[#f5f5f7] px-4 py-2 text-sm text-[rgba(0,0,0,0.8)]">Page {currentPage}</span>

              <button
                disabled={!hasMore}
                onClick={() => fetchCommunities(currentPage + 1)}
                className="btn-primary px-5 py-2 disabled:opacity-40"
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


