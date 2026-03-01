"use client";

import { CAMPAIGN_STATUS_LABELS } from "@/lib/constants";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  kooien_geplaatst: "bg-amber-100 text-amber-800",
  in_behandeling: "bg-purple-100 text-purple-800",
  afgerond: "bg-emerald-100 text-emerald-800",
};

export default function CampaignStatusBadge({ status }: { status: string }) {
  const label = CAMPAIGN_STATUS_LABELS[status as keyof typeof CAMPAIGN_STATUS_LABELS] ?? status;
  const color = STATUS_COLORS[status] ?? "bg-gray-100 text-gray-800";

  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {label}
    </span>
  );
}
