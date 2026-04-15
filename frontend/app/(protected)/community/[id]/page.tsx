"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { url } from "@/lib/axiosInstance";
import FilterSelect from "@/components/FilterSelect";
import { useUI } from "@/components/UIProvider";
import PageLoader from "@/components/PageLoader";
import ThemeFormModal from "@/components/ThemeFormModal";
import { Dialog, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
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
  role?: "owner" | "admin" | "member";
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

type PostSchedule = {
  id: string;
  postId: string;
  status: "scheduled" | "ready_to_share" | "shared" | "failed" | "cancelled";
  scheduledAt: string;
  userTimezone: string;
  facebookShareUrl?: string | null;
  errorMessage?: string | null;
};

const iconActionButtonClass =
  "flex h-8 w-8 items-center justify-center rounded-full border border-[#d0d5dd] bg-white text-[#374151] transition hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-60";

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 20h4l10-10-4-4L4 16v4z" />
      <path d="M12 6l4 4" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}

function RegenerateIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12a9 9 0 0 1 15.36-6.36L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.36 6.36L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 5h5v5" />
      <path d="M10 14L19 5" />
      <path d="M19 14v5h-5" />
      <path d="M5 10V5h5" />
      <path d="M5 19h5v-5" />
    </svg>
  );
}

export default function CommunityDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { toast, confirm, openInviteModal, showLoader, hideLoader } = useUI();

  const [community, setCommunity] = useState<Community | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [allThemes, setAllThemes] = useState<Theme[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  const [activeTab, setActiveTab] = useState<"themes" | "posts">("posts");
  const [selectedThemeFilter, setSelectedThemeFilter] = useState("all");

  const [showCustomThemeModal, setShowCustomThemeModal] = useState(false);
  const [showGeneratePostsModal, setShowGeneratePostsModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedApprovedThemeId, setSelectedApprovedThemeId] = useState<string>("");
  const [selectedSchedulePostId, setSelectedSchedulePostId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
  const [postSchedules, setPostSchedules] = useState<Record<string, PostSchedule>>({});

  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [regeneratingPostId, setRegeneratingPostId] = useState<string | null>(null);

  const [isGeneratingThemes, setIsGeneratingThemes] = useState(false);
  const [generatingPostsThemeId, setGeneratingPostsThemeId] = useState<string | null>(null);
  const [generatingPostsThemeTitle, setGeneratingPostsThemeTitle] = useState<string | null>(null);

  const [themesPage, setThemesPage] = useState(PAGINATION_DEFAULT_PAGE);
  const [themesHasMore, setThemesHasMore] = useState(true);

  const [postsPage, setPostsPage] = useState(PAGINATION_DEFAULT_PAGE);
  const [postsHasMore, setPostsHasMore] = useState(true);
  const hasAIThemes = allThemes.some((theme) => theme.source === "ai");
  const activeThemesCount = allThemes.filter((theme) => theme.status === "active").length;
  const pendingPostsCount = posts.filter((post) => post.status === "pending").length;
  const isOwner = community?.role === "owner";
  const canAccessAdminPanel = community?.role === "owner" || community?.role === "admin";
  const themeFilterOptions = useMemo(
    () => [
      { value: "all", label: "All Themes" },
      ...allThemes.map((theme) => ({ value: theme.id, label: theme.title })),
    ],
    [allThemes]
  );
  const approvedThemes = useMemo(
    () => allThemes.filter((theme) => theme.status === "active"),
    [allThemes]
  );
  const selectedSchedulePost = useMemo(
    () => posts.find((post) => post.id === selectedSchedulePostId) || null,
    [posts, selectedSchedulePostId]
  );
  const localTimezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);

  const fetchThemes = async (page = PAGINATION_DEFAULT_PAGE) => {
    const [res, nextPageRes] = await Promise.all([
      url.get(`/api/themes?communityId=${id}&page=${page}&limit=${PAGINATION_DEFAULT_LIMIT}`),
      url.get(`/api/themes?communityId=${id}&page=${page + 1}&limit=${PAGINATION_DEFAULT_LIMIT}`),
    ]);
    const data = res.data.themes || [];
    const nextPageData = nextPageRes.data.themes || [];

    setThemes(data);
    setThemesPage(page);
    setThemesHasMore(nextPageData.length > 0);
  };

  const fetchAllThemes = async () => {
    const res = await url.get(`/api/themes?communityId=${id}&limit=${THEMES_ALL_FETCH_LIMIT}`);
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

  const fetchPostSchedules = async () => {
    const res = await url.get(`/api/posts/schedules?communityId=${id}`);
    const schedules = (res.data.schedules || []) as PostSchedule[];

    const latestByPost: Record<string, PostSchedule> = {};
    for (const schedule of schedules) {
      if (!latestByPost[schedule.postId]) {
        latestByPost[schedule.postId] = schedule;
      }
    }
    setPostSchedules(latestByPost);
  };

  useEffect(() => {
    const init = async () => {
      const [communityRes, themesRes, nextThemesRes, postsRes, allThemesRes, schedulesRes] = await Promise.all([
        url.get(`/api/community/${id}`),
        url.get(`/api/themes?communityId=${id}&page=${PAGINATION_DEFAULT_PAGE}&limit=${PAGINATION_DEFAULT_LIMIT}`),
        url.get(`/api/themes?communityId=${id}&page=${PAGINATION_DEFAULT_PAGE + 1}&limit=${PAGINATION_DEFAULT_LIMIT}`),
        url.get(`/api/posts?communityId=${id}&page=${PAGINATION_DEFAULT_PAGE}&limit=${PAGINATION_DEFAULT_LIMIT}`),
        url.get(`/api/themes?communityId=${id}&limit=${THEMES_ALL_FETCH_LIMIT}`),
        url.get(`/api/posts/schedules?communityId=${id}`),
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
      const schedules = (schedulesRes.data.schedules || []) as PostSchedule[];
      const latestByPost: Record<string, PostSchedule> = {};
      for (const schedule of schedules) {
        if (!latestByPost[schedule.postId]) {
          latestByPost[schedule.postId] = schedule;
        }
      }
      setPostSchedules(latestByPost);
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

      if (activeTab === "posts") {
        fetchPostSchedules().catch((error) => {
          console.error("Failed to refresh schedules", error);
        });
      }
    }, 8000);

    return () => clearInterval(timer);
  }, [activeTab, posts, postsPage, selectedThemeFilter, id]);

  useEffect(() => {
    const timer = setInterval(() => {
      Promise.all([
        url.get(`/api/community/${id}`),
        url.get(`/api/themes?communityId=${id}&page=${themesPage}&limit=${PAGINATION_DEFAULT_LIMIT}`),
        url.get(`/api/themes?communityId=${id}&page=${themesPage + 1}&limit=${PAGINATION_DEFAULT_LIMIT}`),
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
          // ignore
        });
    }, 8000);

    return () => clearInterval(timer);
  }, [id, themesPage]);

  const generateThemes = async () => {
    if (isGeneratingThemes) return;

    setIsGeneratingThemes(true);

    try {
      showLoader();
      await url.post("/api/themes/generate", { communityId: id }, { timeout: 130000 });
      await Promise.all([fetchThemes(1), fetchAllThemes()]);
      toast({ title: "Themes generated", variant: "success" });
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      const message =
        err.code === "ECONNABORTED"
          ? "Theme generation timed out. Please try again."
          : err.response?.data?.message || "Failed to generate themes.";
      toast({ title: "Theme generation failed", description: message, variant: "error" });
    } finally {
      setIsGeneratingThemes(false);
      hideLoader();
    }
  };

  const addCustomTheme = async (values: { title: string; description: string }) => {
    if (!isOwner) {
      toast({ title: "Not allowed", description: "Only community owner can add custom themes.", variant: "error" });
      return;
    }

    if (!values.title.trim()) return;

    try {
      showLoader();
      await url.post("/api/themes/custom", {
        communityId: id,
        title: values.title,
        description: values.description,
      });

      await Promise.all([fetchThemes(1), fetchAllThemes()]);
      setShowCustomThemeModal(false);
      toast({ title: "Theme added", variant: "success" });
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast({ title: "Add theme failed", description: err.response?.data?.message || "Failed to add custom theme.", variant: "error" });
    } finally {
      hideLoader();
    }
  };

  const generatePosts = async (theme: Theme) => {
    if (generatingPostsThemeId) return;

    setGeneratingPostsThemeId(theme.id);
    setGeneratingPostsThemeTitle(theme.title);
    setSelectedThemeFilter(theme.id);
    setPosts([]);
    setPostsPage(PAGINATION_DEFAULT_PAGE);
    setPostsHasMore(false);
    setActiveTab("posts");

    try {
      showLoader();
      await url.post("/api/posts/generate", { themeId: theme.id }, { timeout: 130000 });
      await fetchPosts(theme.id, 1);
      toast({ title: "Posts generated", variant: "success" });
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      const message =
        err.code === "ECONNABORTED"
          ? "Post generation timed out. Please try again."
          : err.response?.data?.message || "Failed to generate posts.";
      toast({ title: "Post generation failed", description: message, variant: "error" });
    } finally {
      setGeneratingPostsThemeId(null);
      setGeneratingPostsThemeTitle(null);
      hideLoader();
    }
  };

  const handleGeneratePostsFromModal = async () => {
    const theme = approvedThemes.find((item) => item.id === selectedApprovedThemeId);
    if (!theme) {
      toast({ title: "Select a theme", description: "Please select an approved theme first.", variant: "error" });
      return;
    }

    setShowGeneratePostsModal(false);
    await generatePosts(theme);
  };

  const deletePost = async (postId: string) => {
    const shouldDelete = await confirm({
      title: "Delete post?",
      description: "This post will be removed permanently.",
      confirmText: "Delete",
      danger: true,
    });
    if (!shouldDelete) return;

    try {
      showLoader();
      await url.delete(`/api/posts/${postId}`);
      await fetchPosts(selectedThemeFilter === "all" ? undefined : selectedThemeFilter, postsPage);
      toast({ title: "Post deleted", variant: "success" });
    } catch {
      toast({ title: "Delete failed", description: "Failed to delete post.", variant: "error" });
    } finally {
      hideLoader();
    }
  };

  const regeneratePost = async (postId: string) => {
    if (regeneratingPostId) return;

    setRegeneratingPostId(postId);
    try {
      showLoader();
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
      toast({ title: "Post regenerated", variant: "success" });
    } catch {
      toast({ title: "Regenerate failed", description: "Failed to regenerate post.", variant: "error" });
    } finally {
      setRegeneratingPostId(null);
      hideLoader();
    }
  };

  const updatePost = async () => {
    if (!editingPostId) return;

    const postId = editingPostId;
    const newContent = editPrompt;

    try {
      showLoader();
      await url.put(`/api/posts/${postId}`, { content: newContent });
      setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, content: newContent } : post)));
      setEditingPostId(null);
      setEditPrompt("");
      toast({ title: "Post updated", variant: "success" });
    } catch {
      toast({ title: "Update failed", description: "Failed to update post.", variant: "error" });
    } finally {
      hideLoader();
    }
  };

  const openScheduleModal = (postId: string) => {
    const initial = new Date(Date.now() + 10 * 60 * 1000);
    setSelectedSchedulePostId(postId);
    setScheduleDate(initial.toISOString().slice(0, 10));
    setScheduleTime(initial.toTimeString().slice(0, 5));
    setShowScheduleModal(true);
  };

  const submitSchedule = async () => {
    if (!selectedSchedulePostId) return;
    if (!scheduleDate || !scheduleTime) {
      toast({ title: "Date and time required", variant: "error" });
      return;
    }

    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}:00`);
    if (Number.isNaN(scheduledAt.getTime())) {
      toast({ title: "Invalid schedule time", variant: "error" });
      return;
    }

    if (scheduledAt.getTime() <= Date.now()) {
      toast({ title: "Pick a future time", description: "Schedule time must be in the future.", variant: "error" });
      return;
    }

    try {
      setScheduleSubmitting(true);
      await url.post(`/api/posts/${selectedSchedulePostId}/schedule-facebook`, {
        scheduledAt: scheduledAt.toISOString(),
        userTimezone: localTimezone,
      });
      await fetchPostSchedules();
      setShowScheduleModal(false);
      setSelectedSchedulePostId(null);
      toast({ title: "Facebook schedule created", variant: "success" });
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast({ title: "Scheduling failed", description: err.response?.data?.message || "Failed to schedule Facebook post.", variant: "error" });
    } finally {
      setScheduleSubmitting(false);
    }
  };

  const openFacebookShareFromSchedule = async (schedule: PostSchedule) => {
    if (!schedule.facebookShareUrl) {
      toast({ title: "Share link not ready", description: "Please try again shortly.", variant: "error" });
      return;
    }

    window.open(schedule.facebookShareUrl, "_blank", "noopener,noreferrer");

    try {
      await url.patch(`/api/posts/schedules/${schedule.id}/shared`);
      await fetchPostSchedules();
    } catch {
      // non-blocking
    }
  };

  if (!community) {
    return <PageLoader label="Loading community..." />;
  }

  return (
    <div className="px-1 py-2">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="panel rounded-[8px] p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-[rgba(0,0,0,0.48)]">Themes</p>
            <p className="mt-2 text-3xl font-black tracking-[-0.02em] text-[#1d1d1f]">{allThemes.length}</p>
            <p className="mt-1 text-xs text-[rgba(0,0,0,0.48)]">Total themes in this community</p>
          </div>
          <div className="panel rounded-[8px] p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-[rgba(0,0,0,0.48)]">Active Themes</p>
            <p className="mt-2 text-3xl font-black tracking-[-0.02em] text-[#1d1d1f]">{activeThemesCount}</p>
            <p className="mt-1 text-xs text-[rgba(0,0,0,0.48)]">Approved and ready for generation</p>
          </div>
          <div className="panel rounded-[8px] p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-[rgba(0,0,0,0.48)]">Pending Posts</p>
            <p className="mt-2 text-3xl font-black tracking-[-0.02em] text-[#1d1d1f]">{pendingPostsCount}</p>
            <p className="mt-1 text-xs text-[rgba(0,0,0,0.48)]">Posts awaiting approval</p>
          </div>
        </div>

        <div className="panel overflow-hidden p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              {community.imageUrl ? (
                <img src={community.imageUrl} alt={community.name} className="mb-4 h-48 w-full max-w-2xl rounded-[8px] object-cover" />
              ) : null}
              <p className="text-xs uppercase tracking-[0.14em] text-[rgba(0,0,0,0.8)]">Community Workspace</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] text-[#1d1d1f]">{community.name}</h1>
              <p className="mt-1 text-sm text-[rgba(0,0,0,0.8)]">{community.description}</p>
            </div>

            <div className={`grid w-full gap-2 xl:max-w-xl ${canAccessAdminPanel ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
              {canAccessAdminPanel && (
                <button onClick={() => router.push(`/community/${id}/admin`)} className="community-cta community-cta-admin w-full px-5 py-2.5 text-sm">
                  Admin Panel
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedApprovedThemeId(approvedThemes[0]?.id || "");
                  setShowGeneratePostsModal(true);
                }}
                className="community-cta community-cta-generate w-full px-5 py-2.5 text-sm"
              >
                Generate Posts
              </button>
              <button onClick={() => openInviteModal(id)} className="community-cta community-cta-invite w-full px-5 py-2.5 text-sm">
                Invite Members
              </button>
            </div>
          </div>
        </div>

        <div className="tab-shell flex w-full gap-2 sm:w-auto sm:max-w-md">
          <button onClick={() => setActiveTab("posts")} className={`tab-btn flex-1 ${activeTab === "posts" ? "tab-btn-active" : ""}`}>
            Your Posts
          </button>
          <button onClick={() => setActiveTab("themes")} className={`tab-btn flex-1 ${activeTab === "themes" ? "tab-btn-active" : ""}`}>
            Themes
          </button>
        </div>

        {activeTab === "posts" && (
          <div className="space-y-5">
            {generatingPostsThemeId && (
              <div className="panel rounded-[8px] p-4 text-sm text-[rgba(0,0,0,0.8)]">
                Generating posts for {generatingPostsThemeTitle || "selected theme"}. Please wait.
              </div>
            )}

            {allThemes.length > 0 && (
              <div className="flex justify-end">
                <FilterSelect
                  value={selectedThemeFilter}
                  options={themeFilterOptions}
                  onChange={(value) => {
                    setSelectedThemeFilter(value);
                    fetchPosts(value === "all" ? undefined : value, 1);
                  }}
                  className="w-full md:w-72"
                />
              </div>
            )}

            {posts.length === 0 && !generatingPostsThemeId && (
              <div className="panel rounded-[8px] p-12 text-center">
                <p className="mb-5 text-[rgba(0,0,0,0.8)]">
                  {selectedThemeFilter === "all" ? "No posts generated yet." : "No posts generated for this theme."}
                </p>
                {selectedThemeFilter === "all" && (
                  <button onClick={() => setActiveTab("themes")} className="btn-primary px-6 py-2.5">
                    Create from Themes
                  </button>
                )}
              </div>
            )}

            {posts.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {posts.map((post) => {
                  const schedule = postSchedules[post.id];
                  const formattedScheduleTime = schedule?.scheduledAt
                    ? new Date(schedule.scheduledAt).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "";

                  return (
                    <div key={post.id} className="panel relative space-y-3 rounded-[8px] p-5">
                    {editingPostId !== post.id && (
                      <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5">
                        {post.status === "approved" ? (
                          schedule?.status === "ready_to_share" ? (
                            <button
                              onClick={() => openFacebookShareFromSchedule(schedule)}
                              className={iconActionButtonClass}
                              title="Post to Facebook"
                            >
                              <ShareIcon />
                            </button>
                          ) : (
                            <button onClick={() => openScheduleModal(post.id)} className={iconActionButtonClass} title="Schedule">
                              <CalendarIcon />
                            </button>
                          )
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingPostId(post.id);
                                setEditPrompt(post.content);
                              }}
                              className={iconActionButtonClass}
                              title="Edit"
                            >
                              <EditIcon />
                            </button>
                            <button onClick={() => deletePost(post.id)} className={iconActionButtonClass} title="Delete">
                              <DeleteIcon />
                            </button>
                            <button
                              onClick={() => regeneratePost(post.id)}
                              disabled={regeneratingPostId === post.id}
                              className={iconActionButtonClass}
                              title={regeneratingPostId === post.id ? "Regenerating..." : "Regenerate"}
                            >
                              <RegenerateIcon />
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pr-24">
                      <span className="inline-block rounded-full bg-[#f5f5f7] px-3 py-1 text-xs font-semibold text-[#0066cc]">{post.themeTitle}</span>
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                          post.status === "approved"
                            ? "bg-[#f5f5f7] text-[#1d1d1f]"
                            : post.status === "rejected"
                              ? "bg-[#1d1d1f] text-white"
                              : "bg-[#f5f5f7] text-[#1d1d1f]"
                        }`}
                      >
                        {post.status || "pending"}
                      </span>
                      {post.status === "approved" && schedule?.status ? (
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                            schedule.status === "ready_to_share"
                              ? "bg-[#111827] text-white"
                              : schedule.status === "shared"
                                ? "bg-[#dcfce7] text-[#166534]"
                                : schedule.status === "failed"
                                  ? "bg-[#fee2e2] text-[#991b1b]"
                                  : "bg-[#e0e7ff] text-[#3730a3]"
                          }`}
                        >
                          {schedule.status === "scheduled"
                            ? `Scheduled: ${formattedScheduleTime}`
                            : schedule.status === "ready_to_share"
                              ? "Ready to share"
                              : schedule.status === "shared"
                                ? "Shared to Facebook"
                                : schedule.status === "failed"
                                  ? "Schedule failed"
                                  : schedule.status}
                        </span>
                      ) : null}
                    </div>

                    <h3 className="text-xl font-bold tracking-[-0.02em] text-[#1d1d1f]">{post.title}</h3>

                    {post.imageUrl ? (
                      <img src={post.imageUrl} alt={post.title} className="h-52 w-full rounded-[8px] object-cover" />
                    ) : (
                      <div className="rounded-[8px] border border-dashed border-white/70 bg-white/50 px-3 py-4 text-xs text-[rgba(0,0,0,0.8)]">
                        Image generating...
                      </div>
                    )}

                    {editingPostId === post.id ? (
                      <div className="space-y-3">
                        <textarea value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} className="input-field h-28" />

                        <div className="flex gap-2">
                          <button onClick={updatePost} className="btn-primary px-4 py-2 text-sm">
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingPostId(null);
                              setEditPrompt("");
                            }}
                            className="btn-secondary px-4 py-2 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="line-clamp-3 text-sm text-[rgba(0,0,0,0.8)]">{post.content}</p>
                        {post.status === "rejected" && post.rejectionReason ? (
                          <p className="text-xs text-[#1d1d1f]">Rejection reason: {post.rejectionReason}</p>
                        ) : null}
                        {post.status === "approved" && postSchedules[post.id]?.status === "failed" && postSchedules[post.id]?.errorMessage ? (
                          <p className="text-xs text-[#991b1b]">{postSchedules[post.id]?.errorMessage}</p>
                        ) : null}
                      </div>
                    )}

                    </div>
                  );
                })}
              </div>
            )}

            {posts.length > 0 && (
              <div className="mt-2 flex items-center justify-center gap-4">
                <button
                  disabled={postsPage === 1}
                  onClick={() => fetchPosts(selectedThemeFilter === "all" ? undefined : selectedThemeFilter, postsPage - 1)}
                  className="btn-secondary px-5 py-2 disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="rounded-full bg-[#f5f5f7] px-4 py-2 text-sm text-[rgba(0,0,0,0.8)]">Page {postsPage}</span>

                <button
                  disabled={!postsHasMore}
                  onClick={() => fetchPosts(selectedThemeFilter === "all" ? undefined : selectedThemeFilter, postsPage + 1)}
                  className="btn-primary px-5 py-2 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "themes" && (
          <div className="space-y-5">
            <div className="flex flex-wrap justify-end gap-3">
              {!hasAIThemes && (
                <button onClick={generateThemes} disabled={isGeneratingThemes} className="btn-primary px-5 py-2 text-sm disabled:opacity-60">
                  {isGeneratingThemes ? "Generating..." : "Generate Themes"}
                </button>
              )}

              {isOwner && (
                <button onClick={() => setShowCustomThemeModal(true)} className="btn-secondary px-5 py-2 text-sm">
                  + Add Custom Theme
                </button>
              )}
            </div>

            {themes.length === 0 && (
              <div className="panel rounded-[8px] p-12 text-center text-[rgba(0,0,0,0.8)]">No themes yet. Generate AI themes or add a custom theme.</div>
            )}

            {themes.map((theme) => (
              <div key={theme.id} className="panel flex flex-col gap-4 rounded-[8px] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-[#f5f5f7] px-2.5 py-1 font-semibold text-[#0066cc]">
                      {theme.source === "ai" ? "AI" : "Custom"}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 font-semibold ${
                        theme.status === "active"
                          ? "bg-[#f5f5f7] text-[#1d1d1f]"
                          : theme.status === "inactive"
                            ? "bg-[#f5f5f7] text-[#1d1d1f]"
                            : "bg-[#f5f5f7] text-[#1d1d1f]"
                      }`}
                    >
                      {theme.status === "active" ? "approved" : theme.status || "pending"}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold tracking-[-0.02em] text-[#1d1d1f]">{theme.title}</h3>
                  <p className="text-sm text-[rgba(0,0,0,0.8)]">{theme.description}</p>
                </div>

                <button
                  onClick={() => generatePosts(theme)}
                  disabled={generatingPostsThemeId === theme.id || theme.status !== "active"}
                  className="btn-secondary px-4 py-2 text-sm font-semibold text-[#0066cc] disabled:opacity-60"
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
              <div className="mt-2 flex items-center justify-center gap-4">
                <button disabled={themesPage === 1} onClick={() => fetchThemes(themesPage - 1)} className="btn-secondary px-5 py-2 disabled:opacity-40">
                  Previous
                </button>

                <span className="rounded-full bg-[#f5f5f7] px-4 py-2 text-sm text-[rgba(0,0,0,0.8)]">Page {themesPage}</span>

                <button disabled={!themesHasMore} onClick={() => fetchThemes(themesPage + 1)} className="btn-primary px-5 py-2 disabled:opacity-40">
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ThemeFormModal
        open={showCustomThemeModal}
        title="Add Custom Theme"
        submitLabel="Add Theme"
        onClose={() => setShowCustomThemeModal(false)}
        onSubmit={addCustomTheme}
      />
      <Dialog open={showGeneratePostsModal} onClose={() => setShowGeneratePostsModal(false)}>
        <DialogTitle>Generate Posts</DialogTitle>
        <DialogDescription>Select an approved theme to generate posts.</DialogDescription>

        {approvedThemes.length === 0 ? (
          <div className="mt-4 rounded-xl border border-[#d4ddff] bg-[#f8faff] px-4 py-3 text-sm text-[rgba(0,0,0,0.8)]">
            No approved themes available yet.
          </div>
        ) : (
          <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
            {approvedThemes.map((theme) => {
              const selected = selectedApprovedThemeId === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelectedApprovedThemeId(theme.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                    selected
                      ? "border-[#7f96ff] bg-[#eef2ff]"
                      : "border-[#d4ddff] bg-white hover:border-[#a8b8ff]"
                  }`}
                >
                  <p className="text-sm font-semibold text-[#101828]">{theme.title}</p>
                  <p className="line-clamp-2 text-xs text-[#475467]">{theme.description}</p>
                </button>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <button onClick={() => setShowGeneratePostsModal(false)} className="btn-secondary px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            onClick={handleGeneratePostsFromModal}
            disabled={approvedThemes.length === 0 || Boolean(generatingPostsThemeId)}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-60"
          >
            {generatingPostsThemeId ? "Generating..." : "Generate Posts"}
          </button>
        </DialogFooter>
      </Dialog>
      <Dialog
        open={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setSelectedSchedulePostId(null);
        }}
      >
        <DialogTitle>Schedule Facebook Post</DialogTitle>
        <DialogDescription>
          Set the date and time for this approved post. At scheduled time, it will become ready for Facebook sharing.
        </DialogDescription>

        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-[#d4ddff] bg-[#f8faff] px-3 py-2 text-xs text-[#1f2a5f]">
            <p className="font-semibold">{selectedSchedulePost?.title || "Selected post"}</p>
            <p className="mt-1">Timezone: {localTimezone}</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-[#475467]">Date</label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-[#475467]">Time</label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={() => {
              setShowScheduleModal(false);
              setSelectedSchedulePostId(null);
            }}
            className="btn-secondary px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={submitSchedule}
            disabled={scheduleSubmitting}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-60"
          >
            {scheduleSubmitting ? "Scheduling..." : "Schedule Post"}
          </button>
        </DialogFooter>
      </Dialog>

    </div>
  );
}


