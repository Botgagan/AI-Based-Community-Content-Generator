"use client";

import { useState } from "react";
import { url } from "@/lib/axiosInstance";

export default function InviteModal({
  communityId,
  onClose,
}: {
  communityId: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    try {
      setLoading(true);

      await url.post("/api/invite/send", {
        communityId,
        email,
      });

      alert("Invite sent successfully!");
      onClose(); // close modal
    } catch (err) {
      alert("Failed to send invite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#111827] p-8 rounded-xl w-96">
        <h2 className="text-lg mb-4">Invite Member</h2>

        <input
          type="email"
          placeholder="Enter email"
          className="w-full p-2 rounded text-black mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 rounded"
          >
            Cancel
          </button>

          <button
            onClick={handleInvite}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 rounded"
          >
            {loading ? "Sending..." : "Send Invite"}
          </button>
        </div>
      </div>
    </div>
  );
}