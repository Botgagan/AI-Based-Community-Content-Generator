"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { url } from "@/lib/axiosInstance";
import { uploadImageToCloudinary } from "@/lib/cloudinaryUpload";

type CommunityForm = {
  name: string;
  description: string;
  website: string;
  youtube: string;
  twitter: string;
};

export default function AddCommunityPage() {
  const router = useRouter();
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

    try {
      let imageUrl: string | undefined;

      if (imageFile) {
        imageUrl = await uploadImageToCloudinary(imageFile, "communities");
      }

      const res = await url.post("/api/community/create", {
        name: form.name,
        description: form.description,
        websiteUrl: form.website,
        youtubeUrl: form.youtube,
        twitterUrl: form.twitter,
        imageUrl,
      });

      console.log("Created:", res.data);
      window.dispatchEvent(new Event("community:created"));
      window.dispatchEvent(new Event("community:changed"));
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

      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-app-gradient min-h-screen flex items-center justify-center px-4 sm:px-6 py-14">
      <div className="relative w-full max-w-3xl">
        <div className="pointer-events-none absolute inset-0 flex justify-center">
          <div className="h-[450px] w-[450px] rounded-full bg-gradient-to-br from-[#c7d2fe]/28 via-[#93c5fd]/18 to-transparent" />
        </div>

        <div className="panel relative rounded-2xl p-6 sm:p-10">
          <h1 className="mb-2 text-xl font-semibold text-[#111827] sm:text-2xl">Add Community Details</h1>
          <p className="mb-6 text-sm text-[#6b7280]">
            Provide information about your community to generate AI content.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm text-[#6b7280]">Community Name</label>
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
              <label className="mb-2 block text-sm text-[#6b7280]">Description</label>
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

            <div>
              <label className="mb-2 block text-sm text-[#6b7280]">Community Image</label>
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
                  className="mt-3 h-40 w-full rounded-lg object-cover"
                />
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#6b7280]">Website URL</label>
              <input
                type="url"
                name="website"
                value={form.website}
                onChange={handleChange}
                placeholder="https://yourcommunity.com"
                className="input-field"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#6b7280]">Social Presence</label>

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

            <div className="flex flex-col gap-4 pt-4 sm:flex-row">
              <button type="button" onClick={() => router.push("/dashboard")} className="btn-secondary w-full px-6 py-3 sm:w-auto">
                Back
              </button>

              <button disabled={loading} className="btn-primary w-full px-6 py-3 sm:w-auto">
                {loading ? "Creating..." : "Create Community"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


