"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { url } from "@/lib/axiosInstance";
import { AxiosError } from "axios";

type Community = {
  id: string;
  name: string;
  description: string;
  role?: "owner" | "member";
};

type Theme = {
  id: string;
  title: string;
  description: string;
  source?: "ai" | "custom";
  status?: "pending" | "active" | "inactive" | "deleted";
  createdAt?: string;
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

type ThemeDetail = {
  theme: Theme;
  posts: Post[];
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
};

export default function CommunityAdminPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [community, setCommunity] = useState<Community | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [themeDetail, setThemeDetail] = useState<ThemeDetail | null>(null);
  const [activeTab, setActiveTab] = useState<"themes" | "posts">("themes");
  const [banner, setBanner] = useState<string | null>(null);
  const [bannerType, setBannerType] = useState<"success" | "error">("success");
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [editTheme, setEditTheme] = useState({ title: "", description: "" });

  const fetchAll = async () => {
    const [communityRes, themesRes, postsRes] = await Promise.all([
      url.get(`/api/community/${id}`),
      url.get(`/api/themes?communityId=${id}&status=pending,active,inactive&limit=1000`),
      url.get(`/api/posts?communityId=${id}&status=pending,approved,rejected&limit=1000`),
    ]);

    const communityData = communityRes.data.community as Community;
    if (communityData.role !== "owner") {
      router.push(`/community/${id}`);
      return;
    }

    setCommunity(communityData);
    setThemes(themesRes.data.themes || []);
    setPosts(postsRes.data.posts || []);
  };

  useEffect(() => {
    fetchAll().catch((error) => {
      console.error(error);
      router.push(`/community/${id}`);
    });
  }, [id, router]);

  const updateThemeStatus = async (themeId: string, status: "active" | "inactive") => {
    try {
      await url.patch(`/api/themes/${themeId}/status`, { status });
      setBannerType("success");
      setBanner(`Theme ${status === "active" ? "activated" : "deactivated"} successfully.`);
      await fetchAll();
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      setBannerType("error");
      setBanner(err.response?.data?.message || "Failed to update theme status.");
    }
  };

  const deleteTheme = async (themeId: string) => {
    try {
      await url.delete(`/api/themes/${themeId}`);
      setBannerType("success");
      setBanner("Theme deleted from active flow.");
      if (themeDetail?.theme.id === themeId) {
        setThemeDetail(null);
      }
      await fetchAll();
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      setBannerType("error");
      setBanner(err.response?.data?.message || "Failed to delete theme.");
    }
  };

  const openThemeDetail = async (themeId: string) => {
    try {
      const res = await url.get(`/api/themes/${themeId}/detail`);
      setThemeDetail({
        theme: res.data.theme,
        posts: res.data.posts || [],
        stats: res.data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 },
      });
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      setBannerType("error");
      setBanner(err.response?.data?.message || "Failed to load theme detail.");
    }
  };

  const saveThemeEdit = async () => {
    if (!editingThemeId) return;
    try {
      await url.put(`/api/themes/${editingThemeId}`, editTheme);
      setEditingThemeId(null);
      setEditTheme({ title: "", description: "" });
      setBannerType("success");
      setBanner("Theme updated.");
      await fetchAll();
      if (themeDetail?.theme.id === editingThemeId) {
        await openThemeDetail(editingThemeId);
      }
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      setBannerType("error");
      setBanner(err.response?.data?.message || "Failed to update theme.");
    }
  };

  const reviewPost = async (postId: string, status: "approved" | "rejected") => {
    try {
      const rejectionReason =
        status === "rejected"
          ? window.prompt("Enter rejection reason") || ""
          : undefined;

      await url.patch(`/api/posts/${postId}/review`, { status, rejectionReason });
      setBannerType("success");
      setBanner(status === "approved" ? "Post approved." : "Post rejected.");
      await fetchAll();
      if (themeDetail) {
        await openThemeDetail(themeDetail.theme.id);
      }
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      setBannerType("error");
      setBanner(err.response?.data?.message || "Failed to review post.");
    }
  };

  if (!community) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#6b7280]">
        Loading admin panel...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-gradient px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="panel flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#111827]">Community Admin Panel</h1>
            <p className="text-sm text-[#6b7280]">
              {community.name}: Review themes and posts before publishing workflow.
            </p>
          </div>
          <button onClick={() => router.push(`/community/${id}`)} className="btn-secondary px-4 py-2 text-sm">
            Back to Community
          </button>
        </div>

        {banner && (
          <div
            className={`rounded-xl px-4 py-3 text-sm ${
              bannerType === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {banner}
          </div>
        )}

        <div className="tab-shell flex gap-2">
          <button
            onClick={() => setActiveTab("themes")}
            className={`tab-btn flex-1 ${activeTab === "themes" ? "tab-btn-active" : ""}`}
          >
            Theme Management
          </button>
          <button
            onClick={() => setActiveTab("posts")}
            className={`tab-btn flex-1 ${activeTab === "posts" ? "tab-btn-active" : ""}`}
          >
            Post Review
          </button>
        </div>

        {activeTab === "themes" && (
          <div className="space-y-4">
            {themes.map((theme) => (
              <div key={theme.id} className="panel rounded-xl p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-[#eef2ff] px-2 py-1 text-[#4f5fcf]">
                        {theme.source === "ai" ? "AI-suggested" : "Custom"}
                      </span>
                      <span className="rounded-full bg-[#f3f4f6] px-2 py-1 text-[#4b5563]">
                        {theme.status || "pending"}
                      </span>
                      <span className="text-[#6b7280]">
                        Created {theme.createdAt ? new Date(theme.createdAt).toLocaleDateString() : "-"}
                      </span>
                      <span className="text-[#6b7280]">Posts: {theme.postCount || 0}</span>
                    </div>

                    <h3 className="text-lg font-semibold text-[#111827]">{theme.title}</h3>
                    <p className="text-sm text-[#6b7280]">{theme.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => openThemeDetail(theme.id)} className="btn-secondary px-3 py-2 text-xs">
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        setEditingThemeId(theme.id);
                        setEditTheme({
                          title: theme.title,
                          description: theme.description,
                        });
                      }}
                      className="btn-secondary px-3 py-2 text-xs"
                    >
                      Edit
                    </button>
                    {theme.status !== "active" ? (
                      <button
                        onClick={() => updateThemeStatus(theme.id, "active")}
                        className="btn-primary px-3 py-2 text-xs"
                      >
                        Activate
                      </button>
                    ) : (
                      <button
                        onClick={() => updateThemeStatus(theme.id, "inactive")}
                        className="btn-secondary px-3 py-2 text-xs"
                      >
                        Deactivate
                      </button>
                    )}
                    <button
                      onClick={() => deleteTheme(theme.id)}
                      className="btn-secondary px-3 py-2 text-xs text-rose-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {editingThemeId && (
              <div className="panel space-y-3 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-[#111827]">Edit Theme</h3>
                <input
                  value={editTheme.title}
                  onChange={(e) => setEditTheme((prev) => ({ ...prev, title: e.target.value }))}
                  className="input-field"
                  placeholder="Theme title"
                />
                <textarea
                  value={editTheme.description}
                  onChange={(e) =>
                    setEditTheme((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="input-field"
                  placeholder="Theme description"
                />
                <div className="flex gap-2">
                  <button onClick={saveThemeEdit} className="btn-primary px-4 py-2 text-sm">
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingThemeId(null);
                      setEditTheme({ title: "", description: "" });
                    }}
                    className="btn-secondary px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {themeDetail && (
              <div className="panel space-y-4 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-[#111827]">
                  {themeDetail.theme.title} - Detail
                </h3>
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-[#e5e7eb] bg-white/70 p-3 text-sm">
                    Total: {themeDetail.stats.total}
                  </div>
                  <div className="rounded-lg border border-[#e5e7eb] bg-white/70 p-3 text-sm">
                    Pending: {themeDetail.stats.pending}
                  </div>
                  <div className="rounded-lg border border-[#e5e7eb] bg-white/70 p-3 text-sm">
                    Approved: {themeDetail.stats.approved}
                  </div>
                  <div className="rounded-lg border border-[#e5e7eb] bg-white/70 p-3 text-sm">
                    Rejected: {themeDetail.stats.rejected}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "posts" && (
          <div className="grid gap-4 md:grid-cols-2">
            {posts.map((post) => (
              <div key={post.id} className="panel space-y-3 rounded-xl p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-[#eef2ff] px-2 py-1 text-[#4f5fcf]">
                    {post.themeTitle}
                  </span>
                  <span className="rounded-full bg-[#f3f4f6] px-2 py-1 text-[#4b5563]">
                    {post.status || "pending"}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-[#111827]">{post.title}</h3>
                {post.imageUrl ? (
                  <img src={post.imageUrl} alt={post.title} className="h-52 w-full rounded-lg object-cover" />
                ) : null}
                <p className="text-sm text-[#4b5563]">{post.content}</p>
                {post.status === "rejected" && post.rejectionReason ? (
                  <p className="text-xs text-rose-700">Reason: {post.rejectionReason}</p>
                ) : null}

                <div className="flex gap-2">
                  <button
                    onClick={() => reviewPost(post.id, "approved")}
                    className="btn-primary px-3 py-2 text-xs"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => reviewPost(post.id, "rejected")}
                    className="btn-secondary px-3 py-2 text-xs text-rose-600"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

