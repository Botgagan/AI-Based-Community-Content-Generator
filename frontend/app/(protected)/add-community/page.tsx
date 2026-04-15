"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { url } from "@/lib/axiosInstance";
import { uploadImageToCloudinary } from "@/lib/cloudinaryUpload";
import { useUI } from "@/components/UIProvider";

type CommunityForm = {
  name: string;
  description: string;
  website: string;
  youtube: string;
  twitter: string;
};

export default function AddCommunityPage() {
  const router = useRouter();
  const { toast, showLoader, hideLoader } = useUI();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const [form, setForm] = useState<CommunityForm>({
    name: "",
    description: "",
    website: "",
    youtube: "",
    twitter: "",
  });

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
      let imageUrl: string | undefined;

      if (imageFile) {
        imageUrl = await uploadImageToCloudinary(imageFile, "communities");
      }

      await url.post("/api/community/create", {
        name: form.name,
        description: form.description,
        websiteUrl: form.website,
        youtubeUrl: form.youtube,
        twitterUrl: form.twitter,
        imageUrl,
      });

      window.dispatchEvent(new Event("community:created"));
      window.dispatchEvent(new Event("community:changed"));
      toast({ title: "Community created", variant: "success" });
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error("Create community error:", err);

      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : "Failed to create community. Please login again.";

      toast({ title: "Create failed", description: message, variant: "error" });
    } finally {
      setLoading(false);
      hideLoader();
    }
  };

  return (
    <div className="px-1 py-2">
      <div className="mx-auto max-w-5xl">
        <div className="panel p-6 sm:p-8">
          <div className="mb-6 rounded-2xl bg-[linear-gradient(120deg,#0f1738,#1b2d74)] p-5 text-white">
            <p className="text-xs uppercase tracking-[0.14em] text-white/70">Onboarding</p>
            <h1 className="mt-1 font-bold text-3xl font-bold">Create Community</h1>
            <p className="mt-1 text-sm text-white/85">
              Set up your workspace once. We use this data to generate platform-ready AI content.
            </p>
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
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="input-field"
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
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
                  Back
                </button>

                <button disabled={loading} className="btn-primary w-full px-6 py-3 sm:w-auto">
                  {loading ? "Creating..." : "Create Community"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}




