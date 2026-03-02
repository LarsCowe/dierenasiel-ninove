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
      <div className="grid grid-cols-4 rounded-lg bg-gray-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setTab(tab.key)}
            className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-2.5 text-sm font-medium transition-all ${
              currentTab === tab.key
                ? "bg-white text-[#1b4332] shadow-sm ring-1 ring-gray-200"
                : "text-gray-500 hover:bg-white/50 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {tab.key === "zorg" && openTodoCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-700">
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
