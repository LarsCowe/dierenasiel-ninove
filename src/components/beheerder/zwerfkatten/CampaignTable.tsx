"use client";

import { useRouter } from "next/navigation";
import type { StrayCatCampaign } from "@/types";
import { CAMPAIGN_OUTCOME_LABELS } from "@/lib/constants";
import CampaignStatusBadge from "./CampaignStatusBadge";

interface Props {
  campaigns: StrayCatCampaign[];
}

export default function CampaignTable({ campaigns }: Props) {
  const router = useRouter();

  if (campaigns.length === 0) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-gray-500">Geen campagnes gevonden.</p>
      </div>
    );
  }

  const navigate = (href: string, event: React.MouseEvent | React.KeyboardEvent) => {
    // Respecteer Ctrl/Cmd/middle-click voor "open in nieuw tabblad".
    const mouseEvent = event as React.MouseEvent;
    if (mouseEvent.ctrlKey || mouseEvent.metaKey || mouseEvent.button === 1) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    router.push(href);
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Datum verzoek</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Gemeente</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Adres</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Uitkomst</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {campaigns.map((campaign) => {
            const href = `/beheerder/dieren/zwerfkattenbeleid/${campaign.id}`;
            return (
              <tr
                key={campaign.id}
                tabIndex={0}
                role="link"
                onClick={(e) => navigate(href, e)}
                onAuxClick={(e) => {
                  if (e.button === 1) navigate(href, e);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(href, e);
                  }
                }}
                className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
              >
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-[#1b4332]">
                  {campaign.requestDate}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{campaign.municipality}</td>
                <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-700">{campaign.address}</td>
                <td className="px-4 py-3 text-sm">
                  <CampaignStatusBadge status={campaign.status} />
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {campaign.outcome
                    ? CAMPAIGN_OUTCOME_LABELS[campaign.outcome as keyof typeof CAMPAIGN_OUTCOME_LABELS] ?? campaign.outcome
                    : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
