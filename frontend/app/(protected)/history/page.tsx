"use client";

import { useEffect, useState } from "react";

/* ---------------- TYPES ---------------- */

type Community = {// our community schema will be different as it contains fields like id, name, description, website url, instagram url, twitter url and in future other urls also, but here we are only passing id , name and description as props to history page because we only need these fields to display the history of posts generated in each community.
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
};

/* ---------------- PAGE ---------------- */

export default function HistoryPage() {
  const [communities, setCommunities] = useState<Community[]>([]);// storing the communities here because we will use the name of community in dropdown menu to filter the posts based on the community name.
  const [allPosts, setAllPosts] = useState<(Post & { communityName: string })[]>([]);// we are adding communityName to the post type because we want to display the community name in the history page and also we want to filter the posts based on the community name, so we need to have the community name in the post object.
  const [selectedCommunity, setSelectedCommunity] = useState<string>("all");// we are using "all" as the default value for selectedCommunity because we want to show all the posts when the user first visits the history page, and then they can filter the posts by selecting a specific community from the dropdown.

  /* ---------------- LOAD DATA ---------------- */

  useEffect(() => {
    const storedCommunities: Community[] = JSON.parse(
      localStorage.getItem("communities") || "[]"
    );

    setCommunities(storedCommunities);

    let collectedPosts: (Post & { communityName: string })[] = [];// temporary array to gather the posts.

    storedCommunities.forEach((community) => {
      const posts: Post[] = JSON.parse(
        localStorage.getItem(`posts_${community.id}`) || "[]"
      );

      const withCommunity = posts.map((post) => ({
        ...post,
        communityName: community.name,// adding the community name to each post object so that we can display it in the history page and also filter the posts based on the community name.
      }));

      collectedPosts = [...collectedPosts, ...withCommunity];
    });

    setAllPosts(collectedPosts);
  }, []);

  /* ---------------- FILTERED POSTS ---------------- */

  const filteredPosts =
    selectedCommunity === "all"
      ? allPosts
      : allPosts.filter((post) => post.communityName === selectedCommunity);

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

          {/* FILTER */}
          <select
            value={selectedCommunity}
            onChange={(e) => setSelectedCommunity(e.target.value)}
            className="bg-[#111827] border border-gray-700 text-white px-4 py-2 rounded-lg"
          >
            <option value="all">All Communities</option>

            {communities.map((community) => (
              <option key={community.id} value={community.name}>
                {community.name}
              </option>
            ))}
          </select>
        </div>

        {/* EMPTY STATE */}
        {filteredPosts.length === 0 ? (
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-16 text-center">
            <p className="text-gray-400">No posts found</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-[#111827] border border-gray-800 rounded-xl p-6 space-y-3 hover:border-blue-600 transition"
              >
                {/* COMMUNITY NAME */}
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
        )}
      </div>
    </div>
  );
}
