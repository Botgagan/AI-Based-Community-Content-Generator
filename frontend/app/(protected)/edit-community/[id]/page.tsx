"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { url } from "@/lib/axiosInstance";
import { uploadImageToCloudinary } from "@/lib/cloudinaryUpload";
import { useUI } from "@/components/UIProvider";
import PageLoader from "@/components/PageLoader";

type CommunityForm = {
  name: string;
  description: string;
  website: string;
  youtube: string;
  twitter: string;
};

type CommunityResponse = {
  id: string;
  name: string;
  description: string;
  websiteUrl?: string | null;
  youtubeUrl?: string | null;
  twitterUrl?: string | null;
  imageUrl?: string | null;
  role?: "owner" | "admin" | "member";
};

export default function EditCommunityPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { toast, showLoader, hideLoader } = useUI();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [existingImageUrl, setExistingImageUrl] = useState<string>("");

  const [form, setForm] = useState<CommunityForm>({
    name: "",
    description: "",
    website: "",
    youtube: "",
    twitter: "",
  });

  useEffect(() => {
    const loadCommunity = async () => {
      try {
        const res = await url.get(`/api/community/${id}`);
        const community = res.data.community as CommunityResponse;

        if (community.role !== "owner") {
          toast({ title: "Not allowed", description: "Only owner can edit this community.", variant: "error" });
          router.push("/dashboard");
          return;
        }

        setForm({
          name: community.name || "",
          description: community.description || "",
          website: community.websiteUrl || "",
          youtube: community.youtubeUrl || "",
          twitter: community.twitterUrl || "",
        });
        setExistingImageUrl(community.imageUrl || "");
      } catch (err) {
        console.error("Load community error:", err);
        toast({ title: "Load failed", description: "Unable to load community details.", variant: "error" });
        router.push("/dashboard");
      } finally {
        setInitialLoading(false);
      }
    };

    loadCommunity();
  }, [id, router, toast]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name as keyof CommunityForm]: value,
    }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    showLoader();

    try {
      let imageUrl = existingImageUrl || undefined;

      if (imageFile) {
        imageUrl = await uploadImageToCloudinary(imageFile, "communities");
      }

      await url.put(`/api/community/${id}`, {
        name: form.name,
        description: form.description,
        websiteUrl: form.website,
        youtubeUrl: form.youtube,
        twitterUrl: form.twitter,
        imageUrl,
      });

      window.dispatchEvent(new Event("community:changed"));
      toast({ title: "Community updated", variant: "success" });
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error("Update community error:", err);
      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : "Failed to update community.";
      toast({ title: "Update failed", description: message, variant: "error" });
    } finally {
      setLoading(false);
      hideLoader();
    }
  };

  if (initialLoading) {
    return <PageLoader label="Loading community details..." />;
  }

  return (
    <div className="px-1 py-2">
      <div className="mx-auto max-w-5xl">
        <div className="panel p-6 sm:p-8">
          <div className="mb-6 rounded-2xl bg-[linear-gradient(120deg,#0f1738,#1b2d74)] p-5 text-white">
            <p className="text-xs uppercase tracking-[0.14em] text-white/70">Community Settings</p>
            <h1 className="mt-1 text-3xl font-bold">Edit Community</h1>
            <p className="mt-1 text-sm text-white/85">Update profile, links, and image for your community.</p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[rgba(0,0,0,0.8)]">Community Name</label>
                <input
                  required
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. ISKCON"
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[rgba(0,0,0,0.8)]">Website URL</label>
                <input
                  type="url"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  placeholder="https://yourcommunity.com"
                  className="input-field"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-[rgba(0,0,0,0.8)]">Description</label>
                <textarea
                  required
                  rows={4}
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Short description..."
                  className="input-field"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-[rgba(0,0,0,0.8)]">Community Image</label>
                <input type="file" accept="image/*" onChange={handleImageChange} className="input-field" />
                {(imagePreview || existingImageUrl) && (
                  <img
                    src={imagePreview || existingImageUrl}
                    alt="Community preview"
                    className="mt-3 h-44 w-full rounded-[8px] object-cover"
                  />
                )}
              </div>

              <div className="lg:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-[rgba(0,0,0,0.8)]">Social Presence</label>
                <input
                  type="url"
                  name="youtube"
                  value={form.youtube}
                  onChange={handleChange}
                  placeholder="YouTube URL"
                  className="input-field mb-3"
                />
                <input
                  type="url"
                  name="twitter"
                  value={form.twitter}
                  onChange={handleChange}
                  placeholder="Twitter URL"
                  className="input-field"
                />
              </div>

              <div className="flex flex-col gap-4 pt-2 sm:flex-row lg:col-span-2">
                <button type="button" onClick={() => router.push("/dashboard")} className="btn-secondary w-full px-6 py-3 sm:w-auto">
                  Cancel
                </button>
                <button disabled={loading} className="btn-primary w-full px-6 py-3 sm:w-auto">
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

