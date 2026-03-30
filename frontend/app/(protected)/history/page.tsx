"use client";

import { useEffect, useState } from "react";
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
    <div className="min-h-screen bg-app-gradient px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#111827] md:text-3xl">Content History</h1>
            <p className="mt-1 text-sm text-[#6b7280]">All posts generated across communities</p>
          </div>

          <select
            value={selectedCommunity}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="input-field w-full md:w-64"
          >
            <option value="all">All Communities</option>
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
          </select>
        </div>

        {posts.length === 0 ? (
          <div className="panel rounded-xl p-16 text-center text-[#6b7280]">No posts found</div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <div key={post.id} className="panel space-y-3 rounded-xl p-6">
                  <span className="inline-block rounded-full bg-[#eef2ff] px-3 py-1 text-xs text-[#4f5fcf]">
                    {post.communityName}
                  </span>
                  <h3 className="text-base font-semibold text-[#111827]">{post.title}</h3>
                  {post.imageUrl ? (
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="h-44 w-full rounded-lg object-cover"
                    />
                  ) : null}
                  <p className="text-xs text-[#4f5fcf]">{post.themeTitle}</p>
                  <p className="text-sm text-[#4b5563]">{post.content}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex justify-center gap-4">
              <button
                disabled={currentPage === 1}
                onClick={() => fetchPosts(selectedCommunity === "all" ? undefined : selectedCommunity, currentPage - 1)}
                className="btn-secondary px-4 py-2 disabled:opacity-40"
              >
                Previous
              </button>

              <span className="px-4 py-2 text-[#6b7280]">Page {currentPage}</span>

              <button
                disabled={!hasMore}
                onClick={() => fetchPosts(selectedCommunity === "all" ? undefined : selectedCommunity, currentPage + 1)}
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


