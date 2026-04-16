"use client";

export default function PageLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="panel w-full max-w-sm rounded-[8px] p-6 text-center">
        <div className="relative mx-auto mb-3 h-12 w-12">
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,#0071e3,transparent_70%)] opacity-20 animate-pulse" />
          <div className="absolute inset-0 m-auto h-12 w-12 animate-spin rounded-full border-[3px] border-[#0071e3]/20 border-t-[#0071e3]" />
        </div>
        <p className="text-sm text-[rgba(0,0,0,0.8)]">{label}</p>
      </div>
    </div>
  );
}