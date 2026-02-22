"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

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
  const [form, setForm] = useState<CommunityForm>({
    name: "",
    description: "",
    website: "",
    youtube: "",
    twitter: "",
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name as keyof CommunityForm]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    await new Promise((r) => setTimeout(r, 600));

    const newCommunity = {
      id: crypto.randomUUID(),
      ...form,
    };

    const existing = JSON.parse(localStorage.getItem("communities") || "[]");

    localStorage.setItem(
      "communities",
      JSON.stringify([...existing, newCommunity])
    );

    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard");
    }, 1000);
  };

  return (
    <div className="bg-[#0B1120] min-h-screen flex items-center justify-center px-4 sm:px-6 py-14">

      <div className="w-full max-w-3xl relative">
        <div className="absolute inset-0 flex justify-center pointer-events-none">
          <div className="w-[450px] h-[450px] bg-gradient-to-br from-blue-600/30 to-purple-600/20 rounded-full" />
        </div>

        <div className="relative bg-[#111827] border border-gray-800 rounded-2xl p-6 sm:p-10 shadow-xl">
          <h1 className="text-xl sm:text-2xl font-semibold text-white mb-2">
            Add Community Details
          </h1>

          <p className="text-gray-400 text-sm mb-6">
            Provide information about your community to generate AI content.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <label className="block text-sm text-gray-400 mb-2">Community Name</label>
              <input
                required
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. ISKCON"
                className="w-full bg-[#0F172A] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Description</label>
              <textarea
                required
                rows={4}
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Short description..."
                className="w-full bg-[#0F172A] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Website URL</label>
              <input
                type="url"
                name="website"
                value={form.website}
                onChange={handleChange}
                placeholder="https://yourcommunity.com"
                className="w-full bg-[#0F172A] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Social Presence</label>

              <input
                type="url"
                name="youtube"
                value={form.youtube}
                onChange={handleChange}
                placeholder="YouTube URL"
                className="w-full mb-3 bg-[#0F172A] border border-gray-700 rounded-lg px-4 py-3 text-white"
              />

              <input
                type="url"
                name="twitter"
                value={form.twitter}
                onChange={handleChange}
                placeholder="Twitter URL"
                className="w-full bg-[#0F172A] border border-gray-700 rounded-lg px-4 py-3 text-white"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">

              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg w-full sm:w-auto"
              >
                Back
              </button>

              <button
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg w-full sm:w-auto"
              >
                {loading ? "Creating..." : "Create Community"}
              </button>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
}




