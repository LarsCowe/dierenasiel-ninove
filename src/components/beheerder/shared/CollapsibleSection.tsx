"use client";

import { useState } from "react";

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: React.ReactNode;
  variant?: "default" | "danger";
}

export default function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
  badge,
  variant = "default",
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  const borderColor = variant === "danger" ? "border-red-200" : "border-gray-100";
  const bgColor = variant === "danger" ? "bg-red-50" : "bg-white";
  const titleColor = variant === "danger" ? "text-red-800" : "text-[#1b4332]";

  return (
    <div className={`overflow-hidden rounded-xl border ${borderColor} ${bgColor} shadow-sm`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-gray-50/50"
      >
        <div className="flex items-center gap-3">
          <h2 className={`font-heading text-lg font-bold ${titleColor}`}>
            {title}
          </h2>
          {badge}
        </div>
        <svg
          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-gray-100 px-6 pb-6 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}
