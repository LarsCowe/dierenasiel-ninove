"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { type ReactNode, useCallback } from "react";

const TABS = [
  { key: "overzicht", label: "Overzicht" },
  { key: "medisch", label: "Medisch" },
  { key: "zorg", label: "Zorg & Opvolging" },
  { key: "bestanden", label: "Bestanden" },
] as const;

export type TabKey = (typeof TABS)[number]["key"];

interface AnimalDetailTabsProps {
  children: Record<TabKey, ReactNode>;
  openTodoCount?: number;
}

export default function AnimalDetailTabs({
  children,
  openTodoCount = 0,
}: AnimalDetailTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = (searchParams.get("tab") as TabKey) || "overzicht";
  const isValidTab = TABS.some((t) => t.key === activeTab);
  const currentTab = isValidTab ? activeTab : "overzicht";

  const setTab = useCallback(
    (tab: TabKey) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "overzicht") {
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setTab(tab.key)}
            className={`relative px-4 py-2 text-sm font-medium transition-colors ${
              currentTab === tab.key
                ? "border-b-2 border-[#1b4332] text-[#1b4332]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {tab.key === "zorg" && openTodoCount > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-700">
                {openTodoCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4">{children[currentTab]}</div>
    </div>
  );
}
