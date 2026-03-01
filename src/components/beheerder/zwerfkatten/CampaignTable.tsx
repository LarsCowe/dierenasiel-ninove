"use client";

import Link from "next/link";
import type { StrayCatCampaign } from "@/types";
import { CAMPAIGN_OUTCOME_LABELS } from "@/lib/constants";
import CampaignStatusBadge from "./CampaignStatusBadge";

interface Props {
  campaigns: StrayCatCampaign[];
}

export default function CampaignTable({ campaigns }: Props) {
  if (campaigns.length === 0) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-gray-500">Geen campagnes gevonden.</p>
      </div>
    );
  }

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
          {campaigns.map((campaign) => (
            <tr key={campaign.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-4 py-3 text-sm">
                <Link
                  href={`/beheerder/dieren/zwerfkattenbeleid/${campaign.id}`}
                  className="font-medium text-[#1b4332] hover:underline"
                >
                  {campaign.requestDate}
                </Link>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
