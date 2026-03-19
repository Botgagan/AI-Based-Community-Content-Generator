"use client";

import { useState } from "react";
import { url } from "@/lib/axiosInstance";

export default function InviteModal({
  communityId,
  onClose,
  onSuccess,
}: {
  communityId: string;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInvite = async () => {
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await url.post("/api/invite/send", {
        communityId,
        email: email.trim(),
      });

      onSuccess?.();
      onClose();
    } catch {
      setError("Failed to send invite. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="panel w-full max-w-md rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-2 text-lg font-semibold text-[#111827]">Invite Member</h2>
        <p className="mb-4 text-sm text-[#6b7280]">Send an invite link to add someone to this community.</p>

        <input
          type="email"
          placeholder="name@example.com"
          className="input-field"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError("");
          }}
        />

        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}

        <div className="mt-4 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary px-4 py-2">
            Cancel
          </button>

          <button onClick={handleInvite} disabled={loading} className="btn-primary px-4 py-2 disabled:opacity-50">
            {loading ? "Sending..." : "Send Invite"}
          </button>
        </div>
      </div>
    </div>
  );
}

