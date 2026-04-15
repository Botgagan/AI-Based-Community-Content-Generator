"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { url } from "@/lib/axiosInstance";
import FilterSelect from "@/components/FilterSelect";
import { useUI } from "@/components/UIProvider";
import PageLoader from "@/components/PageLoader";
import ThemeFormModal from "@/components/ThemeFormModal";
import { AxiosError } from "axios";

type Community = {
  id: string;
  name: string;
  description: string;
  role?: "owner" | "admin" | "member";
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

type AdminStats = {
  members: number;
  invitedUsers: number;
  themesGenerated: number;
  themesApproved: number;
  themesPending: number;
  postsGenerated: number;
  postsApproved: number;
  postsPending: number;
};

const defaultAdminStats: AdminStats = {
  members: 0,
  invitedUsers: 0,
  themesGenerated: 0,
  themesApproved: 0,
  themesPending: 0,
  postsGenerated: 0,
  postsApproved: 0,
  postsPending: 0,
};

function themePriority(status?: Theme["status"]) {
  if (status === "pending") return 0;
  if (status === "active") return 1;
  if (status === "inactive") return 2;
  return 3;
}

function postPriority(status?: Post["status"]) {
  if (status === "pending") return 0;
  if (status === "rejected") return 1;
  if (status === "approved") return 2;
  return 3;
}

const reviewIconButtonClass =
  "flex h-8 w-8 items-center justify-center rounded-full border border-[#d0d5dd] bg-white text-[#374151] transition hover:bg-[#f3f4f6]";

function ApproveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 7L9 18l-5-5" />
    </svg>
  );
}

function RejectIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export default function CommunityAdminPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { toast, confirm, prompt, showLoader, hideLoader } = useUI();

  const [community, setCommunity] = useState<Community | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<AdminStats>(defaultAdminStats);

  const [activeTab, setActiveTab] = useState<"themes" | "posts">("themes");
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);

  const [themeSearch, setThemeSearch] = useState("");
  const [postSearch, setPostSearch] = useState("");
  const [themeStatusFilter, setThemeStatusFilter] = useState<"all" | "pending" | "active" | "inactive">("all");
  const [postStatusFilter, setPostStatusFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [postThemeFilter, setPostThemeFilter] = useState<"all" | string>("all");

  const fetchAll = useCallback(async () => {
    const [communityRes, themesRes, postsRes, statsRes] = await Promise.all([
      url.get(`/api/community/${id}`),
      url.get(`/api/themes?communityId=${id}&status=pending,active,inactive&limit=2000`),
      url.get(`/api/posts?communityId=${id}&status=pending,approved,rejected&limit=2000`),
      url.get(`/api/community/${id}/admin-stats`),
    ]);

    const communityData = communityRes.data.community as Community;
    if (communityData.role !== "owner" && communityData.role !== "admin") {
      router.push(`/community/${id}`);
      return;
    }

    setCommunity(communityData);
    setThemes(themesRes.data.themes || []);
    setPosts(postsRes.data.posts || []);
    setStats(statsRes.data?.stats || defaultAdminStats);
  }, [id, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchAll().catch((error) => {
        console.error(error);
        router.push(`/community/${id}`);
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchAll, id, router]);

  const updateThemeStatus = async (themeId: string, status: "active" | "inactive") => {
    const shouldProceed = await confirm({
      title: status === "active" ? "Activate theme?" : "Deactivate theme?",
      description:
        status === "active"
          ? "Theme will be available for post generation."
          : "Theme will be paused for post generation.",
      confirmText: status === "active" ? "Activate" : "Deactivate",
    });
    if (!shouldProceed) return;

    try {
      showLoader();
      await url.patch(`/api/themes/${themeId}/status`, { status });
      await fetchAll();
      toast({ title: "Theme updated", variant: "success" });
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast({ title: "Update failed", description: err.response?.data?.message || "Failed to update theme status.", variant: "error" });
    } finally {
      hideLoader();
    }
  };

  const deleteTheme = async (themeId: string) => {
    const shouldDelete = await confirm({
      title: "Delete theme?",
      description: "All related generated posts may become inaccessible.",
      confirmText: "Delete",
      danger: true,
    });
    if (!shouldDelete) return;

    try {
      showLoader();
      await url.delete(`/api/themes/${themeId}`);
      await fetchAll();
      toast({ title: "Theme deleted", variant: "success" });
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast({ title: "Delete failed", description: err.response?.data?.message || "Failed to delete theme.", variant: "error" });
    } finally {
      hideLoader();
    }
  };

  const saveThemeEdit = async (values: { title: string; description: string }) => {
    if (!editingTheme) return;
    try {
      showLoader();
      await url.put(`/api/themes/${editingTheme.id}`, values);
      setEditingTheme(null);
      await fetchAll();
      toast({ title: "Theme saved", variant: "success" });
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast({ title: "Save failed", description: err.response?.data?.message || "Failed to update theme.", variant: "error" });
    } finally {
      hideLoader();
    }
  };

  const reviewPost = async (postId: string, status: "approved" | "rejected") => {
    try {
      if (status === "approved") {
        const shouldApprove = await confirm({
          title: "Approve post?",
          description: "This post will be marked as approved.",
          confirmText: "Approve",
        });
        if (!shouldApprove) return;
      }

      const rejectionReasonInput =
        status === "rejected"
          ? (await prompt({
              title: "Reject Post",
              description: "Add a rejection reason.",
              placeholder: "Enter rejection reason",
              confirmText: "Reject",
            })) || ""
          : "";

      if (status === "rejected" && !rejectionReasonInput.trim()) {
        toast({ title: "Reason required", description: "Please enter rejection reason.", variant: "error" });
        return;
      }

      showLoader();
      const rejectionReason = status === "rejected" ? rejectionReasonInput : undefined;
      await url.patch(`/api/posts/${postId}/review`, { status, rejectionReason });
      await fetchAll();
      toast({ title: status === "approved" ? "Post approved" : "Post rejected", variant: "success" });
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast({ title: "Review failed", description: err.response?.data?.message || "Failed to review post.", variant: "error" });
    } finally {
      hideLoader();
    }
  };

  const filteredThemes = useMemo(() => {
    const query = themeSearch.trim().toLowerCase();

    return [...themes]
      .filter((theme) => {
        if (themeStatusFilter !== "all" && theme.status !== themeStatusFilter) return false;
        if (!query) return true;
        return (
          theme.title.toLowerCase().includes(query) ||
          theme.description.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => themePriority(a.status) - themePriority(b.status));
  }, [themes, themeSearch, themeStatusFilter]);

  const filteredPosts = useMemo(() => {
    const query = postSearch.trim().toLowerCase();

    return [...posts]
      .filter((post) => {
        if (postStatusFilter !== "all" && post.status !== postStatusFilter) return false;
        if (postThemeFilter !== "all" && post.themeId !== postThemeFilter) return false;
        if (!query) return true;

        return (
          post.title.toLowerCase().includes(query) ||
          post.content.toLowerCase().includes(query) ||
          post.themeTitle.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => postPriority(a.status) - postPriority(b.status));
  }, [posts, postSearch, postStatusFilter, postThemeFilter]);

  const postThemeOptions = useMemo(
    () => [
      { value: "all", label: "All themes" },
      ...themes.map((theme) => ({ value: theme.id, label: theme.title })),
    ],
    [themes]
  );

  if (!community) {
    return <PageLoader label="Loading admin panel..." />;
  }

  return (
    <div className="px-1 py-2">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="panel overflow-hidden p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-[-0.02em] text-[#1d1d1f]">{community.name} Admin Panel</h1>
            </div>
            <button onClick={() => router.push(`/community/${id}`)} className="btn-secondary px-5 py-2 text-sm">
              Back to Community
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="panel rounded-[8px] p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-[rgba(0,0,0,0.48)]">Members</p>
            <p className="mt-2 text-3xl font-black tracking-[-0.02em] text-[#1d1d1f]">{stats.members}</p>
            <p className="mt-1 text-xs text-[rgba(0,0,0,0.48)]">Invited Users: {stats.invitedUsers}</p>
          </div>

          <div className="panel rounded-[8px] p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-[rgba(0,0,0,0.48)]">Themes</p>
            <p className="mt-2 text-3xl font-black tracking-[-0.02em] text-[#1d1d1f]">{stats.themesGenerated}</p>
            <p className="mt-1 text-xs text-[rgba(0,0,0,0.48)]">Approved: {stats.themesApproved} | Pending: {stats.themesPending}</p>
          </div>

          <div className="panel rounded-[8px] p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-[rgba(0,0,0,0.48)]">Posts</p>
            <p className="mt-2 text-3xl font-black tracking-[-0.02em] text-[#1d1d1f]">{stats.postsGenerated}</p>
            <p className="mt-1 text-xs text-[rgba(0,0,0,0.48)]">Approved: {stats.postsApproved} | Pending: {stats.postsPending}</p>
          </div>

          <div className="panel rounded-[8px] p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-[rgba(0,0,0,0.48)]">Queue Focus</p>
            <p className="mt-2 text-3xl font-black tracking-[-0.02em] text-[#1d1d1f]">{stats.themesPending + stats.postsPending}</p>
            <p className="mt-1 text-xs text-[rgba(0,0,0,0.48)]">Total pending approvals right now</p>
          </div>
        </div>

        <div className="tab-shell flex w-full gap-2 sm:w-auto sm:max-w-md">
          <button onClick={() => setActiveTab("themes")} className={`tab-btn flex-1 ${activeTab === "themes" ? "tab-btn-active" : ""}`}>
            Theme Management ({filteredThemes.length})
          </button>
          <button onClick={() => setActiveTab("posts")} className={`tab-btn flex-1 ${activeTab === "posts" ? "tab-btn-active" : ""}`}>
            Post Review ({filteredPosts.length})
          </button>
        </div>

        {activeTab === "themes" && (
          <div className="space-y-4">
            <div className="panel rounded-[8px] p-4">
              <div className="grid gap-3 lg:grid-cols-3">
                <input
                  value={themeSearch}
                  onChange={(e) => setThemeSearch(e.target.value)}
                  className="input-field"
                  placeholder="Search themes by title or description"
                />

                <FilterSelect
                  value={themeStatusFilter}
                  onChange={(value) =>
                    setThemeStatusFilter(value as "all" | "pending" | "active" | "inactive")
                  }
                  options={[
                    { value: "all", label: "All statuses" },
                    { value: "pending", label: "Pending first" },
                    { value: "active", label: "Active only" },
                    { value: "inactive", label: "Inactive only" },
                  ]}
                />

                <div className="rounded-[8px] border border-white/60 bg-[#f5f5f7] px-4 py-3 text-sm text-[rgba(0,0,0,0.8)]">
                  Showing {filteredThemes.length} of {themes.length} themes
                </div>
              </div>
            </div>

            {filteredThemes.length === 0 ? (
              <div className="panel rounded-[8px] p-10 text-center text-[rgba(0,0,0,0.8)]">No themes match this search/filter.</div>
            ) : (
              filteredThemes.map((theme) => (
                <div key={theme.id} className="panel rounded-[8px] p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-[#f5f5f7] px-2.5 py-1 font-semibold text-[#0066cc]">
                          {theme.source === "ai" ? "AI-suggested" : "Custom"}
                        </span>
                        <span className="rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[rgba(0,0,0,0.8)]">{theme.status || "pending"}</span>
                        <span className="text-[rgba(0,0,0,0.8)]">Posts: {theme.postCount || 0}</span>
                      </div>

                      <h3 className="text-xl font-bold tracking-[-0.02em] text-[#1d1d1f]">{theme.title}</h3>
                      <p className="text-sm text-[rgba(0,0,0,0.8)]">{theme.description}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setEditingTheme(theme)}
                        className="btn-secondary px-3 py-2 text-xs"
                      >
                        Edit
                      </button>
                      {theme.status !== "active" ? (
                        <button onClick={() => updateThemeStatus(theme.id, "active")} className="btn-primary px-3 py-2 text-xs">
                          Activate
                        </button>
                      ) : (
                        <button onClick={() => updateThemeStatus(theme.id, "inactive")} className="btn-secondary px-3 py-2 text-xs">
                          Deactivate
                        </button>
                      )}
                      <button onClick={() => deleteTheme(theme.id)} className="btn-secondary px-3 py-2 text-xs text-[#0066cc]">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "posts" && (
          <div className="space-y-4">
            <div className="panel rounded-[8px] p-4">
              <div className="grid gap-3 lg:grid-cols-4">
                <input
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.target.value)}
                  className="input-field lg:col-span-2"
                  placeholder="Search posts by title, content, or theme"
                />

                <FilterSelect
                  value={postStatusFilter}
                  onChange={(value) =>
                    setPostStatusFilter(value as "pending" | "approved" | "rejected" | "all")
                  }
                  options={[
                    { value: "pending", label: "Pending first" },
                    { value: "approved", label: "Approved only" },
                    { value: "rejected", label: "Rejected only" },
                    { value: "all", label: "All statuses" },
                  ]}
                />

                <FilterSelect
                  value={postThemeFilter}
                  onChange={setPostThemeFilter}
                  options={postThemeOptions}
                />
              </div>
            </div>

            {filteredPosts.length === 0 ? (
              <div className="panel rounded-[8px] p-10 text-center text-[rgba(0,0,0,0.8)]">No posts match this queue filter.</div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredPosts.map((post) => (
                  <div key={post.id} className="panel relative space-y-3 rounded-[8px] p-5">
                    <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5">
                      {post.status !== "approved" ? (
                        <button
                          onClick={() => reviewPost(post.id, "approved")}
                          className={reviewIconButtonClass}
                          title="Approve"
                        >
                          <ApproveIcon />
                        </button>
                      ) : null}
                      {post.status !== "rejected" ? (
                        <button
                          onClick={() => reviewPost(post.id, "rejected")}
                          className={reviewIconButtonClass}
                          title="Reject"
                        >
                          <RejectIcon />
                        </button>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pr-20 text-xs">
                      <span className="rounded-full bg-[#f5f5f7] px-2.5 py-1 font-semibold text-[#0066cc]">{post.themeTitle}</span>
                      <span className="rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[rgba(0,0,0,0.8)]">{post.status || "pending"}</span>
                    </div>
                    <h3 className="text-xl font-bold tracking-[-0.02em] text-[#1d1d1f]">{post.title}</h3>
                    {post.imageUrl ? <img src={post.imageUrl} alt={post.title} className="h-52 w-full rounded-[8px] object-cover" /> : null}
                    <p className="line-clamp-3 text-sm text-[rgba(0,0,0,0.8)]">{post.content}</p>
                    {post.status === "rejected" && post.rejectionReason ? <p className="text-xs text-[#1d1d1f]">Reason: {post.rejectionReason}</p> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ThemeFormModal
        open={Boolean(editingTheme)}
        title="Edit Theme"
        submitLabel="Save Theme"
        initialValues={
          editingTheme
            ? {
                title: editingTheme.title,
                description: editingTheme.description,
              }
            : undefined
        }
        onClose={() => setEditingTheme(null)}
        onSubmit={saveThemeEdit}
      />
    </div>
  );
}




