"use client";

export default function PageLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="panel w-full max-w-sm rounded-[8px] p-6 text-center">
        <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-4 border-[#0071e3]/25 border-t-[#0071e3]" />
        <p className="text-sm text-[rgba(0,0,0,0.8)]">{label}</p>
      </div>
    </div>
  );
}