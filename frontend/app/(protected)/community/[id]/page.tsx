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

  const [activeTab, setActiveTab] = useState<"themes" | "posts">("themes");
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");

  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customTheme, setCustomTheme] = useState({ title: "", description: "" });

  /* ---------------- LOAD COMMUNITY + THEMES ---------------- */

  useEffect(() => {
    fetchCommunity();
    fetchThemes();

    // posts still local for now
    setPosts(JSON.parse(localStorage.getItem(`posts_${id}`) || "[]"));
  }, [id]);

  const fetchCommunity = async () => {
    try {
      const res = await url.get(`/api/community/${id}`);
      setCommunity(res.data.community);
    } catch (err) {
      console.error("Failed to fetch community", err);
    }
  };

  const fetchThemes = async () => {
    try {
      const res = await url.get(`/api/themes/${id}`);
      setThemes(res.data.themes || []);
    } catch (err) {
      console.error("Failed to load themes", err);
    }
  };

  /* ---------------- SAVE POSTS LOCAL ---------------- */

  useEffect(() => {
    localStorage.setItem(`posts_${id}`, JSON.stringify(posts));
  }, [posts, id]);

  /* ---------------- GENERATE THEMES ---------------- */

  const generateThemes = async () => {
    try {
      const res = await url.post("/api/themes/generate", {
        communityId: id,
      });

      setThemes(res.data.themes);
    } catch (err) {
      console.error(err);
      alert("Failed to generate themes");
    }
  };

  /* ---------------- GENERATE POSTS ---------------- */

  const generatePosts = async (theme: Theme) => {
    await new Promise((r) => setTimeout(r, 600));

    const newPosts: Post[] = [
      {
        id: crypto.randomUUID(),
        themeId: theme.id,
        themeTitle: theme.title,
        title: `${theme.title} Idea`,
        content: `Discover the power of ${theme.title}. Join today.`,
      },
      {
        id: crypto.randomUUID(),
        themeId: theme.id,
        themeTitle: theme.title,
        title: `${theme.title} Awareness`,
        content: `Learn how ${theme.title} can transform lives.`,
      },
    ];

    setPosts((prev) => [...newPosts, ...prev]);
  };

  /* ---------------- DELETE THEME ---------------- */

  const deleteTheme = async (themeId: string) => {
    try {
      await url.delete(`/api/themes/${themeId}`);
      setThemes((prev) => prev.filter((t) => t.id !== themeId));
    } catch {
      alert("Delete failed");
    }
  };

  /* ---------------- POST ACTIONS ---------------- */

  const deletePost = (postId: string) => {
    setPosts((post) => post.filter((p) => p.id !== postId));
  };

  const polishPost = (postId: string) => {
    setPosts((post) =>
      post.map((p) =>
        p.id === postId ? { ...p, content: p.content + " ✨ Polished" } : p
      )
    );
  };

  const regeneratePost = async () => {
    if (!editingPostId) return;

    await new Promise((r) => setTimeout(r, 600));

    setPosts((post) =>
      post.map((p) =>
        p.id === editingPostId
          ? { ...p, content: p.content + " → " + editPrompt }
          : p
      )
    );

    setShowEditModal(false);
    setEditPrompt("");
    setEditingPostId(null);
  };

  /* ---------------- CUSTOM THEME ---------------- */

  const addCustomTheme = async () => {
    if (!customTheme.title.trim()) return;

    try {
      const res = await url.post("/api/themes/custom", {
        communityId: id,
        title: customTheme.title,
        description: customTheme.description,
      });

      setThemes((prev) => [...prev, res.data.theme]);

      setCustomTheme({ title: "", description: "" });
      setShowCustomForm(false);
    } catch {
      alert("Failed to create theme");
    }
  };

  /* ---------------- SAFETY ---------------- */

  if (!community)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1120] text-white">
        Loading community...
      </div>
    );

  /* ================================================= */

  return (
    <div className="bg-[#0B1120] min-h-screen px-4 sm:px-6 py-10">

      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 mb-8">
          <h1 className="text-xl text-white font-semibold">{community.name}</h1>
          <p className="text-gray-400 mt-2 text-sm">{community.description}</p>
        </div>

        {/* TABS */}
        <div className="border-b border-gray-800 flex gap-6 mb-8">
          {["themes", "posts"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-3 ${
                activeTab === tab
                  ? "text-blue-500 border-b-2 border-blue-500"
                  : "text-gray-400"
              }`}
            >
              {tab === "themes" ? "Themes" : "Your Posts"}
            </button>
          ))}
        </div>

        {/* THEMES TAB */}
        {activeTab === "themes" && (
          <>
            {selectedTheme ? (
              <div>

                <button
                  onClick={() => setSelectedTheme(null)}
                  className="mb-6 text-blue-400 text-sm"
                >
                  ← Back to Themes
                </button>

                <h2 className="text-lg text-white font-semibold mb-6">
                  {selectedTheme.title}
                </h2>

                <button
                  onClick={() => generatePosts(selectedTheme)}
                  className="mb-8 bg-blue-600 px-6 py-3 rounded-lg text-white"
                >
                  Generate Posts
                </button>

                <div className="grid md:grid-cols-2 gap-6">
                  {posts
                    .filter((post) => post.themeId === selectedTheme.id)
                    .map((post) => (
                      <div
                        key={post.id}
                        className="bg-[#111827] border border-gray-800 rounded-xl p-5 space-y-3"
                      >
                        <span className="text-xs text-blue-400">
                          {post.themeTitle}
                        </span>

                        <h3 className="text-white font-semibold">
                          {post.title}
                        </h3>

                        <p className="text-gray-400 text-sm">
                          {post.content}
                        </p>

                        <div className="flex gap-4 text-sm flex-wrap">
                          <button
                            onClick={() => {
                              setEditingPostId(post.id);
                              setShowEditModal(true);
                            }}
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
                            onClick={() => polishPost(post.id)}
                            className="text-purple-400"
                          >
                            Polish
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : themes.length === 0 ? (
              <div className="bg-[#111827] rounded-xl p-12 text-center border border-gray-800">
                <button
                  onClick={generateThemes}
                  className="bg-blue-600 px-6 py-3 rounded-lg text-white"
                >
                  Generate Themes
                </button>
              </div>
            ) : (
              <div className="space-y-6">

                <div className="flex justify-end">
                  <button
                    onClick={() => setShowCustomForm(!showCustomForm)}
                    className="bg-gray-700 px-5 py-2 rounded-lg text-white text-sm"
                  >
                    + Add Custom Theme
                  </button>
                </div>

                {showCustomForm && (
                  <div className="bg-[#111827] border border-gray-700 rounded-xl p-6 space-y-4">
                    <input
                      placeholder="Title"
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
                      placeholder="Description"
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

                {themes.map((theme) => (
                  <div
                    key={theme.id}
                    className="bg-[#111827] border border-gray-800 rounded-xl p-5 flex flex-col md:flex-row md:justify-between gap-4"
                  >
                    <div>
                      <h3 className="text-white font-semibold">
                        {theme.title}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {theme.description}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelectedTheme(theme)}
                        className="bg-blue-600 px-4 py-2 rounded text-white text-sm"
                      >
                        View Posts
                      </button>

                      <button
                        onClick={() => deleteTheme(theme.id)}
                        className="text-red-400 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* POSTS TAB */}
        {activeTab === "posts" && (
          <div className="grid md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-[#111827] border border-gray-800 rounded-xl p-5 space-y-3"
              >
                <span className="text-xs text-blue-400">
                  {post.themeTitle}
                </span>
                <h3 className="text-white font-semibold">{post.title}</h3>
                <p className="text-gray-400 text-sm">{post.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#111827] w-full max-w-lg rounded-xl p-6 space-y-4 border border-gray-700">
            <h3 className="text-white text-lg font-semibold">
              Edit Post with AI
            </h3>

            <textarea
              placeholder="Describe changes..."
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              className="w-full bg-[#020617] border border-gray-700 rounded-lg p-3 text-white"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-700 rounded text-white"
              >
                Cancel
              </button>

              <button
                onClick={regeneratePost}
                className="px-5 py-2 bg-blue-600 rounded text-white"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

