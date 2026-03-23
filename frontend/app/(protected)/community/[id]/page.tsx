"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { url } from "@/lib/axiosInstance";
import InviteModal from "@/components/InviteModal";
import { AxiosError } from "axios";

type Community = {
  id: string;
  name: string;
  description: string;
};

type Theme = {
  id: string;
  title: string;
  description: string;
  source?: "ai" | "custom";
};

type Post = {
  id: string;
  title: string;
  content: string;
  themeId: string;
  themeTitle: string;
};

const PAGE_SIZE = 10;

export default function CommunityDetailPage() {
  const { id } = useParams() as { id: string };

  const [community, setCommunity] = useState<Community | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [allThemes, setAllThemes] = useState<Theme[]>([]);
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

  const [showInvite, setShowInvite] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [bannerType, setBannerType] = useState<"success" | "error">("success");
  const [isGeneratingThemes, setIsGeneratingThemes] = useState(false);

  const [themesPage, setThemesPage] = useState(1);
  const [themesHasMore, setThemesHasMore] = useState(true);

  const [postsPage, setPostsPage] = useState(1);
  const [postsHasMore, setPostsHasMore] = useState(true);
  const hasAIThemes = allThemes.some((theme) => theme.source === "ai");

  const fetchThemes = async (page = 1) => {
    const [res, nextPageRes] = await Promise.all([
      url.get(`/api/themes?communityId=${id}&page=${page}&limit=${PAGE_SIZE}`),
      url.get(`/api/themes?communityId=${id}&page=${page + 1}&limit=${PAGE_SIZE}`),
    ]);
    const data = res.data.themes || [];
    const nextPageData = nextPageRes.data.themes || [];

    setThemes(data);
    setThemesPage(page);
    setThemesHasMore(nextPageData.length > 0);
  };

  const fetchAllThemes = async () => {
    const res = await url.get(`/api/themes?communityId=${id}&limit=1000`);
    setAllThemes(res.data.themes || []);
  };

  const fetchPosts = async (themeId?: string, page = 1) => {
    const query = themeId ? `?themeId=${themeId}&page=${page}` : `?communityId=${id}&page=${page}`;

    const res = await url.get(`/api/posts${query}`);
    const data = res.data.posts || [];

    setPosts(data);
    setPostsPage(page);
    setPostsHasMore(data.length === PAGE_SIZE);
  };

  useEffect(() => {
    const init = async () => {
      const [communityRes, themesRes, nextThemesRes, postsRes, allThemesRes] = await Promise.all([
        url.get(`/api/community/${id}`),
        url.get(`/api/themes?communityId=${id}&page=1&limit=${PAGE_SIZE}`),
        url.get(`/api/themes?communityId=${id}&page=2&limit=${PAGE_SIZE}`),
        url.get(`/api/posts?communityId=${id}&page=1`),
        url.get(`/api/themes?communityId=${id}&limit=1000`),
      ]);

      const initialThemes = themesRes.data.themes || [];
      const nextThemes = nextThemesRes.data.themes || [];
      const initialPosts = postsRes.data.posts || [];

      setCommunity(communityRes.data.community);
      setThemes(initialThemes);
      setThemesPage(1);
      setThemesHasMore(nextThemes.length > 0);
      setPosts(initialPosts);
      setPostsPage(1);
      setPostsHasMore(initialPosts.length === PAGE_SIZE);
      setAllThemes(allThemesRes.data.themes || []);
    };

    init();
  }, [id]);

  const generateThemes = async () => {
    if (isGeneratingThemes) return;

    setIsGeneratingThemes(true);
    setBanner(null);
    setBannerType("success");

    try {
      await url.post(
        "/api/themes/generate",
        { communityId: id },
        { timeout: 130000 }
      );
      await Promise.all([fetchThemes(1), fetchAllThemes()]);
      setBannerType("success");
      setBanner("Themes generated successfully.");
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      const message =
        err.code === "ECONNABORTED"
          ? "Theme generation timed out. Please try again."
          : err.response?.data?.message || "Failed to generate themes.";
      setBannerType("error");
      setBanner(message);
    } finally {
      setIsGeneratingThemes(false);
    }
  };

  const addCustomTheme = async () => {
    if (!customTheme.title.trim()) return;

    await url.post("/api/themes/custom", {
      communityId: id,
      title: customTheme.title,
      description: customTheme.description,
    });

    await Promise.all([fetchThemes(1), fetchAllThemes()]);

    setCustomTheme({ title: "", description: "" });
    setShowCustomForm(false);
    setBannerType("success");
    setBanner("Custom theme added.");
  };

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

    await fetchPosts(selectedThemeFilter === "all" ? undefined : selectedThemeFilter, 1);
    setActiveTab("posts");
    setBannerType("success");
    setBanner("Posts generated for selected theme.");
  };

  const deletePost = async (postId: string) => {
    await url.delete(`/api/posts/${postId}`);
    await fetchPosts(selectedThemeFilter === "all" ? undefined : selectedThemeFilter, postsPage);
  };

  const regeneratePost = async (postId: string) => {
    await url.patch(`/api/posts/${postId}/regenerate`);
    await fetchPosts(selectedThemeFilter === "all" ? undefined : selectedThemeFilter, postsPage);
  };

  const updatePost = async () => {
    if (!editingPostId) return;

    await url.put(`/api/posts/${editingPostId}`, {
      content: editPrompt,
    });

    setEditingPostId(null);
    setEditPrompt("");

    await fetchPosts(selectedThemeFilter === "all" ? undefined : selectedThemeFilter, postsPage);
  };

  if (!community) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#6b7280]">
        Loading community...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-gradient px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="panel mb-6 flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#111827]">{community.name}</h1>
            <p className="mt-1 text-sm text-[#6b7280]">{community.description}</p>
          </div>

          <button onClick={() => setShowInvite(true)} className="btn-primary px-5 py-2.5 text-sm">
            Invite Members
          </button>
        </div>

        {banner && (
          <div
            className={`mb-6 rounded-xl px-4 py-3 text-sm ${bannerType === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border border-rose-200 bg-rose-50 text-rose-700"
              }`}
          >
            {banner}
          </div>
        )}

        <div className="tab-shell mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab("posts")}
            className={`tab-btn flex-1 ${activeTab === "posts" ? "tab-btn-active" : ""}`}
          >
            Your Posts
          </button>

          <button
            onClick={() => setActiveTab("themes")}
            className={`tab-btn flex-1 ${activeTab === "themes" ? "tab-btn-active" : ""}`}
          >
            Themes
          </button>
        </div>

        {activeTab === "posts" && (
          <div>
            {allThemes.length > 0 && (
              <div className="mb-6 flex justify-end">
                <select
                  value={selectedThemeFilter}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedThemeFilter(value);
                    fetchPosts(value === "all" ? undefined : value, 1);
                  }}
                  className="input-field w-full md:w-64"
                >
                  <option value="all">All Themes</option>
                  {allThemes.map((theme) => (
                    <option key={theme.id} value={theme.id}>
                      {theme.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {posts.length === 0 && (
              <div className="panel rounded-xl p-12 text-center">
                <p className="mb-5 text-[#6b7280]">
                  {selectedThemeFilter === "all"
                    ? "No posts generated yet."
                    : "No posts generated for this theme."}
                </p>

                {selectedThemeFilter === "all" && (
                  <button onClick={() => setActiveTab("themes")} className="btn-primary px-6 py-2.5">
                    Create from Themes
                  </button>
                )}
              </div>
            )}

            {posts.length > 0 && (
              <div className="grid gap-5 md:grid-cols-2">
                {posts.map((post) => (
                  <div key={post.id} className="panel space-y-3 rounded-xl p-5">
                    <span className="inline-block rounded-full bg-[#eef2ff] px-3 py-1 text-xs text-[#4f5fcf]">
                      {post.themeTitle}
                    </span>

                    <h3 className="text-lg font-semibold text-[#111827]">{post.title}</h3>

                    {editingPostId === post.id ? (
                      <div className="space-y-3">
                        <textarea value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} className="input-field h-28" />

                        <div className="flex gap-2">
                          <button onClick={updatePost} className="btn-primary px-3 py-2 text-sm">
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingPostId(null);
                              setEditPrompt("");
                            }}
                            className="btn-secondary px-3 py-2 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-[#4b5563]">{post.content}</p>
                    )}

                    {editingPostId !== post.id && (
                      <div className="flex gap-5 text-sm">
                        <button
                          onClick={() => {
                            setEditingPostId(post.id);
                            setEditPrompt(post.content);
                          }}
                          className="text-[#1b75d0]"
                        >
                          Edit
                        </button>
                        <button onClick={() => deletePost(post.id)} className="text-rose-600">
                          Delete
                        </button>
                        <button onClick={() => regeneratePost(post.id)} className="text-[#4f5fcf]">
                          Regenerate
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {posts.length > 0 && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  disabled={postsPage === 1}
                  onClick={() => fetchPosts(selectedThemeFilter === "all" ? undefined : selectedThemeFilter, postsPage - 1)}
                  className="btn-secondary px-4 py-2 disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="text-sm text-[#6b7280]">Page {postsPage}</span>

                <button
                  disabled={!postsHasMore}
                  onClick={() => fetchPosts(selectedThemeFilter === "all" ? undefined : selectedThemeFilter, postsPage + 1)}
                  className="btn-primary px-4 py-2 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "themes" && (
          <div className="space-y-5">
            <div className="flex justify-end gap-3">
              {!hasAIThemes && (
                <button
                  onClick={generateThemes}
                  disabled={isGeneratingThemes}
                  className="btn-primary px-5 py-2 text-sm disabled:opacity-60"
                >
                  {isGeneratingThemes ? "Generating..." : "Generate Themes"}
                </button>
              )}

              <button
                onClick={() => setShowCustomForm((prev) => !prev)}
                className="btn-secondary px-5 py-2 text-sm"
              >
                + Add Custom Theme
              </button>
            </div>

            {showCustomForm && (
              <div className="panel space-y-3 rounded-xl p-5">
                <input
                  placeholder="Theme Title"
                  value={customTheme.title}
                  onChange={(e) =>
                    setCustomTheme({
                      ...customTheme,
                      title: e.target.value,
                    })
                  }
                  className="input-field"
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
                  className="input-field"
                />

                <button onClick={addCustomTheme} className="btn-primary px-6 py-2.5">
                  Add Theme
                </button>
              </div>
            )}

            {themes.length === 0 && allThemes.length === 0 && (
              <div className="panel rounded-xl p-12 text-center text-[#6b7280]">
                No themes yet. Generate AI themes or add a custom theme.
              </div>
            )}

            {themes.length === 0 && allThemes.length > 0 && (
              <div className="panel rounded-xl p-12 text-center text-[#6b7280]">
                No themes on this page.
              </div>
            )}

            {themes.map((theme) => (
              <div key={theme.id} className="panel flex flex-col gap-4 rounded-xl p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[#111827]">{theme.title}</h3>
                  <p className="text-sm text-[#6b7280]">{theme.description}</p>
                </div>

                <button onClick={() => generatePosts(theme)} className="btn-secondary px-4 py-2 text-sm font-medium text-[#4f5fcf]">
                  Generate Posts
                </button>
              </div>
            ))}

            {themes.length > 0 && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  disabled={themesPage === 1}
                  onClick={() => fetchThemes(themesPage - 1)}
                  className="btn-secondary px-4 py-2 disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="text-sm text-[#6b7280]">Page {themesPage}</span>

                <button
                  disabled={!themesHasMore}
                  onClick={() => fetchThemes(themesPage + 1)}
                  className="btn-primary px-4 py-2 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showInvite && (
        <InviteModal
          communityId={id}
          onClose={() => setShowInvite(false)}
          onSuccess={() => {
            setBannerType("success");
            setBanner("Invite sent successfully.");
          }}
        />
      )}
    </div>
  );
}


