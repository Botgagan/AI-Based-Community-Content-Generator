"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { url } from "@/lib/axiosInstance";
import InviteModal from "@/components/InviteModal";
import { AxiosError } from "axios";
import {
  hasNextPageByLength,
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
  THEMES_ALL_FETCH_LIMIT,
} from "@/lib/pagination";

type Community = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  role?: "owner" | "member";
};

type Theme = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  source?: "ai" | "custom";
  status?: "pending" | "active" | "inactive" | "deleted";
  postCount?: number;
};

type Post = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  status?: "pending" | "approved" | "rejected";
  rejectionReason?: string | null;
  themeId: string;
  themeTitle: string;
};

export default function CommunityDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

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
  const [regeneratingPostId, setRegeneratingPostId] = useState<string | null>(null);

  const [showInvite, setShowInvite] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [bannerType, setBannerType] = useState<"success" | "error">("success");
  const [isGeneratingThemes, setIsGeneratingThemes] = useState(false);
  const [generatingPostsThemeId, setGeneratingPostsThemeId] = useState<string | null>(null);
  const [generatingPostsThemeTitle, setGeneratingPostsThemeTitle] = useState<string | null>(null);

  const [themesPage, setThemesPage] = useState(PAGINATION_DEFAULT_PAGE);
  const [themesHasMore, setThemesHasMore] = useState(true);

  const [postsPage, setPostsPage] = useState(PAGINATION_DEFAULT_PAGE);
  const [postsHasMore, setPostsHasMore] = useState(true);
  const hasAIThemes = allThemes.some((theme) => theme.source === "ai");
  const isOwner = community?.role === "owner";

  const fetchThemes = async (page = PAGINATION_DEFAULT_PAGE) => {
    const [res, nextPageRes] = await Promise.all([
      url.get(
        `/api/themes?communityId=${id}&page=${page}&limit=${PAGINATION_DEFAULT_LIMIT}`
      ),
      url.get(
        `/api/themes?communityId=${id}&page=${page + 1}&limit=${PAGINATION_DEFAULT_LIMIT}`
      ),
    ]);
    const data = res.data.themes || [];
    const nextPageData = nextPageRes.data.themes || [];

    setThemes(data);
    setThemesPage(page);
    setThemesHasMore(nextPageData.length > 0);
  };

  const fetchAllThemes = async () => {
    const res = await url.get(
      `/api/themes?communityId=${id}&limit=${THEMES_ALL_FETCH_LIMIT}`
    );
    setAllThemes(res.data.themes || []);
  };

  const fetchPosts = async (themeId?: string, page = PAGINATION_DEFAULT_PAGE) => {
    const query = themeId
      ? `?themeId=${themeId}&page=${page}&limit=${PAGINATION_DEFAULT_LIMIT}`
      : `?communityId=${id}&page=${page}&limit=${PAGINATION_DEFAULT_LIMIT}`;

    const res = await url.get(`/api/posts${query}`);
    const data = res.data.posts || [];

    setPosts(data);
    setPostsPage(page);
    setPostsHasMore(hasNextPageByLength(data.length, PAGINATION_DEFAULT_LIMIT));
  };

  useEffect(() => {
    const init = async () => {
      const [communityRes, themesRes, nextThemesRes, postsRes, allThemesRes] = await Promise.all([
        url.get(`/api/community/${id}`),
        url.get(
          `/api/themes?communityId=${id}&page=${PAGINATION_DEFAULT_PAGE}&limit=${PAGINATION_DEFAULT_LIMIT}`
        ),
        url.get(
          `/api/themes?communityId=${id}&page=${PAGINATION_DEFAULT_PAGE + 1}&limit=${PAGINATION_DEFAULT_LIMIT}`
        ),
        url.get(
          `/api/posts?communityId=${id}&page=${PAGINATION_DEFAULT_PAGE}&limit=${PAGINATION_DEFAULT_LIMIT}`
        ),
        url.get(`/api/themes?communityId=${id}&limit=${THEMES_ALL_FETCH_LIMIT}`),
      ]);

      const initialThemes = themesRes.data.themes || [];
      const nextThemes = nextThemesRes.data.themes || [];
      const initialPosts = postsRes.data.posts || [];

      setCommunity(communityRes.data.community);
      setThemes(initialThemes);
      setThemesPage(PAGINATION_DEFAULT_PAGE);
      setThemesHasMore(nextThemes.length > 0);
      setPosts(initialPosts);
      setPostsPage(PAGINATION_DEFAULT_PAGE);
      setPostsHasMore(hasNextPageByLength(initialPosts.length, PAGINATION_DEFAULT_LIMIT));
      setAllThemes(allThemesRes.data.themes || []);
    };

    init();
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (activeTab === "posts" && posts.some((post) => !post.imageUrl)) {
        fetchPosts(selectedThemeFilter === "all" ? undefined : selectedThemeFilter, postsPage).catch((error) => {
          console.error("Failed to refresh posts", error);
        });
      }
    }, 8000);

    return () => clearInterval(timer);
  }, [activeTab, posts, postsPage, selectedThemeFilter, themesPage]);

  useEffect(() => {
    const timer = setInterval(() => {
      Promise.all([
        url.get(`/api/community/${id}`),
        url.get(
          `/api/themes?communityId=${id}&page=${themesPage}&limit=${PAGINATION_DEFAULT_LIMIT}`
        ),
        url.get(
          `/api/themes?communityId=${id}&page=${themesPage + 1}&limit=${PAGINATION_DEFAULT_LIMIT}`
        ),
        url.get(`/api/themes?communityId=${id}&limit=${THEMES_ALL_FETCH_LIMIT}`),
      ])
        .then(([communityRes, themesRes, nextThemesRes, allThemesRes]) => {
          const refreshedThemes = themesRes.data.themes || [];
          const refreshedNextThemes = nextThemesRes.data.themes || [];
          setCommunity(communityRes.data.community);
          setThemes(refreshedThemes);
          setThemesHasMore(refreshedNextThemes.length > 0);
          setAllThemes(allThemesRes.data.themes || []);
        })
        .catch(() => {
          // Silent background refresh failure; user actions still show explicit errors.
        });
    }, 8000);

    return () => clearInterval(timer);
  }, [id, themesPage]);

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
      setBanner("Themes generated successfully.");// remove banner and we will implement a toast notification.
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
    if (!isOwner) {
      setBannerType("error");
      setBanner("Only community owner can add custom themes.");
      return;
    }

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
    if (generatingPostsThemeId) return;

    setGeneratingPostsThemeId(theme.id);
    setGeneratingPostsThemeTitle(theme.title);
    setBanner(null);
    setSelectedThemeFilter(theme.id);
    setPosts([]);
    setPostsPage(PAGINATION_DEFAULT_PAGE);
    setPostsHasMore(false);
    setActiveTab("posts");

    try {
      await url.post(
        "/api/posts/generate",
        { themeId: theme.id },
        { timeout: 130000 }
      );

      await fetchPosts(theme.id, 1);
      setBannerType("success");
      setBanner(`AI posts generated for "${theme.title}".`);
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      const message =
        err.code === "ECONNABORTED"
          ? "Post generation timed out. Please try again."
          : err.response?.data?.message || "Failed to generate posts.";
      setBannerType("error");
      setBanner(message);
    } finally {
      setGeneratingPostsThemeId(null);
      setGeneratingPostsThemeTitle(null);
    }
  };

  const deletePost = async (postId: string) => {
    await url.delete(`/api/posts/${postId}`);
    await fetchPosts(selectedThemeFilter === "all" ? undefined : selectedThemeFilter, postsPage);
  };

  const regeneratePost = async (postId: string) => {
    if (regeneratingPostId) return;

    setRegeneratingPostId(postId);
    try {
      const res = await url.patch(`/api/posts/${postId}/regenerate`);
      const updated = res.data?.post as { id?: string; title?: string; content?: string } | undefined;

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                title: updated?.title ?? post.title,
                content: updated?.content ?? post.content,
              }
            : post
        )
      );
    } finally {
      setRegeneratingPostId(null);
    }
  };

  const updatePost = async () => {
    if (!editingPostId) return;

    const postId = editingPostId;
    const newContent = editPrompt;

    await url.put(`/api/posts/${postId}`, { content: newContent });

    setPosts((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, content: newContent } : post))
    );

    setEditingPostId(null);
    setEditPrompt("");
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
            {community.imageUrl ? (
              <img
                src={community.imageUrl}
                alt={community.name}
                className="mb-3 h-40 w-full max-w-xl rounded-xl object-cover"
              />
            ) : null}
            <h1 className="text-2xl font-semibold text-[#111827]">{community.name}</h1>
            <p className="mt-1 text-sm text-[#6b7280]">{community.description}</p>
          </div>

          <div className="flex gap-2">
            {community.role === "owner" && (
              <button
                onClick={() => router.push(`/community/${id}/admin`)}
                className="btn-secondary px-5 py-2.5 text-sm"
              >
                Admin Panel
              </button>
            )}
            <button onClick={() => setShowInvite(true)} className="btn-primary px-5 py-2.5 text-sm">
              Invite Members
            </button>
          </div>
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
            {generatingPostsThemeId && (
              <div className="panel mb-4 rounded-xl p-4 text-sm text-[#4b5563]">
                Generating posts for {generatingPostsThemeTitle || "selected theme"}... please wait.
              </div>
            )}

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

            {posts.length === 0 && !generatingPostsThemeId && (
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
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-block rounded-full bg-[#eef2ff] px-3 py-1 text-xs text-[#4f5fcf]">
                        {post.themeTitle}
                      </span>
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs ${
                          post.status === "approved"
                            ? "bg-emerald-50 text-emerald-700"
                            : post.status === "rejected"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {post.status || "pending"}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-[#111827]">{post.title}</h3>

                    {post.imageUrl ? (
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="h-52 w-full rounded-lg object-cover"
                      />
                    ) : (
                      <div className="rounded-lg border border-dashed border-[#d1d5db] bg-white/50 px-3 py-4 text-xs text-[#6b7280]">
                        Image generating...
                      </div>
                    )}

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
                      <div className="space-y-2">
                        <p className="text-sm text-[#4b5563]">{post.content}</p>
                        {post.status === "rejected" && post.rejectionReason ? (
                          <p className="text-xs text-rose-700">
                            Rejection reason: {post.rejectionReason}
                          </p>
                        ) : null}
                      </div>
                    )}

                    {editingPostId !== post.id && (
                      <>
                        {post.status === "approved" ? (
                          <div className="flex justify-end">
                            <button className="btn-primary px-4 py-2 text-sm">Schedule</button>
                          </div>
                        ) : (
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
                            <button
                              onClick={() => regeneratePost(post.id)}
                              disabled={regeneratingPostId === post.id}
                              className="text-[#4f5fcf] disabled:opacity-60"
                            >
                              {regeneratingPostId === post.id ? "Regenerating..." : "Regenerate"}
                            </button>
                          </div>
                        )}
                      </>
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

              {isOwner && (
                <button
                  onClick={() => setShowCustomForm((prev) => !prev)}
                  className="btn-secondary px-5 py-2 text-sm"
                >
                  + Add Custom Theme
                </button>
              )}
            </div>

            {isOwner && showCustomForm && (
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
                  <div className="mb-2 flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-[#eef2ff] px-2 py-1 text-[#4f5fcf]">
                      {theme.source === "ai" ? "AI" : "Custom"}
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 ${
                        theme.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : theme.status === "inactive"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {theme.status === "active" ? "approved" : theme.status || "pending"}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-[#111827]">{theme.title}</h3>
                  <p className="text-sm text-[#6b7280]">{theme.description}</p>
                </div>

                <button
                  onClick={() => generatePosts(theme)}
                  disabled={generatingPostsThemeId === theme.id || theme.status !== "active"}
                  className="btn-secondary px-4 py-2 text-sm font-medium text-[#4f5fcf] disabled:opacity-60"
                >
                  {theme.status !== "active"
                    ? "Waiting Admin Approval"
                    : generatingPostsThemeId === theme.id
                      ? "Generating..."
                      : "Generate Posts"}
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
