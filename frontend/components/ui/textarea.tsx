"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-24 w-full rounded-[11px] border-[3px] border-black/5 bg-[#fafafc] px-3 py-2 text-sm text-[rgba(0,0,0,0.8)] outline-none placeholder:text-[rgba(0,0,0,0.48)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0071e3]",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";