"use client";

import { useEffect, useState } from "react";
import { url } from "@/lib/axiosInstance";
import FilterSelect from "@/components/FilterSelect";
import {
  hasNextPageByLength,
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
} from "@/lib/pagination";

type Community = {
  id: string;
  name: string;
  description: string;
};

type Post = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  themeId: string;
  themeTitle: string;
  communityId: string;
  communityName: string;
};

export default function HistoryPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState("all");

  const [currentPage, setCurrentPage] = useState(PAGINATION_DEFAULT_PAGE);
  const [hasMore, setHasMore] = useState(true);

  const fetchCommunities = async () => {
    try {
      const res = await url.get("/api/community/list");
      setCommunities(res.data.communities || []);
    } catch (err) {
      console.error("Failed to load communities", err);
    }
  };

  const fetchPosts = async (communityId?: string, page = PAGINATION_DEFAULT_PAGE) => {
    try {
      const query = communityId
        ? `?communityId=${communityId}&page=${page}&limit=${PAGINATION_DEFAULT_LIMIT}`
        : `?page=${page}&limit=${PAGINATION_DEFAULT_LIMIT}`;
      const res = await url.get(`/api/posts${query}`);
      const data = res.data.posts || [];

      setPosts(data);
      setCurrentPage(page);
      setHasMore(hasNextPageByLength(data.length, PAGINATION_DEFAULT_LIMIT));
    } catch (err) {
      console.error("Failed to load posts", err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCommunities();
      fetchPosts();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const handleFilterChange = (value: string) => {
    setSelectedCommunity(value);
    setCurrentPage(1);

    if (value === "all") {
      fetchPosts(undefined, 1);
      return;
    }

    fetchPosts(value, 1);
  };

  return (
    <div className="px-1 py-2">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="panel overflow-hidden p-6 sm:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-[#1d1d1f]">Post Timeline</h1>
              <p className="mt-1 text-sm text-[rgba(0,0,0,0.8)]">Focus on one community or browse all generated content.</p>
            </div>

            <FilterSelect
              value={selectedCommunity}
              onChange={handleFilterChange}
              options={[
                { value: "all", label: "All Communities" },
                ...communities.map((community) => ({
                  value: community.id,
                  label: community.name,
                })),
              ]}
              className="w-full md:w-72"
            />
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="panel rounded-[8px] p-16 text-center text-[rgba(0,0,0,0.8)]">No posts found</div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => (
                <div key={post.id} className="panel relative space-y-3 rounded-[8px] p-5">
                  <div className="absolute left-0 top-0 h-full w-1 rounded-l-[8px] bg-[linear-gradient(180deg,#395bff,#93a6ff)]" />
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-block rounded-full bg-[#f5f5f7] px-3 py-1 text-xs font-semibold text-[#0066cc]">
                      {post.communityName}
                    </span>
                    <span className="inline-block rounded-full bg-[#f5f5f7] px-3 py-1 text-xs text-[rgba(0,0,0,0.8)]">
                      {post.themeTitle}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold tracking-[-0.02em] text-[#1d1d1f]">{post.title}</h3>
                  {post.imageUrl ? (
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="h-44 w-full rounded-[8px] object-cover"
                    />
                  ) : null}
                  <p className="line-clamp-3 text-sm text-[rgba(0,0,0,0.8)]">{post.content}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-center gap-4">
              <button
                disabled={currentPage === 1}
                onClick={() => fetchPosts(selectedCommunity === "all" ? undefined : selectedCommunity, currentPage - 1)}
                className="btn-secondary px-5 py-2 disabled:opacity-40"
              >
                Previous
              </button>

              <span className="rounded-full bg-[#f5f5f7] px-4 py-2 text-sm text-[rgba(0,0,0,0.8)]">Page {currentPage}</span>

              <button
                disabled={!hasMore}
                onClick={() => fetchPosts(selectedCommunity === "all" ? undefined : selectedCommunity, currentPage + 1)}
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



