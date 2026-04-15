"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "destructive" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-[8px] border px-4 py-2 text-sm font-normal tracking-[-0.224px] transition disabled:pointer-events-none disabled:opacity-50",
        variant === "default" && "border-transparent bg-[#0071e3] text-white hover:brightness-105",
        variant === "secondary" && "rounded-[980px] border-[#0066cc] bg-transparent text-[#0066cc] hover:bg-[#0066cc]/10",
        variant === "destructive" && "border-transparent bg-[#1d1d1f] text-white hover:bg-black",
        variant === "ghost" && "border-transparent bg-transparent text-[rgba(0,0,0,0.8)] hover:bg-black/5",
        className
      )}
      {...props}
    />
  );
}