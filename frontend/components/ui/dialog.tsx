"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
};

export function Dialog({ open, onClose, children, className }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn("w-full max-w-lg rounded-[8px] border-0 bg-white p-5 shadow-[rgba(0,0,0,0.22)_3px_5px_30px_0px] sm:p-6", className)}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h3 className={cn("font-[\"SF_Pro_Display\",\"SF_Pro_Text\",\"Helvetica_Neue\",Helvetica,Arial,sans-serif] text-[28px] font-normal leading-[1.14] tracking-[0.196px] text-[#1d1d1f]", className)}>{children}</h3>;
}

export function DialogDescription({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={cn("mt-2 text-sm tracking-[-0.224px] text-[rgba(0,0,0,0.8)]", className)}>{children}</p>;
}

export function DialogFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}>{children}</div>;
}