"use client";

import { useEffect, useState } from "react";
import { url } from "@/lib/axiosInstance";

/* ---------------- TYPES ---------------- */

type Community = {
  id: string;
  name: string;
  description: string;
};

type Post = {
  id: string;
  title: string;
  content: string;
  themeId: string;
  themeTitle: string;
  communityId: string;
  communityName: string;
};

/* ---------------- PAGE ---------------- */

export default function HistoryPage() {

  const [communities, setCommunities] = useState<Community[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState("all");

  /* ---------------- pagination ---------------- */

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  /* ---------------- LOAD COMMUNITIES ---------------- */

  const fetchCommunities = async () => {
    try {
      const res = await url.get("/api/community/list");
      setCommunities(res.data.communities || []);
    } catch (err) {
      console.error("Failed to load communities", err);
    }
  };

  /* ---------------- LOAD POSTS ---------------- */

  const fetchPosts = async (communityId?: string, page = 1) => {
    try {

      const query = communityId
        ? `?communityId=${communityId}&page=${page}`
        : `?page=${page}`;

      const res = await url.get(`/api/posts${query}`);

      const data = res.data.posts || [];

      setPosts(data);
      setCurrentPage(page);

      // if less than 10 returned, no more pages
      setHasMore(data.length === 10);

    } catch (err) {
      console.error("Failed to load posts", err);
    }
  };

  /* ---------------- INITIAL LOAD ---------------- */

  useEffect(() => {
    fetchCommunities();
    fetchPosts();
  }, []);

  /* ---------------- FILTER CHANGE ---------------- */

  const handleFilterChange = async (value: string) => {

    setSelectedCommunity(value);
    setCurrentPage(1);

    if (value === "all") {
      fetchPosts(undefined, 1);
    } else {
      fetchPosts(value, 1);
    }

  };

  /* ---------------- UI ---------------- */

  return (
    <div className="bg-[#0B1120] min-h-screen px-4 sm:px-6 py-10">

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}

        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">

          <div>
            <h1 className="text-2xl md:text-3xl text-white font-semibold">
              Content History
            </h1>

            <p className="text-gray-400 text-sm mt-1">
              All posts generated across communities
            </p>
          </div>

          {/* COMMUNITY FILTER */}

          <select
            value={selectedCommunity}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="bg-[#111827] border border-gray-700 text-white px-4 py-2 rounded-lg"
          >

            <option value="all">All Communities</option>

            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}

          </select>

        </div>

        {/* EMPTY STATE */}

        {posts.length === 0 ? (

          <div className="bg-[#111827] border border-gray-800 rounded-xl p-16 text-center">
            <p className="text-gray-400">
              No posts found
            </p>
          </div>

        ) : (

          <>
          
            {/* POSTS GRID */}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

              {posts.map((post) => (

                <div
                  key={post.id}
                  className="bg-[#111827] border border-gray-800 rounded-xl p-6 space-y-3 hover:border-blue-600 transition"
                >

                  {/* COMMUNITY */}

                  <span className="text-xs text-blue-400">
                    {post.communityName}
                  </span>

                  {/* TITLE */}

                  <h3 className="text-white font-semibold">
                    {post.title}
                  </h3>

                  {/* THEME */}

                  <p className="text-xs text-purple-400">
                    {post.themeTitle}
                  </p>

                  {/* CONTENT */}

                  <p className="text-gray-400 text-sm">
                    {post.content}
                  </p>

                </div>

              ))}

            </div>


            {/* PAGINATION */}

            <div className="flex justify-center gap-4 mt-10">

              {/* PREVIOUS */}

              <button
                disabled={currentPage === 1}
                onClick={() =>
                  fetchPosts(
                    selectedCommunity === "all"
                      ? undefined
                      : selectedCommunity,
                    currentPage - 1
                  )
                }
                className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-40"
              >
                Previous
              </button>

              {/* PAGE NUMBER */}

              <span className="text-white px-4 py-2">
                Page {currentPage}
              </span>

              {/* NEXT */}

              <button
                disabled={!hasMore}
                onClick={() =>
                  fetchPosts(
                    selectedCommunity === "all"
                      ? undefined
                      : selectedCommunity,
                    currentPage + 1
                  )
                }
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-40"
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