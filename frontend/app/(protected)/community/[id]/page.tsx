"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { url } from "@/lib/axiosInstance";

/* ---------------- TYPES ---------------- */

type Community = {
  id: string;
  name: string;
  description: string;
};

type Theme = {
  id: string;
  title: string;
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

export default function CommunityDetailPage() {
  const { id } = useParams() as { id: string };

  const [community, setCommunity] = useState<Community | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  const [activeTab, setActiveTab] = useState<"themes" | "posts">("posts");

  const [selectedThemeFilter, setSelectedThemeFilter] = useState("all");

  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customTheme, setCustomTheme] = useState({
    title: "",
    description: "",
  });

  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");

  /* ---------------- INVITE STATES ---------------- */

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  /* ---------------- pagination ---------------- */
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  /* ---------------- LOAD DATA ---------------- */

  useEffect(() => {
    fetchCommunity();
    fetchThemes();
    fetchPosts();
  }, [id]);

  const fetchCommunity = async () => {
    const res = await url.get(`/api/community/${id}`);
    setCommunity(res.data.community);
  };

  const fetchThemes = async () => {
    const res = await url.get(`/api/themes/${id}`);
    setThemes(res.data.themes || []);
  };

  const fetchPosts = async (themeId?: string, page = 1) => {
    const query = themeId
      ? `?themeId=${themeId}&page=${page}`
      : `?communityId=${id}&page=${page}`;

    const res = await url.get(`/api/posts${query}`);

    const data = res.data.posts || [];

    setPosts(data);
    setCurrentPage(page);

    // If less than 10 posts returned, there is no next page
    setHasMore(data.length === 10);
  };

  /* ---------------- GENERATE THEMES ---------------- */

  const generateThemes = async () => {
    const res = await url.post("/api/themes/generate", {
      communityId: id,
    });

    setThemes(res.data.themes);
  };

  /* ---------------- ADD CUSTOM THEME ---------------- */

  const addCustomTheme = async () => {
    if (!customTheme.title.trim()) return;

    const res = await url.post("/api/themes/custom", {
      communityId: id,
      title: customTheme.title,
      description: customTheme.description,
    });

    setThemes((prev) => [res.data.theme, ...prev]);

    setCustomTheme({ title: "", description: "" });
    setShowCustomForm(false);
  };

  /* ---------------- GENERATE POSTS ---------------- */

  const generatePosts = async (theme: Theme) => {
    const dummyPosts = [
      {
        title: `${theme.title} Awareness`,
        content: `Learn how ${theme.title} can transform communities.`,
      },
      {
        title: `${theme.title} Inspiration`,
        content: `Be part of ${theme.title} and spread positivity.`,
      },
    ];

    for (const p of dummyPosts) {
      await url.post("/api/posts/create", {
        themeId: theme.id,
        title: p.title,
        content: p.content,
      });
    }

    await fetchPosts();
    setActiveTab("posts");
  };

  /* ---------------- DELETE POST ---------------- */

  const deletePost = async (postId: string) => {
    await url.delete(`/api/posts/${postId}`);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  /* ---------------- REGENERATE POST ---------------- */

  const regeneratePost = async (postId: string) => {
    await url.patch(`/api/posts/${postId}/regenerate`);
    fetchPosts(selectedThemeFilter === "all" ? undefined : selectedThemeFilter);
  };

  /* ---------------- EDIT POST ---------------- */

  const updatePost = async () => {
    if (!editingPostId) return;

    await url.put(`/api/posts/${editingPostId}`, {
      content: editPrompt,
    });

    setEditingPostId(null);
    setEditPrompt("");

    fetchPosts();
  };

  /* ---------------- INVITE USER ---------------- */

  const sendInvite = async () => {
    if (!inviteEmail.trim()) return;

    try {
      setInviteLoading(true);

      await url.post("/api/invite/send", {
        communityId: id,
        email: inviteEmail,
      });

      setInviteEmail("");
      setShowInvite(false);

      alert("Invite sent!");
    } catch {
      alert("Invite failed");
    } finally {
      setInviteLoading(false);
    }
  };

  /* ---------------- SAFETY ---------------- */

  if (!community)
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading community...
      </div>
    );

  /* ================================================= */

  return (
    <div className="bg-[#0B1120] min-h-screen px-6 py-10">

      <div className="max-w-6xl mx-auto">

        {/* HEADER */}

        <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 mb-8 flex justify-between items-center">

          <div>
            <h1 className="text-xl text-white font-semibold">
              {community.name}
            </h1>
            <p className="text-gray-400 text-sm mt-2">
              {community.description}
            </p>
          </div>

          <button
            onClick={() => setShowInvite(true)}
            className="bg-green-600 px-5 py-2 rounded text-white"
          >
            Invite
          </button>

        </div>

        {/* TABS */}

        <div className="flex gap-6 border-b border-gray-800 mb-8">

          <button
            onClick={() => setActiveTab("posts")}
            className={`pb-3 ${activeTab === "posts"
              ? "text-blue-500 border-b-2 border-blue-500"
              : "text-gray-400"
              }`}
          >
            Your Posts
          </button>

          <button
            onClick={() => setActiveTab("themes")}
            className={`pb-3 ${activeTab === "themes"
              ? "text-blue-500 border-b-2 border-blue-500"
              : "text-gray-400"
              }`}
          >
            Themes
          </button>

        </div>

        {/* ================= POSTS TAB ================= */}

        {activeTab === "posts" && (
          <div>

            {/* FILTER ALWAYS VISIBLE */}

            {themes.length > 0 && (
              <div className="flex justify-end mb-6">

                <select
                  value={selectedThemeFilter}
                  onChange={(e) => {
                    const value = e.target.value;

                    setSelectedThemeFilter(value);

                    if (value === "all") {
                      fetchPosts(undefined, 1);
                    } else {
                      fetchPosts(value, 1);
                    }
                  }}
                  className="bg-[#111827] border border-gray-700 text-white px-4 py-2 rounded"
                >

                  <option value="all">All Themes</option>

                  {themes.map((theme) => (
                    <option key={theme.id} value={theme.id}>
                      {theme.title}
                    </option>
                  ))}

                </select>

              </div>
            )}

            {/* NO POSTS FOR COMMUNITY */}

            {posts.length === 0 && selectedThemeFilter === "all" && (

              <div className="bg-[#111827] border border-gray-800 rounded-xl p-16 text-center">

                <p className="text-gray-400 mb-6">
                  No posts generated yet
                </p>

                <button
                  onClick={() => setActiveTab("themes")}
                  className="bg-blue-600 px-6 py-3 rounded text-white"
                >
                  Generate Themes First
                </button>

              </div>

            )}

            {/* NO POSTS FOR SELECTED THEME */}

            {posts.length === 0 && selectedThemeFilter !== "all" && (

              <div className="bg-[#111827] border border-gray-800 rounded-xl p-16 text-center">

                <p className="text-gray-400">
                  No posts generated for this theme
                </p>

              </div>

            )}

            {/* POSTS LIST */}

            {posts.length > 0 && (

              <div className="grid md:grid-cols-2 gap-6">

                {posts.map((post) => (

                  <div
                    key={post.id}
                    className="bg-[#111827] border border-gray-800 rounded-xl p-5"
                  >

                    <span className="text-xs text-blue-400">
                      {post.themeTitle}
                    </span>

                    <h3 className="text-white font-semibold mt-1">
                      {post.title}
                    </h3>

                    <p className="text-gray-400 text-sm mt-2">
                      {post.content}
                    </p>

                    <div className="flex gap-4 mt-4 text-sm">

                      <button
                        onClick={() => setEditingPostId(post.id)}
                        className="text-blue-400"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deletePost(post.id)}
                        className="text-red-400"
                      >
                        Delete
                      </button>

                      <button
                        onClick={() => regeneratePost(post.id)}
                        className="text-purple-400"
                      >
                        Regenerate
                      </button>

                    </div>

                  </div>

                ))}

              </div>

            )}
            {posts.length > 0 && (
              <div className="flex justify-center gap-4 mt-10">

                {/* PREVIOUS BUTTON */}
                <button
                  disabled={currentPage === 1}
                  onClick={() =>
                    fetchPosts(
                      selectedThemeFilter === "all" ? undefined : selectedThemeFilter,
                      currentPage - 1
                    )
                  }
                  className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-40"
                >
                  Previous
                </button>

                {/* CURRENT PAGE */}
                <span className="text-white px-4 py-2">
                  Page {currentPage}
                </span>

                {/* NEXT BUTTON */}
                <button
                  disabled={!hasMore}
                  onClick={() =>
                    fetchPosts(
                      selectedThemeFilter === "all" ? undefined : selectedThemeFilter,
                      currentPage + 1
                    )
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-40"
                >
                  Next
                </button>

              </div>
            )}

          </div>
        )}

        {/* ================= THEMES TAB ================= */}

        {activeTab === "themes" && (

          <div className="space-y-6">

            <div className="flex justify-end">

              <button
                onClick={() => setShowCustomForm(!showCustomForm)}
                className="bg-gray-700 px-5 py-2 rounded text-white"
              >
                + Add Custom Theme
              </button>

            </div>

            {showCustomForm && (

              <div className="bg-[#111827] border border-gray-700 rounded-xl p-6 space-y-4">

                <input
                  placeholder="Theme Title"
                  value={customTheme.title}
                  onChange={(e) =>
                    setCustomTheme({
                      ...customTheme,
                      title: e.target.value,
                    })
                  }
                  className="w-full bg-[#0F172A] px-4 py-3 rounded text-white"
                />

                <textarea
                  placeholder="Theme Description"
                  value={customTheme.description}
                  onChange={(e) =>
                    setCustomTheme({
                      ...customTheme,
                      description: e.target.value,
                    })
                  }
                  className="w-full bg-[#0F172A] px-4 py-3 rounded text-white"
                />

                <button
                  onClick={addCustomTheme}
                  className="bg-blue-600 px-6 py-2 rounded text-white"
                >
                  Add Theme
                </button>

              </div>

            )}

            {themes.length === 0 && (

              <div className="bg-[#111827] rounded-xl p-12 text-center border border-gray-800">

                <button
                  onClick={generateThemes}
                  className="bg-blue-600 px-6 py-3 rounded text-white"
                >
                  Generate Themes
                </button>

              </div>

            )}

            {themes.map((theme) => (

              <div
                key={theme.id}
                className="bg-[#111827] border border-gray-800 rounded-xl p-5 flex justify-between"
              >

                <div>

                  <h3 className="text-white font-semibold">
                    {theme.title}
                  </h3>

                  <p className="text-gray-400 text-sm">
                    {theme.description}
                  </p>

                </div>

                <button
                  onClick={() => generatePosts(theme)}
                  className="bg-blue-600 px-4 py-2 rounded text-white text-sm"
                >
                  Generate Posts
                </button>

              </div>

            ))}

          </div>

        )}

      </div>

      {/* INVITE MODAL */}

      {showInvite && (

        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">

          <div className="bg-[#111827] p-8 rounded-xl w-96">

            <h2 className="text-lg mb-4 text-white">
              Invite Member
            </h2>

            <input
              type="email"
              placeholder="Enter email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full p-2 rounded text-black mb-4"
            />

            <div className="flex justify-end gap-3">

              <button
                onClick={() => setShowInvite(false)}
                className="px-4 py-2 bg-gray-600 rounded"
              >
                Cancel
              </button>

              <button
                onClick={sendInvite}
                disabled={inviteLoading}
                className="px-4 py-2 bg-green-600 rounded"
              >
                {inviteLoading ? "Sending..." : "Send Invite"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

